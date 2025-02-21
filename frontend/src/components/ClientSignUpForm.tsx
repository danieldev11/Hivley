import React from 'react';
import { SignUpForm } from './SignUpForm';

export const ClientSignUpForm: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-dark">
            Join as a Client
          </h1>
          <p className="mt-2 text-gray-600">
            Create your account to find and hire student talent
          </p>
        </div>
        <div className="max-w-md mx-auto">
          <SignUpForm 
            role="client"
            additionalFields={[
              {
                name: 'university',
                label: 'University',
                type: 'text',
                required: true,
                placeholder: 'Enter your university name'
              },
              {
                name: 'interests',
                label: 'Services Interested In',
                type: 'multiselect',
                required: true,
                options: [
                  { value: 'tutoring', label: 'Tutoring' },
                  { value: 'programming', label: 'Programming Help' },
                  { value: 'design', label: 'Design Work' },
                  { value: 'writing', label: 'Writing & Editing' },
                  { value: 'music', label: 'Music Lessons' },
                  { value: 'language', label: 'Language Learning' },
                  { value: 'other', label: 'Other' }
                ],
                placeholder: 'Select services you\'re interested in'
              },
              {
                name: 'projectTypes',
                label: 'Types of Projects',
                type: 'multiselect',
                required: true,
                options: [
                  { value: 'academic', label: 'Academic Assignments' },
                  { value: 'personal', label: 'Personal Projects' },
                  { value: 'research', label: 'Research Work' },
                  { value: 'creative', label: 'Creative Projects' },
                  { value: 'other', label: 'Other' }
                ]
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
};