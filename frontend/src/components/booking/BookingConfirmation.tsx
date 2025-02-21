import React from 'react';
import { motion } from 'framer-motion';
import { Check, Calendar, Clock, DollarSign, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface BookingConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    date: Date;
    time: string;
    service: {
      title: string;
      price: number;
      provider: {
        full_name: string;
      };
    };
  };
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  isOpen,
  onClose,
  booking
}) => {
  if (!isOpen) return null;

  return (
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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center"
        >
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h2>
          <p className="text-gray-600 mb-6">
            Your session has been successfully booked
          </p>

          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6 text-left">
            <h3 className="font-medium text-gray-900 mb-2">
              {booking.service.title}
            </h3>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Date</span>
              </div>
              <span className="font-medium">
                {format(booking.date, 'MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                <span>Time</span>
              </div>
              <span className="font-medium">{booking.time}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <DollarSign className="h-4 w-4 mr-2" />
                <span>Total</span>
              </div>
              <span className="font-medium">
                ${booking.service.price}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <Link
              to="/dashboard/client/bookings"
              className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              View My Bookings
            </Link>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};