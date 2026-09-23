import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('landstack_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('landstack_token');
      const savedUser = localStorage.getItem('landstack_user');

      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        } catch {
          localStorage.removeItem('landstack_token');
          localStorage.removeItem('landstack_user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginCitizen = async (email, password) => {
    const res = await api.post('/api/auth/citizen/login', { email, password });
    const authData = res.data;
    localStorage.setItem('landstack_token', authData.token);
    localStorage.setItem('landstack_user', JSON.stringify(authData));
    setToken(authData.token);
    setUser(authData);
    return authData;
  };

  const loginStaff = async (email, password) => {
    const res = await api.post('/api/auth/staff/login', { email, password });
    const authData = res.data;
    localStorage.setItem('landstack_token', authData.token);
    localStorage.setItem('landstack_user', JSON.stringify(authData));
    setToken(authData.token);
    setUser(authData);
    return authData;
  };

  const registerCitizen = async (formData) => {
    const res = await api.post('/api/auth/register', formData);
    const authData = res.data;
    localStorage.setItem('landstack_token', authData.token);
    localStorage.setItem('landstack_user', JSON.stringify(authData));
    setToken(authData.token);
    setUser(authData);
    return authData;
  };

  const logout = () => {
    const isStaff = user?.role && user.role !== 'CITIZEN';
    localStorage.removeItem('landstack_token');
    localStorage.removeItem('landstack_user');
    setUser(null);
    setToken(null);
    window.location.href = isStaff ? '/staff/login' : '/login';
  };

  const hasRole = (requiredRoles) => {
    if (!user) return false;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    return user.role === requiredRoles;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginCitizen,
        loginStaff,
        registerCitizen,
        logout,
        hasRole,
        isAuthenticated: !!user && !!token,
      }}
    >
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
