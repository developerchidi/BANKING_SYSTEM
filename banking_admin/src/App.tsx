import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import VanityPage from './pages/Vanity';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Transactions from './pages/Transactions';
import KYC from './pages/KYC';
import Roles from './pages/Roles';
import Deposit from './pages/Deposit';
import Settings from './pages/Settings';
import TierUpgrades from './pages/TierUpgrades';
import Notifications from './pages/Notifications';

// App Routes Component
const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
      />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/users" element={
        <ProtectedRoute requiredPermission="user:read">
          <Layout>
            <Users />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/transactions" element={
        <ProtectedRoute requiredPermission="transaction:read">
          <Layout>
            <Transactions />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/kyc" element={
        <ProtectedRoute requiredPermission="kyc:read">
          <Layout>
            <KYC />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/roles" element={
        <ProtectedRoute requiredPermission="role:manage">
          <Layout>
            <Roles />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/deposit" element={
        <ProtectedRoute requiredPermission="transaction:write">
          <Layout>
            <Deposit />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/vanity" element={
        <ProtectedRoute>
          <Layout>
            <VanityPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/tier-upgrades" element={
        <ProtectedRoute requiredPermission="user:write">
          <Layout>
            <TierUpgrades />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/notifications" element={
        <ProtectedRoute>
          <Layout>
            <Notifications />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;