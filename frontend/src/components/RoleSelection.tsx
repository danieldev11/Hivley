import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Briefcase, ArrowRight } from 'lucide-react';

export const RoleSelection: React.FC = () => {
  return (
    <div className="min-h-screen bg-secondary-light/30">
      {/* Header */}
      <Link 
        to="/"
        className="absolute top-0 left-0 flex items-center hover:opacity-90 transition-opacity p-4"
        aria-label="Go to homepage"
      >
        <img 
          src="/Hivley_bee.png" 
          alt="" 
          className="h-10 w-auto object-contain"
          aria-hidden="true"
        />
        <span className="text-xl font-bold text-primary-dark ml-2">Hivley</span>
      </Link>

      <div className="max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-primary-dark sm:text-4xl">
            How would you like to use Hivley?
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Choose your role to get started
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Link 
            to="/auth/signup/provider"
            className="group relative bg-white p-8 rounded-xl shadow-sm border-2 border-transparent
              hover:border-primary hover:shadow-md transition-all duration-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-secondary-light group-hover:bg-primary/10 
                flex items-center justify-center mb-6 transition-colors duration-200">
                <GraduationCap className="h-8 w-8 text-primary/80" />
              </div>
              <h2 className="text-2xl font-bold text-primary-dark mb-3">
                Offer Your Services
              </h2>
              <p className="text-gray-600 mb-6">
                Share your skills and expertise with fellow students. Help others while earning and gaining valuable experience.
              </p>
              <span className="inline-flex items-center text-primary font-semibold">
                Start Offering Services
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </div>
          </Link>

          <Link 
            to="/auth/signup/client"
            className="group relative bg-white p-8 rounded-xl shadow-sm border-2 border-transparent
              hover:border-primary hover:shadow-md transition-all duration-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-secondary-light group-hover:bg-primary/10 
                flex items-center justify-center mb-6 transition-colors duration-200">
                <Briefcase className="h-8 w-8 text-primary/80" />
              </div>
              <h2 className="text-2xl font-bold text-primary-dark mb-3">
                Find & Hire Talent
              </h2>
              <p className="text-gray-600 mb-6">
                Connect with skilled students who can help with your projects, tutoring, or other needs.
              </p>
              <span className="inline-flex items-center text-primary font-semibold">
                Find Student Services
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};