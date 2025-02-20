import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  MapPin, 
  Clock, 
  Tag,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getServices, type Service, type ServiceFilter, type ServiceSort } from '../../lib/services';

interface ServiceListProps {
  filter?: ServiceFilter;
  sort?: ServiceSort;
}

export const ServiceList: React.FC<ServiceListProps> = ({ filter, sort }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadServices();
  }, [filter, sort]);

  const loadServices = async (reset = true) => {
    try {
      setIsLoading(true);
      setError(null);

      const currentPage = reset ? 1 : page;
      const result = await getServices(filter, sort, currentPage);

      setServices(prev => reset ? result.services : [...prev, ...result.services]);
      setTotal(result.total);
      setHasMore(result.services.length === result.limit);
      setPage(currentPage + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      loadServices(false);
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => loadServices()}
          className="mt-4 text-primary hover:text-primary/80"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            {service.images?.[0] && (
              <div className="relative h-48">
                <img
                  src={service.images[0]}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-white/90 rounded-full text-sm font-medium text-gray-700">
                    {service.category}
                  </span>
                </div>
              </div>
            )}

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {service.title}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span className="ml-1 text-sm font-medium text-gray-700">
                        {service.provider?.rating?.toFixed(1) || 'New'}
                      </span>
                      {service.provider?.total_reviews > 0 && (
                        <span className="ml-1 text-sm text-gray-500">
                          ({service.provider.total_reviews} reviews)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">${service.price}</p>
                  <p className="text-sm text-gray-500">per {service.duration} min</p>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {service.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {service.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  {service.location}
                </div>
                <Link
                  to={`/services/${service.id}`}
                  className="flex items-center text-primary hover:text-primary/80"
                >
                  <span className="text-sm font-medium">View Details</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      )}

      {!isLoading && hasMore && (
        <div className="text-center py-8">
          <button
            onClick={loadMore}
            className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Load More Services
          </button>
        </div>
      )}

      {!isLoading && !hasMore && services.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          No more services to load
        </div>
      )}

      {!isLoading && services.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No services found
          </h3>
          <p className="text-gray-600">
            Try adjusting your filters or check back later for new services
          </p>
        </div>
      )}
    </div>
  );
};