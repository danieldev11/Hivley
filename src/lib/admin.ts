import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export interface AdminUser {
  id: string;
  profile_id: string;
  role_id: string;
  is_active: boolean;
  last_login: string | null;
  failed_login_attempts: number;
  lockout_until: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string;
  };
  role?: {
    role: string;
    description: string;
    permissions: Record<string, any>;
  };
}

export interface AdminSession {
  id: string;
  admin_id: string;
  token: string;
  expires_at: string;
  created_at: string;
  last_activity_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  table_name: string;
  record_id: string;
  changes: Record<string, any>;
  ip_address: string;
  user_agent: string | null;
  created_at: string;
  admin?: {
    profile?: {
      full_name: string;
    };
  };
}

export interface SecurityLog {
  id: string;
  admin_id: string | null;
  event_type: string;
  ip_address: string;
  user_agent: string | null;
  details: Record<string, any> | null;
  created_at: string;
  admin?: {
    profile?: {
      full_name: string;
    };
  };
}

export interface ModerationQueueItem {
  id: string;
  content_type: string;
  content_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  reporter_id: string | null;
  reason: string | null;
  moderator_id: string | null;
  moderation_notes: string | null;
  created_at: string;
  updated_at: string;
  reporter?: {
    full_name: string;
  };
  moderator?: {
    profile?: {
      full_name: string;
    };
  };
}

// Add new function to get user counts
export async function getUserCounts(): Promise<{
  total: number;
  active: number;
}> {
  try {
    // Get total users count
    const { count: total } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get active users count (users who logged in within the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: active } = await supabase
      .from('user_metadata')
      .select('*', { count: 'exact', head: true })
      .gte('last_login', thirtyDaysAgo.toISOString());

    return {
      total: total || 0,
      active: active || 0
    };
  } catch (error) {
    console.error('Error getting user counts:', error);
    throw new Error('Failed to get user counts');
  }
}

// Check if user is an admin
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { data } = await supabase
      .from('admin_users')
      .select('id')
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    return !!data;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Check if user is a super admin
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { data } = await supabase
      .from('admin_users')
      .select(`
        id,
        role:admin_roles!inner(
          role
        )
      `)
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    return data?.role?.role === 'super_admin';
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
}

// Get admin user details
export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('admin_users')
      .select(`
        *,
        profile:profiles!admin_users_profile_id_fkey(
          full_name
        ),
        role:admin_roles!admin_users_role_id_fkey(
          role,
          description,
          permissions
        )
      `)
      .eq('profile_id', user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting admin user:', error);
    return null;
  }
}

// Get all admin users
export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select(`
        *,
        profile:profiles!admin_users_profile_id_fkey(
          full_name
        ),
        role:admin_roles!admin_users_role_id_fkey(
          role,
          description,
          permissions
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting admin users:', error);
    throw new Error('Failed to load admin users');
  }
}

// Delete admin user
export async function deleteAdminUser(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting admin user:', error);
    throw new Error('Failed to delete admin user');
  }
}

// Update admin user
export async function updateAdminUser(
  id: string,
  data: Partial<AdminUser>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('admin_users')
      .update(data)
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating admin user:', error);
    throw new Error('Failed to update admin user');
  }
}

// Make current user a super admin
export async function makeMeSuperAdmin(): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('You must be logged in to become an admin');
    }

    const { error } = await supabase.rpc('make_user_admin', {
      user_id: user.id
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error making user super admin:', error);
    throw new Error('Failed to make you a super admin. Please try again.');
  }
}

// Get audit logs
export async function getAuditLogs(
  limit = 50,
  offset = 0
): Promise<{
  logs: AuditLog[];
  total: number;
}> {
  try {
    const { data, error, count } = await supabase
      .from('admin_audit_logs')
      .select(`
        *,
        admin:admin_users(
          profile:profiles(
            full_name
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      logs: data || [],
      total: count || 0
    };
  } catch (error) {
    console.error('Error getting audit logs:', error);
    throw new Error('Failed to load audit logs');
  }
}

// Get security logs
export async function getSecurityLogs(
  limit = 50,
  offset = 0
): Promise<{
  logs: SecurityLog[];
  total: number;
}> {
  try {
    const { data, error, count } = await supabase
      .from('admin_security_logs')
      .select(`
        *,
        admin:admin_users(
          profile:profiles(
            full_name
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      logs: data || [],
      total: count || 0
    };
  } catch (error) {
    console.error('Error getting security logs:', error);
    throw new Error('Failed to load security logs');
  }
}

// Get moderation queue
export async function getModerationQueue(
  status?: 'pending' | 'approved' | 'rejected' | 'flagged',
  limit = 50,
  offset = 0
): Promise<{
  items: ModerationQueueItem[];
  total: number;
}> {
  try {
    let query = supabase
      .from('content_moderation_queue')
      .select(`
        *,
        reporter:profiles!content_moderation_queue_reporter_id_fkey(
          full_name
        ),
        moderator:admin_users(
          profile:profiles(
            full_name
          )
        )
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      items: data || [],
      total: count || 0
    };
  } catch (error) {
    console.error('Error getting moderation queue:', error);
    throw new Error('Failed to load moderation queue');
  }
}

// Update moderation status
export async function updateModerationStatus(
  id: string,
  status: 'approved' | 'rejected' | 'flagged',
  notes?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('content_moderation_queue')
      .update({
        status,
        moderation_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating moderation status:', error);
    throw new Error('Failed to update moderation status');
  }
}