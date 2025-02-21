import React from 'react';
import type { ProcessStep } from '../types';

const steps: ProcessStep[] = [
  {
    number: 1,
    title: 'Create Your Profile',
    description: 'Sign up and tell us about your interests, skills, and availability.'
  },
  {
    number: 2,
    title: 'Browse Opportunities',
    description: 'Explore verified club activities that match your profile.'
  },
  {
    number: 3,
    title: 'Get Connected',
    description: 'Apply to opportunities and start making an impact in your community.'
  }
];

export const HowItWorks: React.FC = () => {
  return (
    <section className="py-20 bg-secondary-light" id="how-it-works">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-primary-dark sm:text-4xl">
            How Hively Works
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Get started in three simple steps
          </p>
        </div>
        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/20 hidden lg:block"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-xl p-8 shadow-sm relative z-10 border border-gray-100 hover:border-primary/20 transition-colors duration-200">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mb-6">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-primary-dark mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};