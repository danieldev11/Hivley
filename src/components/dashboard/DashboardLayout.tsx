import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLogoNavigation } from '../../hooks/useLogoNavigation';
import { 
  LayoutDashboard, 
  UserCircle, 
  Briefcase, 
  Calendar, 
  MessageSquare,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Search,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { signOut } from '../../lib/auth';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { handleNavigation, isLoading, isActive } = useLogoNavigation();

  // Determine if we're in the provider or client dashboard
  const isDashboardType = location.pathname.includes('/dashboard/provider') ? 'provider' : 'client';
  const basePath = `/dashboard/${isDashboardType}`;

  const navItems = [
    { label: 'Overview', path: `${basePath}/overview`, icon: LayoutDashboard },
    { label: 'Profile', path: `${basePath}/profile`, icon: UserCircle },
    { label: isDashboardType === 'provider' ? 'My Services' : 'Find Services', 
      path: isDashboardType === 'provider' ? `${basePath}/services` : '/services', 
      icon: Briefcase },
    { label: 'Bookings', path: `${basePath}/bookings`, icon: Calendar },
    { label: 'Messages', path: `${basePath}/messages`, icon: MessageSquare },
    { label: 'Settings', path: `${basePath}/settings`, icon: SettingsIcon },
  ];

  // Add services navigation for providers
  const providerNavItems = isDashboardType === 'provider' ? [
    ...navItems,
    { 
      label: 'Service Marketplace', 
      path: '/services', 
      icon: ArrowRight,
      highlight: true 
    }
  ] : navItems;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleNavigation}
            className={`
              flex items-center relative
              ${isActive ? 'hover:opacity-90' : 'cursor-default'}
              transition-all duration-200
            `}
          >
            <img src="/Hivley_bee.png" alt="" className="h-8 w-auto" />
            <span className="text-lg font-bold text-primary-dark ml-2">Hivley</span>
            
            {isLoading && (
              <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              </div>
            )}
            
            {isActive && !isLoading && (
              <div className="absolute -right-2 -top-1 w-2 h-2 bg-green-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
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
            <button 
              onClick={handleNavigation}
              className={`
                flex items-center relative
                ${isActive ? 'hover:opacity-90' : 'cursor-default'}
                transition-all duration-200
              `}
            >
              <img src="/Hivley_bee.png" alt="" className="h-8 w-auto" />
              <span className="text-lg font-bold text-primary-dark ml-2">Hivley</span>
              
              {isLoading && (
                <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                </div>
              )}
              
              {isActive && !isLoading && (
                <div className="absolute -right-2 -top-1 w-2 h-2 bg-green-500 rounded-full" />
              )}
            </button>
          </div>

          {/* Main container for navigation and sign out */}
          <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {providerNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center px-4 py-2 rounded-lg transition-colors duration-200
                    ${location.pathname === item.path 
                      ? 'bg-primary text-white' 
                      : item.highlight
                        ? 'text-primary border border-primary hover:bg-primary/5'
                        : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Sign Out Button - Now in a fixed position at the bottom */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};