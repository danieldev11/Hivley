import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Star,
  MapPin,
  Clock,
  DollarSign,
  ChevronLeft,
  Share2,
  MessageSquare,
  Calendar,
  Info,
  Tag,
  User,
  Check,
  Loader2,
  Send
} from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getServiceById } from '../../lib/services';
import { createConversation } from '../../lib/messages';
import { createBooking } from '../../lib/bookings';
import { getCurrentUser } from '../../lib/auth';
import { BookingModal } from '../booking/BookingModal';
import { BookingConfirmation } from '../booking/BookingConfirmation';
import type { Service } from '../../lib/services';

export const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastBooking, setLastBooking] = useState<any>(null);
  const [isMessaging, setIsMessaging] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    }
  };

  useEffect(() => {
    loadService();
  }, [id]);

  const loadService = async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (!id) throw new Error('Service ID is required');
      const data = await getServiceById(id);
      setService(data);
      if (data.images?.[0]) {
        setSelectedImage(data.images[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = async (data: {
    date: Date;
    time: string;
    specialRequirements?: string;
  }) => {
    try {
      if (!service || !id) return;

      const [hours, minutes] = data.time.split(':');
      const startTime = new Date(data.date);
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + service.duration);

      const booking = await createBooking({
        service_id: id,
        provider_id: service.provider_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        total_price: service.price,
        special_requirements: data.specialRequirements
      });

      // Safely handle potentially missing provider data
      const providerName = booking.service?.provider?.full_name || service.provider?.full_name || 'Provider';

      setLastBooking({
        id: booking.id,
        date: data.date,
        time: data.time,
        service: {
          title: booking.service?.title || service.title,
          price: service.price,
          provider: {
            full_name: providerName
          }
        }
      });

      setShowBookingModal(false);
      setShowConfirmation(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    }
  };

  const handleMessage = async () => {
    try {
      setIsMessaging(true);
      
      if (!service || !service.provider_id) {
        throw new Error('Service provider information not found');
      }

      // Create or get existing conversation
      const conversation = await createConversation({
        type: 'direct',
        participant_ids: [service.provider_id],
        metadata: {
          service_id: service.id,
          service_title: service.title
        }
      });

      // Navigate to messages with just the conversation selected
      navigate(`/dashboard/${user?.profile?.role}/messages`, {
        state: { 
          conversationId: conversation.id
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
    } finally {
      setIsMessaging(false);
    }
  };

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const title = service?.title || 'Check out this service on Hivley';

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(url);
          // You could show a toast notification here
        } catch (err) {
          console.error('Failed to copy URL:', err);
        }
        break;
    }
    setShowShareMenu(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Service not found'}
          </h1>
          <Link
            to="/services"
            className="text-primary hover:text-primary/80"
          >
            Back to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link
              to="/services"
              className="text-gray-500 hover:text-gray-700"
            >
              Services
            </Link>
            <ChevronLeft className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900">{service.category}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Images */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="relative aspect-video mb-4">
                <img
                  src={selectedImage || service.images[0]}
                  alt={service.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="grid grid-cols-5 gap-2">
                {service.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(image)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === image
                        ? 'border-primary'
                        : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${service.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Service Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {service.title}
                  </h1>
                  <div className="flex items-center space-x-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                      {service.category}
                    </span>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 mr-1" />
                      <span className="font-medium">{service.provider?.rating?.toFixed(1) || 'New'}</span>
                      {service.provider?.total_reviews > 0 && (
                        <span className="text-gray-500 ml-1">
                          ({service.provider.total_reviews} reviews)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="p-2 text-gray-500 hover:text-gray-700 relative"
                >
                  <Share2 className="h-5 w-5" />
                  {showShareMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1">
                      {[
                        { id: 'copy', label: 'Copy Link' },
                        { id: 'twitter', label: 'Share on Twitter' },
                        { id: 'facebook', label: 'Share on Facebook' },
                        { id: 'linkedin', label: 'Share on LinkedIn' }
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleShare(option.id)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </button>
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-600">{service.description}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">{service.duration} minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">{service.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">Flexible Schedule</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600">Verified Provider</span>
                </div>
              </div>

              {/* Prerequisites */}
              {service.prerequisites?.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Prerequisites</h2>
                  <ul className="space-y-2">
                    {service.prerequisites.map((prereq, index) => (
                      <li key={index} className="flex items-start">
                        <Info className="h-5 w-5 text-primary mr-2 mt-0.5" />
                        <span className="text-gray-600">{prereq}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {service.requirements?.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
                  <ul className="space-y-2">
                    {service.requirements.map((req, index) => (
                      <li key={index} className="flex items-start">
                        <Tag className="h-5 w-5 text-primary mr-2 mt-0.5" />
                        <span className="text-gray-600">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {service.tags?.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking and Provider Info */}
          <div className="space-y-6">
            {/* Booking Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  ${service.price}
                  <span className="text-lg text-gray-500">
                    /{service.duration}min
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setShowBookingModal(true)}
                className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors mb-4"
                disabled={isMessaging}
              >
                Book Now
              </button>

              <button 
                onClick={handleMessage}
                disabled={isMessaging}
                className="w-full px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {isMessaging ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Starting Chat...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Message Provider
                  </>
                )}
              </button>
            </div>

            {/* Provider Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  {service.provider?.avatar_url ? (
                    <img 
                      src={service.provider.avatar_url}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {service.provider?.full_name || 'Provider'}
                  </h2>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="text-sm text-gray-600">
                      {service.provider?.rating?.toFixed(1) || 'New Provider'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Member since</span>
                  <span className="font-medium">March 2024</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total sessions</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Response time</span>
                  <span className="font-medium">Less than 2 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {service && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          service={service}
          onSubmit={handleBooking}
        />
      )}

      {/* Confirmation Modal */}
      {lastBooking && (
        <BookingConfirmation
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          booking={lastBooking}
        />
      )}
    </div>
  );
};