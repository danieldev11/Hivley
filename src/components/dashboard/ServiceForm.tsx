import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Check,
  DollarSign,
  Clock
} from 'lucide-react';
import type { Service } from '../../lib/services';

interface ServiceFormProps {
  initialData?: Partial<Service>;
  onSubmit: (data: Partial<Service>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Partial<Service>>(
    initialData || {
      title: '',
      description: '',
      price: undefined, // Changed from 0 to undefined for better UX
      duration: undefined, // Changed from 60 to undefined for better UX
      category: '',
      location: '',
      tags: [],
      images: [],
      prerequisites: [],
      requirements: [],
      packages: []
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const categories = [
    'Tutoring',
    'Programming',
    'Design',
    'Writing',
    'Music',
    'Language',
    'Fitness',
    'Other'
  ];

  // Common durations for easy selection
  const commonDurations = [
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (typeof formData.price !== 'number' || formData.price < 0) {
      newErrors.price = 'Price must be a positive number';
    }

    if (typeof formData.duration !== 'number' || formData.duration < 15) {
      newErrors.duration = 'Duration must be at least 15 minutes';
    }

    if (!formData.location?.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        ...formData,
        images: imageFiles
      });
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty input for better UX
    if (value === '') {
      setFormData(prev => ({ ...prev, price: undefined }));
      return;
    }

    // Convert to number and limit to 2 decimal places
    const price = parseFloat(parseFloat(value).toFixed(2));
    if (!isNaN(price) && price >= 0) {
      setFormData(prev => ({ ...prev, price }));
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty input for better UX
    if (value === '') {
      setFormData(prev => ({ ...prev, duration: undefined }));
      return;
    }

    const duration = parseInt(value);
    if (!isNaN(duration) && duration >= 15) {
      setFormData(prev => ({ ...prev, duration }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.slice(0, 5 - (imageFiles.length + (formData.images?.length || 0)));
    
    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles]);
      setFormData(prev => ({
        ...prev,
        images: [
          ...(prev.images || []),
          ...validFiles.map(file => URL.createObjectURL(file))
        ]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
    }));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag)
    }));
  };

  const addPrerequisite = () => {
    if (newPrerequisite.trim()) {
      setFormData(prev => ({
        ...prev,
        prerequisites: [...(prev.prerequisites || []), newPrerequisite.trim()]
      }));
      setNewPrerequisite('');
    }
  };

  const removePrerequisite = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: prev.prerequisites?.filter((_, i) => i !== index)
    }));
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...(prev.requirements || []), newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements?.filter((_, i) => i !== index)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className={`
              w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent
              ${errors.title ? 'border-red-500' : 'border-gray-300'}
            `}
            placeholder="e.g., Advanced Mathematics Tutoring"
            disabled={isLoading}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className={`
              w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent
              ${errors.category ? 'border-red-500' : 'border-gray-300'}
            `}
            disabled={isLoading}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-500">{errors.category}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (USD) *
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="number"
              value={formData.price ?? ''} // Use empty string when undefined
              onChange={handlePriceChange}
              className={`
                w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent
                ${errors.price ? 'border-red-500' : 'border-gray-300'}
              `}
              min="0"
              step="0.01"
              placeholder="0.00"
              disabled={isLoading}
            />
          </div>
          {errors.price && (
            <p className="mt-1 text-sm text-red-500">{errors.price}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration *
          </label>
          <div className="space-y-2">
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                value={formData.duration ?? ''} // Use empty string when undefined
                onChange={handleDurationChange}
                className={`
                  w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent
                  ${errors.duration ? 'border-red-500' : 'border-gray-300'}
                `}
                min="15"
                step="15"
                placeholder="Duration in minutes"
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {commonDurations.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, duration: value }))}
                  className={`
                    px-3 py-1 text-sm rounded-full transition-colors
                    ${formData.duration === value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                  disabled={isLoading}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {errors.duration && (
            <p className="mt-1 text-sm text-red-500">{errors.duration}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className={`
              w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent
              ${errors.location ? 'border-red-500' : 'border-gray-300'}
            `}
            placeholder="e.g., University Library, Online"
            disabled={isLoading}
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-500">{errors.location}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          className={`
            w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent
            ${errors.description ? 'border-red-500' : 'border-gray-300'}
          `}
          placeholder="Describe your service in detail..."
          disabled={isLoading}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-500">{errors.description}</p>
        )}
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Service Images (Max 5)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {formData.images?.map((image, index) => (
            <div key={index} className="relative">
              <img
                src={image}
                alt={`Service ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {(!formData.images || formData.images.length < 5) && (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary cursor-pointer">
              <ImageIcon className="h-8 w-8 text-gray-400" />
              <span className="mt-2 text-sm text-gray-500">Add Image</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                multiple={true}
                disabled={isLoading}
              />
            </label>
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Add a tag"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              disabled={isLoading || !newTag.trim()}
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags?.map((tag) => (
              <div
                key={tag}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-gray-500 hover:text-red-500"
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prerequisites */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prerequisites
        </label>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newPrerequisite}
              onChange={(e) => setNewPrerequisite(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Add a prerequisite"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={addPrerequisite}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              disabled={isLoading || !newPrerequisite.trim()}
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {formData.prerequisites?.map((prerequisite, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span>{prerequisite}</span>
                <button
                  type="button"
                  onClick={() => removePrerequisite(index)}
                  className="text-gray-500 hover:text-red-500"
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Requirements
        </label>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Add a requirement"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={addRequirement}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              disabled={isLoading || !newRequirement.trim()}
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {formData.requirements?.map((requirement, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span>{requirement}</span>
                <button
                  type="button"
                  onClick={() => removeRequirement(index)}
                  className="text-gray-500 hover:text-red-500"
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 text-gray-600 hover:text-gray-800"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center space-x-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="h-5 w-5" />
              <span>{initialData ? 'Update Service' : 'Create Service'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};