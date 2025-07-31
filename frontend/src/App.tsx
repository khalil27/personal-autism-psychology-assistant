import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Patient pages
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientProfile from './pages/patient/PatientProfile';
import PatientSessions from './pages/patient/PatientSessions';
import PatientReports from './pages/patient/PatientReports';

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorPatients from './pages/doctor/DoctorPatients';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes with layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* Patient routes */}
            <Route path="/patient" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            } />
            <Route path="/patient/profile" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientProfile />
              </ProtectedRoute>
            } />
            <Route path="/patient/sessions" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientSessions />
              </ProtectedRoute>
            } />
            <Route path="/patient/reports" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientReports />
              </ProtectedRoute>
            } />

            {/* Doctor routes */}
            <Route path="/doctor" element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/doctor/patients" element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorPatients />
              </ProtectedRoute>
            } />
            <Route path="/doctor/sessions" element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <PatientSessions />
              </ProtectedRoute>
            } />
            <Route path="/doctor/reports" element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <PatientReports />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/sessions" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PatientSessions />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PatientReports />
              </ProtectedRoute>
            } />
            <Route path="/admin/logs" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;