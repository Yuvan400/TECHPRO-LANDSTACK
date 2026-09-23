import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute, RoleProtectedRoute } from './components/ProtectedRoute';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import LandStackAIChatbot from './components/LandStackAIChatbot';

import Login from './pages/Login';
import StaffLogin from './pages/StaffLogin';
import Register from './pages/Register';
import StatePortal from './pages/StatePortal';
import IndiaMapPage from './pages/IndiaMapPage';
import LandMap from './pages/LandMap';
import Dashboard from './pages/Dashboard';
import ServicesCatalog from './pages/ServicesCatalog';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';

// Citizen
import ApplyService from './pages/citizen/ApplyService';
import ApplicationsList from './pages/citizen/ApplicationsList';
import ApplicationDetail from './pages/citizen/ApplicationDetail';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import StaffManagement from './pages/admin/StaffManagement';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import ServiceManagement from './pages/admin/ServiceManagement';
import AuditLogs from './pages/admin/AuditLogs';

// Supervisor
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import SupervisorApplicationReview from './pages/supervisor/SupervisorApplicationReview';

// Field Officer
import FieldDashboard from './pages/field/FieldDashboard';
import FieldOfficerDashboard from './pages/field/FieldOfficerDashboard';
import FieldOfficerApplicationDetail from './pages/field/FieldOfficerApplicationDetail';

// Layout wrapper for authenticated dashboard views with Sidebar
const DashboardLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-1 min-h-[calc(100vh-4.25rem)]">
      {isAuthenticated && <Sidebar />}
      <main className="flex-1 overflow-x-hidden bg-slate-50">
        {children}
      </main>
    </div>
  );
};

// Root route: Shows login page first if unauthenticated, or redirects to role dashboard if authenticated
const RootRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'DEPARTMENT_SUPERVISOR') return <Navigate to="/supervisor/dashboard" replace />;
  if (user.role === 'FIELD_OFFICER') return <Navigate to="/officer/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

export function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-['Inter',sans-serif]">
            <Navbar />

            <Routes>
              {/* Primary Entrypoint: Shows login first, or routes to respective dashboard */}
              <Route path="/" element={<RootRoute />} />
              <Route path="/login" element={<Login />} />
              <Route path="/staff/login" element={<StaffLogin />} />
              <Route path="/register" element={<Register />} />
              <Route path="/state/:stateId" element={<StatePortal />} />
              <Route path="/india-map" element={<IndiaMapPage />} />
              <Route path="/select-state" element={<IndiaMapPage />} />

              {/* Authenticated Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Dashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Cadastral Map (Protected) */}
              <Route
                path="/map"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <LandMap />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Services Catalog (Protected) */}
              <Route
                path="/services"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ServicesCatalog />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Citizen Protected Routes */}
              <Route
                path="/services/apply"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ApplyService />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ApplicationsList />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications/:id"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ApplicationDetail />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <NotificationsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ProfilePage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <RoleProtectedRoute allowedRoles={['ADMIN']}>
                    <DashboardLayout>
                      <AdminDashboard />
                    </DashboardLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin/staff"
                element={
                  <RoleProtectedRoute allowedRoles={['ADMIN']}>
                    <DashboardLayout>
                      <StaffManagement />
                    </DashboardLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin/departments"
                element={
                  <RoleProtectedRoute allowedRoles={['ADMIN']}>
                    <DashboardLayout>
                      <DepartmentManagement />
                    </DashboardLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin/services"
                element={
                  <RoleProtectedRoute allowedRoles={['ADMIN']}>
                    <DashboardLayout>
                      <ServiceManagement />
                    </DashboardLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <RoleProtectedRoute allowedRoles={['ADMIN']}>
                    <DashboardLayout>
                      <AuditLogs />
                    </DashboardLayout>
                  </RoleProtectedRoute>
                }
              />

              {/* Supervisor Routes */}
              <Route
                path="/supervisor"
                element={
                  <RoleProtectedRoute allowedRoles={['DEPARTMENT_SUPERVISOR', 'ADMIN']}>
                    <DashboardLayout>
                      <SupervisorDashboard />
                    </DashboardLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/supervisor/dashboard"
                element={
                  <RoleProtectedRoute allowedRoles={['DEPARTMENT_SUPERVISOR', 'ADMIN']}>
                    <DashboardLayout>
                      <SupervisorDashboard />
                    </DashboardLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/supervisor/applications"
                element={
                  <RoleProtectedRoute allowedRoles={['DEPARTMENT_SUPERVISOR', 'ADMIN']}>
                    <DashboardLayout>
                      <SupervisorDashboard />
                    </DashboardLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/supervisor/application/:applicationId"
                element={
                  <RoleProtectedRoute allowedRoles={['DEPARTMENT_SUPERVISOR', 'ADMIN']}>
                    <DashboardLayout>
                      <SupervisorApplicationReview />
                    </DashboardLayout>
                  </RoleProtectedRoute>
                }
              />

              {/* Officer / Field Officer Routes */}
              <Route
                path="/officer"
                element={
                  <RoleProtectedRoute allowedRoles={['FIELD_OFFICER', 'ADMIN']}>
                    <DashboardLayout>
                      <FieldOfficerDashboard />
                    </DashboardLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/officer/dashboard"
                element={
                  <RoleProtectedRoute allowedRoles={['FIELD_OFFICER', 'ADMIN']}>
                    <DashboardLayout>
                      <FieldOfficerDashboard />
                    </DashboardLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/officer/application/:applicationId"
                element={
                  <RoleProtectedRoute allowedRoles={['FIELD_OFFICER', 'ADMIN']}>
                    <DashboardLayout>
                      <FieldOfficerApplicationDetail />
                    </DashboardLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/field-officer/dashboard"
                element={
                  <RoleProtectedRoute allowedRoles={['FIELD_OFFICER', 'ADMIN']}>
                    <DashboardLayout>
                      <FieldOfficerDashboard />
                    </DashboardLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/field-officer/application/:applicationId"
                element={
                  <RoleProtectedRoute allowedRoles={['FIELD_OFFICER', 'ADMIN']}>
                    <DashboardLayout>
                      <FieldOfficerApplicationDetail />
                    </DashboardLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/field"
                element={
                  <RoleProtectedRoute allowedRoles={['FIELD_OFFICER', 'ADMIN']}>
                    <DashboardLayout>
                      <FieldOfficerDashboard />
                    </DashboardLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/field/dashboard"
                element={
                  <RoleProtectedRoute allowedRoles={['FIELD_OFFICER', 'ADMIN']}>
                    <DashboardLayout>
                      <FieldOfficerDashboard />
                    </DashboardLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/field/assignments"
                element={
                  <RoleProtectedRoute allowedRoles={['FIELD_OFFICER', 'ADMIN']}>
                    <DashboardLayout>
                      <FieldOfficerDashboard />
                    </DashboardLayout>
                  </RoleProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* AI Assistant Chatbot (Voice & Text) */}
            <LandStackAIChatbot />

            <Footer />
          </div>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
