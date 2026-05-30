import React, { createContext, useContext, useEffect } from 'react';
import useAuthStore from './AuthStore';

/**
 * AuthContext wrapper around Zustand AuthStore.
 * Provides <AuthProvider> and useAuth() hook for components that expect
 * React Context API pattern while keeping Zustand as the actual state manager.
 */

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const store = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    store.initialize();
  }, []);

  return (
    <AuthContext.Provider value={store}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
