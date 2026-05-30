import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../context/AuthStore';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, token } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
