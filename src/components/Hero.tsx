import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Hero: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = async () => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 200));
      navigate('/auth/signup');
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative bg-gradient-to-b from-secondary-light to-white py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <img 
            src="/Hivley_bee.png" 
            alt="Hivley" 
            className="w-40 h-40 mx-auto mb-8 object-contain"
          />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-dark mb-6">
            Connect. Earn. Collaborate.
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            The premier peer-to-peer service platform exclusively for Penn State students. Offer your skills or find the help you need.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleGetStarted}
              disabled={isLoading}
              className={`inline-flex items-center px-6 py-3 rounded-lg bg-primary text-white font-semibold 
                hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 
                transition-all duration-200 ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
              aria-label="Get Started with Hivley"
            >
              {isLoading ? (
                <>
                  <span className="animate-pulse">Loading...</span>
                </>
              ) : (
                <>
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
            <button 
              className="px-6 py-3 rounded-lg border-2 border-primary text-primary font-semibold 
                hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 
                transition-colors duration-200"
              aria-label="Learn More about Hivley"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/20 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-secondary/20 rounded-full opacity-20 blur-3xl"></div>
      </div>
    </section>
  );
};