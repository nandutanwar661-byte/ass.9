import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/Admin/DashboardPage';
import VisitorsPage from './pages/Admin/VisitorsPage';
import PassesPage from './pages/Admin/PassesPage';
import AppointmentsPage from './pages/Admin/AppointmentsPage';
import CheckInOutPage from './pages/Security/CheckInOutPage';
import ReportsPage from './pages/Admin/ReportsPage';
import UsersPage from './pages/Admin/UsersPage';
import MyPassPage from './pages/Visitor/MyPassPage';
import SettingsPage from './pages/Admin/SettingsPage';
import VerifyPassPage from './pages/VerifyPassPage';
import PreRegisterPage from './pages/PreRegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected route wrapper
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/verify/:token" element={<VerifyPassPage />} />
      <Route path="/pre-register/:token" element={<PreRegisterPage />} />

      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="visitors" element={
          <ProtectedRoute roles={['admin', 'security', 'host']}>
            <VisitorsPage />
          </ProtectedRoute>
        } />
        <Route path="passes" element={
          <ProtectedRoute roles={['admin', 'security']}>
            <PassesPage />
          </ProtectedRoute>
        } />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="checkinout" element={
          <ProtectedRoute roles={['admin', 'security']}>
            <CheckInOutPage />
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute roles={['admin']}>
            <ReportsPage />
          </ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute roles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        } />
        <Route path="my-pass" element={
          <ProtectedRoute roles={['visitor']}>
            <MyPassPage />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute roles={['admin']}>
            <SettingsPage />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e2535', color: '#e8ecf4', border: '1px solid #2a3347' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#1e2535' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#1e2535' } },
          }}
        />
      </Router>
    </AuthProvider>
  );
}
