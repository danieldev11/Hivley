import React from 'react';
import { Link } from 'react-router-dom';
import { useLogoNavigation } from '../hooks/useLogoNavigation';
import { Loader2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { handleNavigation, isLoading, isActive } = useLogoNavigation();

  return (
    <header className="bg-white border-b border-gray-100">
      <nav className="w-full">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and company name */}
          <button 
            onClick={handleNavigation}
            className={`
              flex items-center pl-4 relative
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
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              </div>
            )}
            
            {/* Active Indicator */}
            {isActive && !isLoading && (
              <div className="absolute -right-2 -top-1 w-2 h-2 bg-green-500 rounded-full" />
            )}
          </button>

          {/* Right side - Auth buttons */}
          <div className="flex items-center pr-4">
            <Link
              to="/auth"
              className="px-5 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
            >
              Login
            </Link>
            <Link
              to="/auth/signup"
              className="ml-4 px-5 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 shadow-sm transition-colors duration-200"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};