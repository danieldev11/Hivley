import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  DollarSign, 
  AlertCircle,
  Filter,
  Search,
  MessageSquare,
  ChevronDown,
  ArrowUpDown,
  Loader2,
  X,
  Info
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { getBookings, type Booking } from '../../../lib/bookings';

type SortField = 'date' | 'price' | 'status';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface BookingDetailsModalProps {
  booking: Booking | null;
  onClose: () => void;
}

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ booking, onClose }) => {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Service Details */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Service</h4>
            <p className="text-gray-900">{booking.service?.title}</p>
          </div>

          {/* Provider Details */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Provider</h4>
            <p className="text-gray-900">{booking.service?.provider?.full_name}</p>
          </div>

          {/* Date and Time */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Date & Time</h4>
            <p className="text-gray-900">
              {format(parseISO(booking.start_time), 'MMMM d, yyyy')}
              <br />
              {format(parseISO(booking.start_time), 'h:mm a')} - {format(parseISO(booking.end_time), 'h:mm a')}
            </p>
          </div>

          {/* Price */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Price</h4>
            <p className="text-gray-900">${booking.total_price}</p>
          </div>

          {/* Special Requirements */}
          {booking.special_requirements && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Your Requirements</h4>
              <p className="text-gray-900">{booking.special_requirements}</p>
            </div>
          )}

          {/* Provider Notes */}
          {booking.notes && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Provider Notes
              </h4>
              <p className="text-yellow-800">{booking.notes}</p>
            </div>
          )}

          {/* Status */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              booking.status === 'completed' ? 'bg-green-100 text-green-800' :
              booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
              booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ClientBookings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Booking['status'] | 'all'>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<SortConfig>({ field: 'date', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    loadBookings();
  }, [selectedStatus, currentMonth]);

  useEffect(() => {
    filterAndSortBookings();
  }, [bookings, searchQuery, sort]);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getBookings(
        selectedStatus === 'all' ? undefined : selectedStatus,
        startOfMonth(currentMonth),
        endOfMonth(currentMonth)
      );
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortBookings = () => {
    let filtered = [...bookings];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.service?.title.toLowerCase().includes(query) ||
        booking.service?.provider?.full_name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const direction = sort.direction === 'asc' ? 1 : -1;
      
      switch (sort.field) {
        case 'date':
          return (new Date(a.start_time).getTime() - new Date(b.start_time).getTime()) * direction;
        case 'price':
          return (a.total_price - b.total_price) * direction;
        case 'status':
          return a.status.localeCompare(b.status) * direction;
        default:
          return 0;
      }
    });

    setFilteredBookings(filtered);
  };

  const handleSort = (field: SortField) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as Booking['status'] | 'all')}
              className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
            >
              <option value="all">All Bookings</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          
          <div className="relative">
            <input
              type="month"
              value={format(currentMonth, 'yyyy-MM')}
              onChange={(e) => setCurrentMonth(new Date(e.target.value))}
              className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
            />
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by service or provider..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {paginatedBookings.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No bookings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : selectedStatus === 'all'
                  ? 'You have no bookings for this month.'
                  : `You have no ${selectedStatus} bookings for this month.`}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b border-gray-200">
              <button
                onClick={() => handleSort('date')}
                className="flex items-center space-x-2 text-sm font-medium text-gray-600"
              >
                <span>Date & Time</span>
                <ArrowUpDown className="h-4 w-4" />
              </button>
              <div className="text-sm font-medium text-gray-600">Service</div>
              <div className="text-sm font-medium text-gray-600">Provider</div>
              <button
                onClick={() => handleSort('price')}
                className="flex items-center space-x-2 text-sm font-medium text-gray-600"
              >
                <span>Price</span>
                <ArrowUpDown className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleSort('status')}
                className="flex items-center space-x-2 text-sm font-medium text-gray-600"
              >
                <span>Status</span>
                <ArrowUpDown className="h-4 w-4" />
              </button>
              <div className="text-sm font-medium text-gray-600">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {paginatedBookings.map((booking) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-6 gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      {format(parseISO(booking.start_time), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(parseISO(booking.start_time), 'h:mm a')} - {format(parseISO(booking.end_time), 'h:mm a')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {booking.service?.title}
                    </p>
                    {booking.special_requirements && (
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        <span className="truncate">
                          {booking.special_requirements}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-900">
                    {booking.service?.provider?.full_name}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    ${booking.total_price}
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  pageNum === page
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      <BookingDetailsModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
};