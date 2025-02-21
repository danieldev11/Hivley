import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Clock, 
  DollarSign, 
  Tag, 
  Info, 
  X, 
  AlertCircle,
  Check,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { createService, getServices, deleteService, updateService, toggleServiceStatus } from '../../lib/services';
import { createConversation } from '../../lib/messages';
import { ServiceForm } from './ServiceForm';
import { getCurrentUser } from '../../lib/auth';
import { useNavigate } from 'react-router-dom';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

interface SuccessMessageProps {
  message: string;
  onClose: () => void;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ message, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="bg-green-50 text-green-800 p-4 rounded-lg flex items-center justify-between"
  >
    <div className="flex items-center">
      <Check className="h-5 w-5 mr-2" />
      {message}
    </div>
    <button onClick={onClose} className="text-green-600 hover:text-green-800">
      <X className="h-5 w-5" />
    </button>
  </motion.div>
);

export const Services: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [isAddingService, setIsAddingService] = useState(false);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    serviceId: string | null;
  }>({ isOpen: false, serviceId: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messagingServiceId, setMessagingServiceId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get current user
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get services filtered by provider_id
      const { services } = await getServices({
        provider_id: user.id // Only get services for the current provider
      });
      
      setServices(services || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddService = () => {
    setSelectedService(null);
    setIsAddingService(true);
  };

  const handleEditService = (service: any) => {
    setSelectedService(service);
    setIsAddingService(true);
  };

  const handleDeleteClick = (serviceId: string) => {
    setDeleteConfirmation({
      isOpen: true,
      serviceId
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation.serviceId) return;

    try {
      setIsDeleting(true);
      await deleteService(deleteConfirmation.serviceId);
      await loadServices();
      setSuccess('Service deleted successfully');
      setDeleteConfirmation({ isOpen: false, serviceId: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ isOpen: false, serviceId: null });
  };

  const handleToggleStatus = async (serviceId: string, currentStatus: 'active' | 'inactive') => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await toggleServiceStatus(serviceId, newStatus);
      await loadServices();
      setSuccess(`Service ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service status');
    }
  };

  const handleMessage = async (clientId: string, serviceId: string, serviceTitle: string) => {
    try {
      setMessagingServiceId(serviceId);
      
      // Create or get existing conversation
      const conversation = await createConversation({
        type: 'direct',
        participant_ids: [clientId],
        metadata: {
          service_id: serviceId,
          service_title: serviceTitle
        }
      });

      // Navigate to messages
      navigate('/dashboard/provider/messages', {
        state: { conversationId: conversation.id }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
    } finally {
      setMessagingServiceId(null);
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (selectedService) {
        await updateService(selectedService.id, data);
        setSuccess('Service updated successfully');
      } else {
        await createService(data);
        setSuccess('Service created successfully');
      }

      await loadServices();
      setIsAddingService(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setIsAddingService(false);
    setSelectedService(null);
  };

  if (isLoading && !isAddingService) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Services</h1>
        <button
          onClick={handleAddService}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Service
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}

        {success && (
          <SuccessMessage
            message={success}
            onClose={() => setSuccess(null)}
          />
        )}
      </AnimatePresence>

      {isAddingService ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-6">
            {selectedService ? 'Edit Service' : 'Add New Service'}
          </h2>
          <ServiceForm
            initialData={selectedService}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isSubmitting}
          />
        </div>
      ) : (
        <>
          {/* Service List */}
          <div className="grid grid-cols-1 gap-6">
            {services.map((service) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-100"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Service Images */}
                    <div className="w-full md:w-1/3">
                      <div className="grid grid-cols-2 gap-2">
                        {service.images?.map((image: string, index: number) => (
                          <img
                            key={index}
                            src={image}
                            alt={`${service.title} ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Service Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{service.title}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                              {service.category}
                            </span>
                            <span className={`
                              inline-block px-2 py-1 text-xs font-medium rounded
                              ${service.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'}
                            `}>
                              {service.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleStatus(service.id, service.status)}
                            className={`
                              p-2 rounded-lg transition-colors
                              ${service.status === 'active'
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-50'
                              }
                            `}
                            title={service.status === 'active' ? 'Deactivate service' : 'Activate service'}
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleEditService(service)}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                            title="Edit service"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(service.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Delete service"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      <p className="mt-4 text-gray-600">{service.description}</p>

                      <div className="mt-4 flex flex-wrap gap-4">
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-gray-600">{service.duration} minutes</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-gray-600">${service.price}</span>
                        </div>
                      </div>

                      {/* Prerequisites and Requirements */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Prerequisites</h4>
                          <ul className="space-y-1">
                            {service.prerequisites?.map((prereq: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <Info className="h-4 w-4 text-primary mr-2 mt-0.5" />
                                <span className="text-gray-600">{prereq}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Requirements</h4>
                          <ul className="space-y-1">
                            {service.requirements?.map((req: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <Tag className="h-4 w-4 text-primary mr-2 mt-0.5" />
                                <span className="text-gray-600">{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-2">
                          {service.tags?.map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Message Button */}
                      {service.bookings?.map((booking) => (
                        <button
                          key={booking.id}
                          onClick={() => handleMessage(
                            booking.client_id,
                            service.id,
                            service.title
                          )}
                          disabled={messagingServiceId === service.id}
                          className="mt-4 px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors flex items-center space-x-2 disabled:opacity-50"
                        >
                          {messagingServiceId === service.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Starting Chat...</span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="h-4 w-4" />
                              <span>Message {booking.client?.full_name}</span>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {services.length === 0 && !isLoading && (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Tag className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Yet</h3>
                <p className="text-gray-600 mb-6">Start by adding your first service</p>
                <button
                  onClick={handleAddService}
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Service
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        title="Delete Service"
        message="Are you sure you want to delete this service? This action cannot be undone."
        confirmLabel="Delete Service"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />
    </div>
  );
};