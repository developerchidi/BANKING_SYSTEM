import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { AuthRoutes } from './routes/AuthRoutes';
import { DashboardRoutes } from './routes/DashboardRoutes';
import { NotificationProvider } from './context/NotificationContext';
import { Notification } from './components/ui/Notification';

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/auth/login" replace />} />
            <Route path="/auth/*" element={<AuthRoutes />} />
            <Route path="/dashboard/*" element={<DashboardRoutes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Notification />
        </Router>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
