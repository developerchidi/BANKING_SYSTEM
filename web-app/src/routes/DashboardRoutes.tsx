import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Loading } from '../components/ui/Loading';
import ProfilePage from '../pages/ProfilePage';
// TODO: Tạo CardList component nếu cần

const Dashboard = lazy(() => import('../pages/DashboardPage'));
const AccountList = lazy(() => import('../components/banking/AccountListContainer'));
const TransactionList = lazy(() => import('../components/banking/TransactionListContainer'));
const Cards = lazy(() => import('../pages/CardsPage'));

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading text="Đang xác thực..." />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};

export const DashboardRoutes: React.FC = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Suspense fallback={<Loading text="Đang tải trang..." />}>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="accounts" element={<AccountList />} />
            <Route path="cards" element={<Cards />} />
            <Route path="transactions" element={<TransactionList />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}; 