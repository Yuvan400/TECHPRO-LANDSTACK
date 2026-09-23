import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CitizenDashboard from './citizen/CitizenDashboard';
import AdminDashboard from './admin/AdminDashboard';
import SupervisorDashboard from './supervisor/SupervisorDashboard';
import FieldOfficerDashboard from './field/FieldOfficerDashboard';

export const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'DEPARTMENT_SUPERVISOR':
      return <SupervisorDashboard />;
    case 'FIELD_OFFICER':
      return <FieldOfficerDashboard />;
    case 'CITIZEN':
    default:
      return <CitizenDashboard />;
  }
};

export default Dashboard;
