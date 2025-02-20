import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  Search,
  Filter,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Clock,
  Globe,
  Monitor,
  Eye
} from 'lucide-react';
import { getSecurityLogs } from '../../lib/admin';
import type { SecurityLog } from '../../lib/admin';
import { format } from 'date-fns';

export const SecurityLogs: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const itemsPerPage = 20;

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const offset = (page - 1) * itemsPerPage;
      const { logs, total } = await getSecurityLogs(itemsPerPage, offset);
      setLogs(logs);
      setTotal(total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security logs');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.admin?.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ip_address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEventType = selectedEventType === 'all' || log.event_type === selectedEventType;
    
    return matchesSearch && matchesEventType;
  });

  const totalPages = Math.ceil(total / itemsPerPage);

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'login_success':
        return 'bg-green-100 text-green-800';
      case 'login_failed':
        return 'bg-red-100 text-red-800';
      case 'password_reset':
        return 'bg-blue-100 text-blue-800';
      case 'account_locked':
        return 'bg-orange-100 text-orange-800';
      case 'suspicious_activity':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Security Logs</h1>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          {total} Total Records
        </span>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Events</option>
            <option value="login_success">Login Success</option>
            <option value="login_failed">Login Failed</option>
            <option value="password_reset">Password Reset</option>
            <option value="account_locked">Account Locked</option>
            <option value="suspicious_activity">Suspicious Activity</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <Lock className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Security Event
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(log.event_type)}`}>
                      {formatEventType(log.event_type)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {log.admin && (
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      <span>Admin: {log.admin.profile?.full_name}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}</span>
                  </div>
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-1" />
                    <span>IP: {log.ip_address}</span>
                  </div>
                  {log.user_agent && (
                    <div className="flex items-center">
                      <Monitor className="h-4 w-4 mr-1" />
                      <span className="truncate max-w-xs">{log.user_agent}</span>
                    </div>
                  )}
                </div>
              </div>

              {log.details && (
                <button
                  onClick={() => setShowDetails(showDetails === log.id ? null : log.id)}
                  className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg"
                >
                  <Eye className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Event Details */}
            {showDetails === log.id && log.details && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <h4 className="text-sm font-medium text-gray-700 mb-2">Event Details</h4>
                <pre className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </motion.div>
            )}
          </motion.div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No security logs found
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'No security events have been recorded yet'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, total)} of {total} records
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => (
                <React.Fragment key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && (
                    <span className="text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    className={`
                      px-3 py-1 rounded-lg text-sm
                      ${p === page
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};