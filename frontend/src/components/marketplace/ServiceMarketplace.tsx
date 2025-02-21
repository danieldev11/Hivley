import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  DollarSign, 
  MapPin, 
  Tag,
  ArrowRight,
  Sparkles,
  Users,
  Shield,
  TrendingUp,
  ChevronDown,
  Rocket
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MarketplaceNavbar } from './MarketplaceNavbar';
import { ServiceList } from './ServiceList';
import type { ServiceFilter, ServiceSort } from '../../lib/services';

const categories = [
  { id: 'all', name: 'All Services' },
  { id: 'tutoring', name: 'Tutoring' },
  { id: 'programming', name: 'Programming' },
  { id: 'design', name: 'Design' },
  { id: 'writing', name: 'Writing' },
  { id: 'music', name: 'Music' },
  { id: 'language', name: 'Language' },
  { id: 'fitness', name: 'Fitness' }
];

const sortOptions: { label: string; value: ServiceSort }[] = [
  { label: 'Most Popular', value: { field: 'rating', direction: 'desc' } },
  { label: 'Newest First', value: { field: 'created_at', direction: 'desc' } },
  { label: 'Price: Low to High', value: { field: 'price', direction: 'asc' } },
  { label: 'Price: High to Low', value: { field: 'price', direction: 'desc' } },
  { label: 'Rating', value: { field: 'rating', direction: 'desc' } }
];

export const ServiceMarketplace: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState(sortOptions[0]);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [filter, setFilter] = useState<ServiceFilter>({
    status: 'active'
  });

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setFilter(prev => ({
      ...prev,
      category: categoryId === 'all' ? undefined : categoryId
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceNavbar />
      
      <div className="pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-white py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
              >
                Find Expert Student Services
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-gray-600 mb-8"
              >
                Connect with talented students offering tutoring, programming help, design services, and more
              </motion.p>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl mx-auto"
              >
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search for services..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                    />
                  </div>
                </form>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap justify-center gap-8 mt-12"
              >
                {[
                  { icon: Users, label: 'Verified Students', sublabel: 'Active Providers' },
                  { icon: Star, label: '4.8/5', sublabel: 'Average Rating' },
                  { icon: Shield, label: '100% Secure', sublabel: 'Safe Payments' }
                ].map((stat, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{stat.label}</p>
                      <p className="text-sm text-gray-600">{stat.sublabel}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Categories */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Browse Categories</h2>
              <div className="flex flex-wrap gap-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`
                      px-4 py-2 rounded-lg transition-colors
                      ${selectedCategory === category.id
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }
                    `}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters and Sort */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <span>Filters</span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <TrendingUp className="h-5 w-5 text-gray-500" />
                    <span>Sort: {selectedSort.label}</span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>
                  
                  {showSortDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      {sortOptions.map((option) => (
                        <button
                          key={option.label}
                          onClick={() => {
                            setSelectedSort(option);
                            setShowSortDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Service List */}
            <ServiceList
              filter={filter}
              sort={selectedSort.value}
            />

            {/* CTA Section */}
            <section className="py-16 bg-primary/10 mt-16 rounded-2xl">
              <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Ready to Share Your Skills?
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Join our growing community of student service providers and start earning while helping others
                </p>
                <Link
                  to="/auth/signup/provider"
                  className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Rocket className="h-5 w-5 mr-2" />
                  Become a Provider
                </Link>
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
};