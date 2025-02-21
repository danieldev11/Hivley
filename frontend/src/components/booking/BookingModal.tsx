import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  Clock,
  DollarSign,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string;
    title: string;
    price: number;
    duration: number;
    provider: {
      full_name: string;
    };
  };
  onSubmit: (data: {
    date: Date;
    time: string;
    specialRequirements?: string;
  }) => Promise<void>;
}

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00'
];

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  service,
  onSubmit
}) => {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await onSubmit({
        date: selectedDate,
        time: selectedTime,
        specialRequirements: specialRequirements.trim() || undefined
      });

      // Reset form and close modal
      setStep(1);
      setSelectedDate(new Date());
      setSelectedTime('');
      setSpecialRequirements('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Select Date
      </h3>

      {/* Date Selection */}
      <div className="grid grid-cols-4 gap-2">
        {[...Array(7)].map((_, index) => {
          const date = addDays(new Date(), index);
          const isSelected = isSameDay(date, selectedDate);

          return (
            <button
              key={index}
              onClick={() => setSelectedDate(date)}
              className={`
                p-3 rounded-lg text-center transition-colors
                ${isSelected
                  ? 'bg-primary text-white'
                  : 'bg-white border border-gray-200 hover:border-primary'
                }
              `}
            >
              <p className="text-sm font-medium">
                {format(date, 'EEE')}
              </p>
              <p className={`text-lg ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                {format(date, 'd')}
              </p>
            </button>
          );
        })}
      </div>

      {/* Time Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Select Time
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {timeSlots.map((time) => {
            const isAvailable = true; // TODO: Check availability
            const isSelected = time === selectedTime;

            return (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                disabled={!isAvailable}
                className={`
                  p-3 rounded-lg text-center transition-colors
                  ${isSelected
                    ? 'bg-primary text-white'
                    : isAvailable
                      ? 'bg-white border border-gray-200 hover:border-primary'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {time}
              </button>
            );
          })}
        </div>
      </div>

      {/* Next Button */}
      <button
        onClick={() => setStep(2)}
        disabled={!selectedDate || !selectedTime}
        className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Continue
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Booking Details
      </h3>

      {/* Summary */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-5 w-5 mr-2" />
            <span>Date</span>
          </div>
          <span className="font-medium">
            {format(selectedDate, 'MMMM d, yyyy')}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-600">
            <Clock className="h-5 w-5 mr-2" />
            <span>Time</span>
          </div>
          <span className="font-medium">{selectedTime}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-600">
            <DollarSign className="h-5 w-5 mr-2" />
            <span>Price</span>
          </div>
          <span className="font-medium">${service.price}</span>
        </div>
      </div>

      {/* Special Requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Special Requirements (Optional)
        </label>
        <textarea
          value={specialRequirements}
          onChange={(e) => setSpecialRequirements(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Any special requirements or notes for the provider..."
        />
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={() => setStep(1)}
          className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Booking...
            </span>
          ) : (
            'Confirm Booking'
          )}
        </button>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-xl max-w-lg w-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Book Service
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {service.title}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {step === 1 ? renderStep1() : renderStep2()}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};