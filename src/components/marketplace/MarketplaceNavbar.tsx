import React, { useState, useEffect } from 'react';
import { useLogoNavigation } from '../../hooks/useLogoNavigation';
import { getCurrentUser, signOut } from '../../lib/auth';
import { 
  Bell, 
  ChevronDown, 
  Loader2, 
  Menu, 
  MessageSquare, 
  User,
  Search,
  BookOpen,
  Calendar,
  Settings
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const MarketplaceNavbar: React.FC = () => {
  const { handleNavigation, isLoading, isActive } = useLogoNavigation();
  const [user, setUser] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };

    loadUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const navItems = [
    { icon: BookOpen, label: 'Browse Services', href: '/services' },
    { icon: Calendar, label: 'My Bookings', href: '/dashboard/client/bookings' },
    { icon: MessageSquare, label: 'Messages', href: '/dashboard/client/messages' },
  ];

  const profileImage = user?.metadata?.preferences?.profileImage;

  return (
    <header className="bg-white border-b border-gray-100">
      <nav className="w-full">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center pl-4">
            <button 
              onClick={handleNavigation}
              className={`
                flex items-center relative
                ${isActive ? 'hover:opacity-90' : 'cursor-default'}
                transition-all duration-200
              `}
              aria-label={isActive ? 'Go to dashboard' : 'Hivley'}
            >
              <img 
                src="/Hivley_bee.png" 
                alt="" 
                className="h-10 w-auto object-contain"
                aria-hidden="true"
              />
              <span className="text-xl font-bold text-primary-dark ml-2">Hivley</span>
              
              {isLoading && (
                <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                </div>
              )}
              
              {isActive && !isLoading && (
                <div className="absolute -right-2 -top-1 w-2 h-2 bg-green-500 rounded-full" />
              )}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center ml-8 space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center text-gray-600 hover:text-primary transition-colors"
                >
                  <item.icon className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - User Profile & Actions */}
          <div className="flex items-center pr-4">
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-primary transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700">
                      {user?.profile?.full_name || 'Loading...'}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                    <Link
                      to="/dashboard/client/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Your Profile
                    </Link>
                    <Link
                      to="/dashboard/client/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-600 hover:text-primary transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-100">
            <div className="py-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center px-4 py-2 text-base text-gray-700 hover:bg-gray-50"
                >
                  <item.icon className="h-5 w-5 mr-2" />
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-gray-100 my-1"></div>
              <Link
                to="/dashboard/client/profile"
                className="flex items-center px-4 py-2 text-base text-gray-700 hover:bg-gray-50"
              >
                <User className="h-5 w-5 mr-2" />
                Your Profile
              </Link>
              <Link
                to="/dashboard/client/settings"
                className="flex items-center px-4 py-2 text-base text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </Link>
              <div className="border-t border-gray-100 my-1"></div>
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-2 text-base text-red-600 hover:bg-gray-50"
              >
                <User className="h-5 w-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};