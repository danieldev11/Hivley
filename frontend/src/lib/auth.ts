import { supabase, isSupabaseConfigured } from './supabase';

const ALLOWED_DOMAINS = ['psu.edu', 'wm.edu'];
const VERIFICATION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function validateEmailDomain(email: string): boolean {
  return ALLOWED_DOMAINS.some(domain => email.toLowerCase().endsWith(`@${domain}`));
}

async function checkVerificationStatus(userId: string): Promise<boolean> {
  if (!supabase) return false;

  const { data: user, error } = await supabase.auth.admin.getUserById(userId);
  
  if (error || !user) {
    console.error('Error checking verification status:', error);
    return false;
  }

  return !!user.user.email_confirmed_at;
}

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  role: 'provider' | 'client';
}

export async function signUp({ email, password, fullName, role }: SignUpData) {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase is not configured. Please connect to Supabase first.');
  }

  console.log('Attempting to resend verification email to:', email);

  // Validate email domain
  if (!validateEmailDomain(email)) {
    throw new Error('Only @psu.edu and @wm.edu email addresses are allowed.');
  }

  // Validate password length
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  console.log('Starting signup process for:', email);

  // First, create the auth user with metadata
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth`,
      data: {
        signup_timestamp: new Date().toISOString(),
        full_name: fullName,
        role,
      },
    },
  });

  if (authError) {
    console.error('Signup error:', authError);
    throw new Error(authError.message);
  }

  if (!authData.user) {
    console.error('No user data returned from signup');
    throw new Error('Sign up failed');
  }

  console.log('Auth user created, waiting for verification...');

  // Create profile only after email verification
  try {
    await supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, 'Session:', !!session);

      if (event === 'SIGNED_IN' && session?.user.email_confirmed_at) {
        console.log('User verified, creating profile...');

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: session.user.id,
              full_name: fullName,
              role,
            },
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw profileError;
        }

        // Create user metadata
        const { error: metadataError } = await supabase
          .from('user_metadata')
          .insert([
            {
              id: session.user.id,
              last_login: new Date().toISOString(),
              preferences: {},
            },
          ]);

        if (metadataError) {
          console.error('Metadata creation error:', metadataError);
          throw metadataError;
        }
      }
    });

    return authData;
  } catch (error) {
    console.error('Profile creation error:', error);
    throw new Error('Failed to complete signup. Please try again or contact support.');
  }
}

export async function signIn(email: string, password: string) {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase is not configured. Please connect to Supabase first.');
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
      }
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password');
      }
      throw error;
    }

    if (!data.user) {
      throw new Error('Login failed');
    }

    // Check email verification status
    if (!data.user.email_confirmed_at) {
      throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      throw new Error('Failed to load user profile');
    }

    // Update last login
    await supabase
      .from('user_metadata')
      .upsert({
        id: data.user.id,
        last_login: new Date().toISOString(),
      })
      .eq('id', data.user.id);

    return { user: data.user, profile };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

export async function signOut() {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    // First check if we have a session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email_confirmed_at) {
      return null;
    }

    const user = session.user;

    // Get profile and metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const { data: metadata } = await supabase
      .from('user_metadata')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return {
      ...user,
      profile,
      metadata
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    // Sign out on error to clear any invalid state
    await supabase.auth.signOut();
    return null;
  }
}

export async function resendVerificationEmail(email: string) {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase is not configured');
  }

  // Validate email domain
  if (!validateEmailDomain(email)) {
    console.error('Invalid email domain:', email);
    throw new Error('Only @psu.edu and @wm.edu email addresses are allowed.');
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) {
    console.error('Error resending verification email:', error);
    throw error;
  }

  console.log('Verification email resent successfully');
}

export async function deleteUser(userId: string) {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase is not configured');
  }

  try {
    // Get the current session to check if we're deleting our own account
    const { data: { session } } = await supabase.auth.getSession();
    const isCurrentUser = session?.user?.id === userId;

    // If it's the current user, sign them out first
    if (isCurrentUser) {
      await supabase.auth.signOut();
    }

    // Call the delete_user RPC function
    const { error } = await supabase.rpc('delete_user', {
      user_id: userId
    });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user. Please try again or contact support if the issue persists.');
  }
}