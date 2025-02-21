import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, 
  Calendar,
  Star,
  Users,
  Search,
  Bell,
  Filter,
  MessageSquare,
  ArrowRight,
  BookOpen,
  CheckCircle,
  DollarSign,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getBookings, type Booking } from '../../../lib/bookings';
import { getCurrentUser } from '../../../lib/auth';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface ClientStats {
  totalBookings: number;
  completedBookings: number;
  totalSpent: number;
  activeProviders: number;
}

export const ClientOverview: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ClientStats>({
    totalBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
    activeProviders: 0
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load user data
      const userData = await getCurrentUser();
      setUser(userData);

      // Get current month's bookings
      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(new Date());
      const bookings = await getBookings(undefined, startDate, endDate);

      // Calculate statistics
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const totalSpent = completedBookings.reduce((sum, b) => sum + b.total_price, 0);
      const uniqueProviders = new Set(bookings.map(b => b.provider_id)).size;

      setStats({
        totalBookings: bookings.length,
        completedBookings: completedBookings.length,
        totalSpent,
        activeProviders: uniqueProviders
      });

      // Set recent bookings (last 5)
      setRecentBookings(bookings.slice(0, 5));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search services, providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <button className="relative p-2 text-gray-600 hover:text-primary transition-colors">
          <Bell className="h-6 w-6" />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center p-4 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
          <Calendar className="h-6 w-6 text-primary mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">Total Bookings</h3>
            <p className="text-2xl font-bold text-primary">{stats.totalBookings}</p>
          </div>
        </div>

        <div className="flex items-center p-4 bg-green-100 rounded-lg hover:bg-green-200 transition-colors">
          <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">Completed</h3>
            <p className="text-2xl font-bold text-green-600">{stats.completedBookings}</p>
          </div>
        </div>

        <div className="flex items-center p-4 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
          <DollarSign className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">Total Spent</h3>
            <p className="text-2xl font-bold text-blue-600">${stats.totalSpent.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-center p-4 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors">
          <Users className="h-6 w-6 text-purple-600 mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">Active Providers</h3>
            <p className="text-2xl font-bold text-purple-600">{stats.activeProviders}</p>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h2>
          <div className="space-y-4">
            {recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No bookings yet</p>
                <Link
                  to="/services"
                  className="mt-4 inline-flex items-center text-primary hover:text-primary/80"
                >
                  Browse Services
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </div>
            ) : (
              recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {booking.service?.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {format(new Date(booking.start_time), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/services"
          className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-primary/20 transition-colors"
        >
          <BookOpen className="h-6 w-6 text-primary mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">Find Services</h3>
            <p className="text-sm text-gray-600">Browse available services</p>
          </div>
          <ArrowRight className="h-5 w-5 text-primary ml-auto" />
        </Link>

        <Link
          to="/dashboard/client/messages"
          className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-primary/20 transition-colors"
        >
          <MessageSquare className="h-6 w-6 text-primary mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">Messages</h3>
            <p className="text-sm text-gray-600">Chat with providers</p>
          </div>
          <ArrowRight className="h-5 w-5 text-primary ml-auto" />
        </Link>

        <Link
          to="/dashboard/client/bookings"
          className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-primary/20 transition-colors"
        >
          <Calendar className="h-6 w-6 text-primary mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">My Bookings</h3>
            <p className="text-sm text-gray-600">View all bookings</p>
          </div>
          <ArrowRight className="h-5 w-5 text-primary ml-auto" />
        </Link>
      </div>
    </div>
  );
};