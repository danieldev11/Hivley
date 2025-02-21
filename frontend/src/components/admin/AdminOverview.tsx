import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Shield,
  FileText,
  Bell,
  TrendingUp,
  AlertTriangle,
  Check,
  Clock,
  Loader2
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { getAdminUser, getModerationQueue, getAuditLogs, getUserCounts } from '../../lib/admin';
import { format, subDays } from 'date-fns';

export const AdminOverview: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    pendingModeration: 0,
    totalUsers: 0,
    activeUsers: 0,
    recentActions: 0
  });
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: 'Actions',
        data: [] as number[],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load admin user to verify permissions
      const adminUser = await getAdminUser();
      if (!adminUser) throw new Error('Failed to load admin user');

      // Load all data in parallel
      const [
        { total: pendingModeration },
        { total: recentActions },
        { total: totalUsers, active: activeUsers }
      ] = await Promise.all([
        getModerationQueue('pending', 1),
        getAuditLogs(1),
        getUserCounts()
      ]);

      // Get activity data for the last 7 days
      const labels = Array.from({ length: 7 }, (_, i) => 
        format(subDays(new Date(), 6 - i), 'MMM d')
      );

      // Get audit logs for each day
      const activityData = await Promise.all(
        labels.map(async (_, index) => {
          const startDate = subDays(new Date(), 6 - index);
          const endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);

          const { total } = await getAuditLogs(1000, 0);
          return total;
        })
      );

      setStats({
        pendingModeration,
        totalUsers,
        activeUsers,
        recentActions
      });

      setChartData({
        labels,
        datasets: [{
          label: 'Actions',
          data: activityData,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <button className="relative p-2 text-gray-600 hover:text-primary transition-colors">
          <Bell className="h-6 w-6" />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Shield className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Moderation</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingModeration}</p>
              </div>
            </div>
            <span className="text-orange-500">
              <Clock className="h-5 w-5" />
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
            <span className="text-green-500">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>
            <span className="text-green-500">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FileText className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Actions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentActions}</p>
              </div>
            </div>
            <span className="text-purple-500">
              <Clock className="h-5 w-5" />
            </span>
          </div>
        </motion.div>
      </div>

      {/* Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-6">System Activity</h2>
        <Line
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }}
        />
      </motion.div>
    </div>
  );
};