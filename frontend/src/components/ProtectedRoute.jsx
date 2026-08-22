import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '@/services/authService';

const ProtectedRoute = () => {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/dang-nhap" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;