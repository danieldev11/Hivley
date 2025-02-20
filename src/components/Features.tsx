import React from 'react';
import { Users, Rocket, Shield, Clock } from 'lucide-react';
import type { FeatureCard } from '../types';

const features: FeatureCard[] = [
  {
    title: 'Smart Matching',
    description: 'Our AI-powered system connects students with clubs based on skills, interests, and availability.',
    icon: Rocket
  },
  {
    title: 'Verified Clubs',
    description: 'All participating clubs are verified to ensure safe and meaningful opportunities.',
    icon: Shield
  },
  {
    title: 'Time Management',
    description: 'Flexible scheduling tools help students balance club activities with academics.',
    icon: Clock
  },
  {
    title: 'Community Building',
    description: 'Foster meaningful connections and build lasting relationships within your campus community.',
    icon: Users
  }
];

export const Features: React.FC = () => {
  return (
    <section className="py-20 bg-white" id="features">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-primary-dark sm:text-4xl">
            Why Choose Hivley?
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Discover how we make club engagement easier and more meaningful
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-12 h-12 rounded-lg bg-secondary-light flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-primary-dark mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};