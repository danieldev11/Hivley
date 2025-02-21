import React, { useState } from 'react';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import { makeMeSuperAdmin } from '../../lib/admin';

export const AdminInitialization: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleMakeSuperAdmin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await makeMeSuperAdmin();
      setSuccess(true);
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize admin access');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Admin Access Required
          </h1>
          <p className="text-gray-600">
            You need admin privileges to access this area. Click below to initialize your admin access.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-lg">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-lg text-center">
            Admin access granted successfully! Redirecting...
          </div>
        )}

        <button
          onClick={handleMakeSuperAdmin}
          disabled={isLoading || success}
          className="w-full flex items-center justify-center px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Initializing...
            </>
          ) : (
            'Initialize Admin Access'
          )}
        </button>

        <p className="mt-4 text-sm text-gray-500 text-center">
          This action will grant you super admin privileges. Use this responsibly.
        </p>
      </div>
    </div>
  );
};