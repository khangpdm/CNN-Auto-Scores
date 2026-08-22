import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '@/services/authService';

const PublicRoute = () => {
  const isAuthenticated = authService.isAuthenticated();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;