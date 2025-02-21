import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { AdminOverview } from './AdminOverview';
import { UserManagement } from './UserManagement';
import { ContentModeration } from './ContentModeration';
import { AuditLogs } from './AuditLogs';
import { SecurityLogs } from './SecurityLogs';
import { AdminSettings } from './AdminSettings';
import { AdminInitialization } from './AdminInitialization';
import { isAdmin, isSuperAdmin } from '../../lib/admin';

export const AdminDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminStatus, setAdminStatus] = useState<{
    isAdmin: boolean;
    isSuperAdmin: boolean;
  }>({ isAdmin: false, isSuperAdmin: false });
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      setIsLoading(true);
      const [adminCheck, superAdminCheck] = await Promise.all([
        isAdmin(),
        isSuperAdmin()
      ]);

      setAdminStatus({
        isAdmin: adminCheck,
        isSuperAdmin: superAdminCheck
      });

      if (!adminCheck) {
        navigate('/auth');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify admin status');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Show admin initialization screen if not an admin
  if (!adminStatus.isAdmin) {
    return <AdminInitialization />;
  }

  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<AdminOverview />} />
        <Route path="users/*" element={<UserManagement />} />
        <Route path="moderation/*" element={<ContentModeration />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        {adminStatus.isSuperAdmin && (
          <Route path="security-logs" element={<SecurityLogs />} />
        )}
        <Route path="settings" element={<AdminSettings />} />
      </Routes>
    </AdminLayout>
  );
};