import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../lib/auth';
import { DashboardLayout } from './DashboardLayout';
import { ClientOverview } from './client/ClientOverview';
import { ClientProfile } from './client/ClientProfile';
import { ClientServices } from './client/ClientServices';
import { ClientBookings } from './client/ClientBookings';
import { Chat } from '../chat/Chat';
import { Settings } from './Settings';

export const ClientDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getCurrentUser();
        if (!user || user.profile?.role !== 'client') {
          navigate('/auth');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

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

  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<ClientOverview />} />
        <Route path="profile" element={<ClientProfile />} />
        <Route path="services" element={<ClientServices />} />
        <Route path="bookings" element={<ClientBookings />} />
        <Route path="messages" element={<Chat />} />
        <Route path="settings" element={<Settings />} />
      </Routes>
    </DashboardLayout>
  );
};