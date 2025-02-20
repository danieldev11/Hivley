import React from 'react';
import { SignUpForm } from './SignUpForm';

export const ProviderSignUpForm: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-dark">
            Join as a Service Provider
          </h1>
          <p className="mt-2 text-gray-600">
            Create your account to start offering your services
          </p>
        </div>
        <div className="max-w-md mx-auto">
          <SignUpForm role="provider" />
        </div>
      </div>
    </div>
  );
};