import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/ui/Loading';

const LoginForm = lazy(() => import('../components/auth/LoginForm').then(m => ({ default: m.LoginForm })));
const RegisterForm = lazy(() => import('../components/auth/RegisterForm').then(m => ({ default: m.RegisterForm })));
const ForgotPasswordForm = lazy(() => import('../components/auth/ForgotPasswordForm').then(m => ({ default: m.ForgotPasswordForm })));
const ResetPasswordForm = lazy(() => import('../components/auth/ResetPasswordForm').then(m => ({ default: m.ResetPasswordForm })));
const EmailVerificationForm = lazy(() => import('../components/auth/EmailVerificationForm').then(m => ({ default: m.EmailVerificationForm })));

export const AuthRoutes: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Allow access to reset-password and verify-email even when logged in
  const isPublicAuthPage = location.pathname.includes('/reset-password') || 
                          location.pathname.includes('/verify-email');

  // Redirect to dashboard if user is already logged in (except for public auth pages)
  if (user && !isPublicAuthPage) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Suspense fallback={<Loading text="Đang tải trang xác thực..." />}>
      <Routes>
        <Route index element={<Navigate to="login" replace />} />
        <Route path="login" element={<LoginForm />} />
        <Route path="register" element={<RegisterForm />} />
        <Route path="forgot-password" element={<ForgotPasswordForm />} />
        <Route path="reset-password" element={<ResetPasswordForm />} />
        <Route path="verify-email" element={<EmailVerificationForm />} />
        <Route path="*" element={<Navigate to="login" replace />} />
      </Routes>
    </Suspense>
  );
}; 