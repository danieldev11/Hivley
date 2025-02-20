import React, { useState } from 'react';
import { Bell, Shield, CreditCard, Mail } from 'lucide-react';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

const notificationSettings: NotificationSetting[] = [
  {
    id: 'booking_requests',
    title: 'Booking Requests',
    description: 'Get notified when you receive new booking requests',
    enabled: true
  },
  {
    id: 'booking_reminders',
    title: 'Booking Reminders',
    description: 'Receive reminders about upcoming bookings',
    enabled: true
  },
  {
    id: 'messages',
    title: 'Messages',
    description: 'Get notified when you receive new messages',
    enabled: true
  },
  {
    id: 'reviews',
    title: 'Reviews',
    description: 'Get notified when you receive new reviews',
    enabled: false
  }
];

export const AdminSettings: React.FC = () => {
  const [notifications, setNotifications] = useState(notificationSettings);

  const toggleNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(setting =>
        setting.id === id
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Bell className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="space-y-4">
            {notifications.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{setting.title}</p>
                  <p className="text-sm text-gray-500">{setting.description}</p>
                </div>
                <button
                  onClick={() => toggleNotification(setting.id)}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                    ${setting.enabled ? 'bg-primary' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                      transition duration-200 ease-in-out
                      ${setting.enabled ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          </div>
          <div className="space-y-4">
            <button className="text-sm text-primary hover:text-primary/80 transition-colors duration-200">
              Change Password
            </button>
            <button className="text-sm text-primary hover:text-primary/80 transition-colors duration-200">
              Enable Two-Factor Authentication
            </button>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <CreditCard className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
          </div>
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200">
            Add Payment Method
          </button>
        </div>
      </div>

      {/* Email Preferences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Mail className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Email Preferences</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="marketing_emails"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="marketing_emails" className="ml-2 block text-sm text-gray-900">
                Receive marketing emails
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="newsletter"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="newsletter" className="ml-2 block text-sm text-gray-900">
                Subscribe to newsletter
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};