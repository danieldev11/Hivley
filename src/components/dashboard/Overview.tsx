import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Star,
  DollarSign,
  Calendar,
  Clock,
  TrendingUp,
  ChevronDown,
  Search,
  Bell,
  Filter,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
  CheckCircle,
  X
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js';
import { Line as LineChart, Bar as BarChart } from 'react-chartjs-2';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { getBookings, type Booking } from '../../lib/bookings';
import { getServices } from '../../lib/services';
import { getCurrentUser } from '../../lib/auth';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
  averageRating: number;
  activeClients: number;
  bookingsTrend: number;
  revenueTrend: number;
  ratingTrend: number;
}

interface ChartData {
  labels: string[];
  revenue: number[];
  bookings: number[];
}

export const Overview: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    activeClients: 0,
    bookingsTrend: 0,
    revenueTrend: 0,
    ratingTrend: 0
  });
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    revenue: [],
    bookings: []
  });
  const [recentActivity, setRecentActivity] = useState<Booking[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load user data
      const userData = await getCurrentUser();
      setUser(userData);

      // Get date range based on selected period
      const endDate = new Date();
      const startDate = selectedPeriod === 'week' 
        ? subDays(endDate, 7)
        : startOfMonth(endDate);

      // Load bookings
      const bookings = await getBookings(undefined, startDate, endDate);
      
      // Load services
      const { services } = await getServices(
        { provider_id: userData?.id, status: 'active' }
      );

      // Calculate statistics
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const totalRevenue = completedBookings.reduce((sum, b) => sum + b.total_price, 0);
      const uniqueClients = new Set(bookings.map(b => b.client_id)).size;

      // Calculate trends (comparing to previous period)
      const previousStartDate = selectedPeriod === 'week'
        ? subDays(startDate, 7)
        : startOfMonth(subDays(startDate, 1));
      
      const previousBookings = await getBookings(undefined, previousStartDate, startDate);
      const previousRevenue = previousBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + b.total_price, 0);

      const bookingsTrend = previousBookings.length > 0
        ? ((bookings.length - previousBookings.length) / previousBookings.length) * 100
        : 0;

      const revenueTrend = previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

      // Prepare chart data
      const labels = Array.from({ length: 7 }, (_, i) => 
        format(subDays(endDate, 6 - i), 'MMM d')
      );

      const dailyRevenue = labels.map(label => {
        const dayBookings = completedBookings.filter(b => 
          format(new Date(b.end_time), 'MMM d') === label
        );
        return dayBookings.reduce((sum, b) => sum + b.total_price, 0);
      });

      const dailyBookings = labels.map(label => 
        bookings.filter(b => format(new Date(b.start_time), 'MMM d') === label).length
      );

      setStats({
        totalBookings: bookings.length,
        completedBookings: completedBookings.length,
        totalRevenue,
        averageRating: 4.8, // TODO: Implement actual ratings
        activeClients: uniqueClients,
        bookingsTrend,
        revenueTrend,
        ratingTrend: 0
      });

      setChartData({
        labels,
        revenue: dailyRevenue,
        bookings: dailyBookings
      });

      // Set recent activity (last 5 bookings)
      setRecentActivity(bookings.slice(0, 5));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const revenueData: ChartData<'line'> = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Revenue',
        data: chartData.revenue,
        borderColor: '#FF9F00',
        backgroundColor: 'rgba(255, 159, 0, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const bookingsData: ChartData<'bar'> = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Bookings',
        data: chartData.bookings,
        backgroundColor: 'rgba(255, 159, 0, 0.8)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
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
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings, clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-600 hover:text-primary transition-colors">
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Bookings',
            value: stats.totalBookings,
            change: `${stats.bookingsTrend >= 0 ? '+' : ''}${stats.bookingsTrend.toFixed(1)}%`,
            icon: Calendar,
            trend: stats.bookingsTrend >= 0 ? 'up' : 'down',
            color: 'blue'
          },
          {
            title: 'Total Revenue',
            value: `$${stats.totalRevenue.toFixed(2)}`,
            change: `${stats.revenueTrend >= 0 ? '+' : ''}${stats.revenueTrend.toFixed(1)}%`,
            icon: DollarSign,
            trend: stats.revenueTrend >= 0 ? 'up' : 'down',
            color: 'green'
          },
          {
            title: 'Active Clients',
            value: stats.activeClients,
            change: 'This period',
            icon: Users,
            color: 'yellow'
          },
          {
            title: 'Completion Rate',
            value: `${((stats.completedBookings / stats.totalBookings) * 100).toFixed(0)}%`,
            change: 'Of total bookings',
            icon: CheckCircle,
            color: 'purple'
          }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 bg-${stat.color}-100 rounded-lg`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-500`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              {stat.trend && (
                <div className={`flex items-center ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-sm font-medium">{stat.change}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
            <div className="flex items-center text-sm text-gray-500">
              <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
              <span>{stats.revenueTrend >= 0 ? '+' : ''}{stats.revenueTrend.toFixed(1)}% vs last period</span>
            </div>
          </div>
          <LineChart data={revenueData} options={chartOptions} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Booking Analytics</h3>
            <div className="flex items-center text-sm text-gray-500">
              <BarChart3 className="h-4 w-4 mr-1 text-primary" />
              <span>{stats.totalBookings} total this period</span>
            </div>
          </div>
          <BarChart data={bookingsData} options={chartOptions} />
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No recent activity</p>
              </div>
            ) : (
              recentActivity.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${
                    booking.status === 'completed' ? 'bg-green-50 text-green-600' :
                    booking.status === 'confirmed' ? 'bg-blue-50 text-blue-600' :
                    booking.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                    'bg-yellow-50 text-yellow-600'
                  }`}>
                    {booking.status === 'completed' ? <CheckCircle className="h-5 w-5" /> :
                     booking.status === 'confirmed' ? <Calendar className="h-5 w-5" /> :
                     booking.status === 'cancelled' ? <X className="h-5 w-5" /> :
                     <Clock className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.service?.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          Booked by {booking.client?.full_name}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(booking.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                      <span className="text-gray-600">
                        ${booking.total_price}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};