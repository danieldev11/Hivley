import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Search, 
  Filter, 
  AlertCircle, 
  Check, 
  X, 
  Edit2, 
  Loader2, 
  Plus,
  DollarSign,
  Clock,
  Tag,
  MapPin,
  Star,
  Eye,
  MoreVertical,
  ArrowRight
} from 'lucide-react';
import { getServices, updateService, deleteService, toggleServiceStatus } from '../../lib/services';
import { ServiceForm } from '../dashboard/ServiceForm';
import { getCurrentUser } from '../../lib/auth';
import { Link } from 'react-router-dom';
import type { Service } from '../../lib/services';

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

export const ContentModeration: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isAddingService, setIsAddingService] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    serviceId: string | null;
  }>({ isOpen: false, serviceId: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadServices();
    }
  }, [currentUser]);

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    }
  };

  const loadServices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all services for admin view
      const { services } = await getServices();
      setServices(services || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setIsLoading(false);
    }
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
      
      // Update local state to remove the deleted service
      setServices(prevServices => 
        prevServices.filter(service => service.id !== deleteConfirmation.serviceId)
      );
      
      setSuccess('Service deleted successfully');
      setDeleteConfirmation({ isOpen: false, serviceId: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (serviceId: string, currentStatus: 'active' | 'inactive') => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await toggleServiceStatus(serviceId, newStatus);
      
      // Update local state to reflect the status change
      setServices(prevServices =>
        prevServices.map(service =>
          service.id === serviceId
            ? { ...service, status: newStatus }
            : service
        )
      );
      
      setSuccess(`Service ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service status');
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (selectedService) {
        await updateService(selectedService.id, data);
        
        // Update local state to reflect the changes
        setServices(prevServices =>
          prevServices.map(service =>
            service.id === selectedService.id
              ? { ...service, ...data }
              : service
          )
        );
        
        setSuccess('Service updated successfully');
      }

      setIsAddingService(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save service');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Service Management</h1>
        {currentUser?.profile?.role === 'provider' && (
          <Link
            to="/dashboard/provider/services"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to My Services
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        )}
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <SuccessMessage
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}

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
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                          {service.category}
                        </span>
                        <span className={`
                          inline-block px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${service.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'}
                        `}>
                          {service.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {/* Add provider information */}
                      <div className="mt-2 text-sm text-gray-600">
                        Provider: {service.provider?.full_name || 'Unknown'}
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
                        onClick={() => handleDeleteClick(service.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Delete service"
                      >
                        <X className="h-5 w-5" />
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
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-600">{service.location}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {service.tags?.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {service.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        title="Delete Service"
        message="Are you sure you want to delete this service? This action cannot be undone."
        confirmLabel="Delete Service"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmation({ isOpen: false, serviceId: null })}
        isLoading={isDeleting}
      />
    </div>
  );
};