import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Pages
import Dashboard from '../pages/Dashboard';
import LeadsManagement from '../pages/LeadsManagement';
import AddLead from '../pages/AddLead';
import LeadDetails from '../pages/LeadDetails';
import Followups from '../pages/Followups';
import UsersManagement from '../pages/UsersManagement';
import Settings from '../pages/Settings';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<div className="flex items-center justify-center h-screen font-bold text-2xl">Access Denied</div>} />

      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/leads" 
        element={
          <ProtectedRoute>
            <LeadsManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/leads/add" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'COUNSELOR']}>
            <AddLead />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/leads/:id" 
        element={
          <ProtectedRoute>
            <LeadDetails />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/followups" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'COUNSELOR']}>
            <Followups />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/users" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <UsersManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Settings />
          </ProtectedRoute>
        } 
      />

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
