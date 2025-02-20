import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, AlertCircle, Mail, Loader2 } from 'lucide-react';
import { signUp, resendVerificationEmail } from '../lib/auth';

interface SignUpFormProps {
  role: 'provider' | 'client';
}

interface VerificationState {
  showVerification: boolean;
  email: string;
}

interface ValidationState {
  hasMinLength: boolean;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ role }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({
    hasMinLength: false,
  });
  const [verification, setVerification] = useState<VerificationState>({
    showVerification: false,
    email: ''
  });
  const [resendState, setResendState] = useState({
    lastSent: new Date(),
    count: 1,
    isLoading: false,
    error: ''
  });

  const validatePassword = (password: string): ValidationState => ({
    hasMinLength: password.length >= 6,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    setError('');

    if (name === 'password') {
      setValidation(validatePassword(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate password
    if (!validation.hasMinLength) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Basic validation
      if (!formData.fullName || !formData.email || !formData.password) {
        throw new Error('Please fill in all fields');
      }

      // Sign up using Supabase
      await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: role
      });

      // Show verification message
      setVerification({
        showVerification: true,
        email: formData.email
      });
      
    } catch (err) {
      // Handle specific error cases
      if (err instanceof Error) {
        if (err.message.includes('already registered') || err.message.includes('already exists')) {
          setError('An account with this email already exists. Please log in instead.');
        } else if (err.message.includes('weak_password')) {
          setError('Password is too weak. Please ensure it is at least 6 characters long.');
        } else if (err.message.includes('Invalid email domain')) {
          setError('Only @psu.edu and @wm.edu email addresses are allowed.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      // Check rate limiting
      if (resendState.count >= 3) {
        const hoursSinceLastSent = (new Date().getTime() - resendState.lastSent.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastSent < 1) {
          setResendState(prev => ({
            ...prev,
            error: 'Too many attempts. Please wait an hour before requesting another verification email.'
          }));
          return;
        }
        // Reset count after an hour
        setResendState({
          lastSent: new Date(),
          count: 1,
          isLoading: false,
          error: ''
        });
      }

      setResendState(prev => ({ ...prev, isLoading: true, error: '' }));
      await resendVerificationEmail(verification.email);
      
      setResendState(prev => ({
        ...prev,
        lastSent: new Date(),
        count: prev.count + 1,
        isLoading: false,
        error: ''
      }));

      // Show success message
      setError('Verification email resent successfully. Please check your inbox.');
    } catch (error) {
      setResendState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to resend verification email. Please try again later.'
      }));
    }
  };

  if (verification.showVerification) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Mail className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Verify your email</h2>
        <p className="text-gray-600">
          We've sent a verification link to <strong>{verification.email}</strong>
        </p>
        <p className="text-sm text-gray-500">
          Please check your inbox and click the verification link to complete your registration.
        </p>
        <div className="space-y-4">
          <button
            onClick={handleResendVerification}
            disabled={resendState.isLoading}
            className={`
              inline-flex items-center px-4 py-2 text-sm font-medium text-primary 
              hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {resendState.isLoading ? (
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
          {resendState.error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {resendState.error}
            </div>
          )}
        </div>
        <Link 
          to="/auth" 
          className="inline-block text-primary hover:text-primary/80"
        >
          Return to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="signup-form">
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md flex items-start" role="alert">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p>{error}</p>
            {error.includes('already exists') && (
              <Link 
                to="/auth" 
                className="block mt-2 text-sm font-medium text-red-700 hover:text-red-800"
              >
                Click here to log in →
              </Link>
            )}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-yellow-500 focus:ring-yellow-500"
          required
          aria-required="true"
          data-testid="fullname-input"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-yellow-500 focus:ring-yellow-500"
          required
          aria-required="true"
          data-testid="email-input"
          disabled={isLoading}
          placeholder="Enter your @psu.edu or @wm.edu email"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-yellow-500 focus:ring-yellow-500"
            required
            aria-required="true"
            data-testid="password-input"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
          </button>
        </div>
        <div className="mt-2">
          <div className="flex items-center space-x-2">
            {validation.hasMinLength ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-gray-400" />
            )}
            <span className={`text-sm ${validation.hasMinLength ? 'text-green-500' : 'text-gray-500'}`}>
              At least 6 characters
            </span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className={`
          w-full bg-black text-white py-2 px-4 rounded-md 
          transition-all duration-200
          ${isLoading || !validation.hasMinLength 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-800 active:transform active:scale-[0.99]'
          }
        `}
        data-testid="signup-submit"
        disabled={isLoading || !validation.hasMinLength}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Signing up...
          </span>
        ) : (
          `Sign Up as ${role === 'provider' ? 'Provider' : 'Client'}`
        )}
      </button>

      <div className="text-center">
        <Link 
          to="/auth" 
          className="text-sm text-yellow-600 hover:text-yellow-700"
          data-testid="login-link"
        >
          Already have an account? Log In
        </Link>
      </div>
    </form>
  );
};