import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { LoginForm } from './components/LoginForm';
import { RoleSelection } from './components/RoleSelection';
import { ProviderSignUpForm } from './components/ProviderSignUpForm';
import { ClientSignUpForm } from './components/ClientSignUpForm';
import { ProviderDashboard } from './components/dashboard/ProviderDashboard';
import { ClientDashboard } from './components/dashboard/ClientDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ServiceMarketplace } from './components/marketplace/ServiceMarketplace';
import { ServiceDetail } from './components/marketplace/ServiceDetail';

const LandingPage: React.FC = () => (
  <div className="min-h-screen">
    <Navbar />
    <Hero />
    <Features />
    <HowItWorks />
    <Footer />
  </div>
);

const AuthPage: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <div className="flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px] bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-gray-600">
            Sign in to your account
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth">
        <Route index element={<AuthPage />} />
        <Route path="signup">
          <Route index element={<RoleSelection />} />
          <Route path="provider" element={<ProviderSignUpForm />} />
          <Route path="client" element={<ClientSignUpForm />} />
        </Route>
      </Route>
      <Route 
        path="/dashboard/provider/*" 
        element={
          <ProtectedRoute>
            <ProviderDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/client/*" 
        element={
          <ProtectedRoute>
            <ClientDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/services" 
        element={
          <ProtectedRoute>
            <ServiceMarketplace />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/services/:id" 
        element={
          <ProtectedRoute>
            <ServiceDetail />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;