import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  
  // Check for Supabase session
  const session = supabase.auth.getSession();
  
  if (!session) {
    // Redirect to login if no session exists
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};