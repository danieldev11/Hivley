import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  DollarSign, 
  Calendar,
  ChevronDown,
  MapPin,
  Tag
} from 'lucide-react';

interface Service {
  id: number;
  title: string;
  provider: {
    name: string;
    rating: number;
    reviews: number;
    location: string;
  };
  price: number;
  duration: string;
  category: string;
  tags: string[];
  description: string;
  availability: string[];
}

const services: Service[] = [
  {
    id: 1,
    title: 'Math Tutoring - Calculus & Linear Algebra',
    provider: {
      name: 'John Doe',
      rating: 4.8,
      reviews: 124,
      location: 'University Park'
    },
    price: 30,
    duration: '1 hour',
    category: 'Tutoring',
    tags: ['Calculus', 'Linear Algebra', 'Statistics'],
    description: 'Expert tutoring in advanced mathematics. Specializing in calculus, linear algebra, and statistics. Personalized approach for each student.',
    availability: ['Mon', 'Wed', 'Fri']
  },
  {
    id: 2,
    title: 'Web Development & Programming Help',
    provider: {
      name: 'Sarah Smith',
      rating: 4.9,
      reviews: 89,
      location: 'Innovation Hub'
    },
    price: 40,
    duration: '1 hour',
    category: 'Programming',
    tags: ['JavaScript', 'React', 'Node.js'],
    description: 'Professional web development tutoring and project help. Expertise in modern JavaScript frameworks and full-stack development.',
    availability: ['Tue', 'Thu', 'Sat']
  },
  {
    id: 3,
    title: 'UI/UX Design Consultation',
    provider: {
      name: 'Mike Johnson',
      rating: 4.7,
      reviews: 56,
      location: 'Arts Building'
    },
    price: 45,
    duration: '1 hour',
    category: 'Design',
    tags: ['UI Design', 'UX Research', 'Prototyping'],
    description: 'Comprehensive UI/UX design consultation. From wireframes to high-fidelity prototypes. User research and testing included.',
    availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  }
];

const categories = ['All', 'Tutoring', 'Programming', 'Design', 'Writing', 'Music', 'Language'];
const sortOptions = ['Recommended', 'Price: Low to High', 'Price: High to Low', 'Rating', 'Most Popular'];

export const ClientServices: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Recommended');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Browse Services</h1>
        <div className="relative">
          <button 
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-gray-700">Sort by: {selectedSort}</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
          
          {showSortDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {sortOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setSelectedSort(option);
                    setShowSortDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search and Categories */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search services, providers, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredServices.map((service) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {service.title}
                  </h3>
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium text-gray-700">
                        {service.provider.rating}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        ({service.provider.reviews} reviews)
                      </span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{service.provider.location}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">${service.price}</p>
                  <p className="text-sm text-gray-500">per {service.duration}</p>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4">
                {service.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {service.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Available:</span>
                  <div className="flex space-x-1">
                    {service.availability.map((day, index) => (
                      <span
                        key={index}
                        className="text-xs font-medium bg-gray-100 px-2 py-1 rounded"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                  Book Now
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};