import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { signIn, resendVerificationEmail } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  submit?: string;
}

interface ResendState {
  lastSent: Date | null;
  count: number;
}

export const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendState, setResendState] = useState<ResendState>({
    lastSent: null,
    count: 0
  });
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined, submit: undefined }));
  };

  const handleResendVerification = async () => {
    try {
      // Check rate limiting
      if (resendState.count >= 3 && resendState.lastSent) {
        const hoursSinceLastSent = (new Date().getTime() - resendState.lastSent.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastSent < 1) {
          setErrors({
            submit: 'Too many attempts. Please wait before requesting another verification email.'
          });
          return;
        }
        // Reset count after an hour
        setResendState({ lastSent: null, count: 0 });
      }

      setIsLoading(true);
      await resendVerificationEmail(formData.email);
      
      setResendState(prev => ({
        lastSent: new Date(),
        count: prev.count + 1
      }));

      setErrors({ submit: `Verification email resent to ${formData.email}` });
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to resend verification email' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!supabase) {
      setErrors({
        submit: 'Authentication is not configured. Please connect to Supabase first.',
      });
      return;
    }
    
    // Validate fields
    const newErrors: FormErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    try {
      const { user, profile } = await signIn(formData.email, formData.password);
      
      if (!user || !profile) {
        throw new Error('Login failed. Please try again.');
      }

      // Redirect based on role
      navigate(`/dashboard/${profile.role}/overview`, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Login failed. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className={`
              w-full px-4 py-2 rounded-md border
              ${errors.email ? 'border-red-500' : 'border-gray-300'}
              focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500
            `}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="mt-1 relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={handleInputChange}
            className={`
              w-full px-4 py-2 rounded-md border
              ${errors.password ? 'border-red-500' : 'border-gray-300'}
              focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500
            `}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>
      </div>

      {errors.submit && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
            <div className="flex-1">
              <p className="text-sm text-red-600">{errors.submit}</p>
              {errors.submit.includes('verify your email') && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="mt-2 inline-flex items-center text-sm text-red-700 hover:text-red-800"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Resend verification email
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-sm text-gray-400 hover:text-gray-500 cursor-not-allowed"
          disabled
          aria-label="Forgot password feature coming soon"
        >
          Forgot password?
        </button>
        <Link
          to="/auth/signup"
          className="text-sm text-yellow-600 hover:text-yellow-700"
        >
          Don't have an account?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`
          w-full px-4 py-2 text-white bg-black rounded-md
          font-semibold shadow-sm
          ${isLoading
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2'
          }
          transition-colors
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          </span>
        ) : (
          'Sign in'
        )}
      </button>
    </form>
  );
};