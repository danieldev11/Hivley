import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  Lock,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  AlertCircle
} from 'lucide-react';
import { signOut } from '../../lib/auth';
import { isAdmin, isSuperAdmin } from '../../lib/admin';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: 'Overview', path: '/admin/overview', icon: LayoutDashboard },
  { label: 'User Management', path: '/admin/users', icon: Users },
  { label: 'Content Moderation', path: '/admin/moderation', icon: Shield },
  { label: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
  { label: 'Security Logs', path: '/admin/security-logs', icon: Lock, requiresSuperAdmin: true },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [adminStatus, setAdminStatus] = useState<{
    isAdmin: boolean;
    isSuperAdmin: boolean;
  }>({ isAdmin: false, isSuperAdmin: false });
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      setIsLoading(true);
      const [adminCheck, superAdminCheck] = await Promise.all([
        isAdmin(),
        isSuperAdmin()
      ]);

      setAdminStatus({
        isAdmin: adminCheck,
        isSuperAdmin: superAdminCheck
      });

      if (!adminCheck) {
        navigate('/auth', { replace: true });
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/auth', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!adminStatus.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access the admin area.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <Link to="/admin" className="text-xl font-bold text-primary-dark">
            Admin Dashboard
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 
            transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <Link to="/admin" className="text-xl font-bold text-primary-dark">
              Admin Dashboard
            </Link>
          </div>

          {/* Admin Status */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Shield className={`h-5 w-5 ${adminStatus.isSuperAdmin ? 'text-primary' : 'text-gray-400'}`} />
              <span className="text-sm font-medium text-gray-700">
                {adminStatus.isSuperAdmin ? 'Super Admin' : 'Admin'}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {navItems
              .filter(item => !item.requiresSuperAdmin || adminStatus.isSuperAdmin)
              .map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center px-4 py-2 rounded-lg transition-colors
                    ${location.pathname === item.path
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              ))}
          </nav>

          {/* Sign Out Button */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};