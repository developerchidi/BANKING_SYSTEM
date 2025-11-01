import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = 'http://192.168.31.39:3001'; // Backend URL
axios.defaults.headers.common['Content-Type'] = 'application/json';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ user: any; requiresTwoFactor: boolean; tokens?: any }>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<{ user: any; requiresTwoFactor: boolean }>;
  refreshToken: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  sendTwoFactorCode: (userId: string) => Promise<void>;
  completeTwoFactorLogin: (userId: string, code: string) => Promise<any>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoutTimer, setLogoutTimer] = useState<NodeJS.Timeout | null>(null);

  // Simple auto-logout function
  const handleAutoLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setLoading(false);
    window.location.href = '/auth/login';
  };

  // Setup auto-logout timer
  const setupAutoLogout = () => {
    if (logoutTimer) {
      clearTimeout(logoutTimer);
    }
    const timer = setTimeout(handleAutoLogout, 30 * 60 * 1000); // 30 minutes
    setLogoutTimer(timer);
  };

  // Reset auto-logout timer
  const resetAutoLogoutTimer = () => {
    setupAutoLogout();
  };

  const refreshToken = async () => {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post('/api/auth/refresh', { refreshToken: refreshTokenValue });
      const { tokens, user } = response.data;
      
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
      setUser(user);
      setupAutoLogout();
    } catch (err) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      throw err;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    if (accessToken && userData) {
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        const user = JSON.parse(userData);
        setUser(user);
        setupAutoLogout();
      } catch (err) {
        console.error('Failed to parse user data:', err);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
      }
    }
    setLoading(false);
  }, []);

  // Axios interceptor
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => {
        resetAutoLogoutTimer();
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          const refreshTokenValue = localStorage.getItem('refreshToken');
          if (refreshTokenValue) {
            try {
              await refreshToken();
              return axios.request(error.config);
            } catch {
              handleAutoLogout();
            }
          } else {
            handleAutoLogout();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log('🔐 Frontend: Attempting login for:', email);
      
      const response = await axios.post('/api/auth/login', { email, password });
      console.log('🔐 Frontend: Login response:', response.data);
      
      const { tokens, user, requiresTwoFactor } = response.data;
      
      if (requiresTwoFactor) {
        console.log('🔐 Frontend: 2FA required, returning user info without tokens');
        // Return 2FA info without setting tokens
        return { user, requiresTwoFactor: true };
      }
      
      console.log('🔐 Frontend: Login successful, setting tokens');
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
      setUser(user);
      setupAutoLogout();
      
      return { user, tokens, requiresTwoFactor: false };
    } catch (err) {
      console.error('❌ Frontend: Login error:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to login');
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (refreshTokenValue) {
        await axios.post('/api/auth/logout', { refreshToken: refreshTokenValue });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      if (logoutTimer) {
        clearTimeout(logoutTimer);
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setError(null);
      setLoading(true);
      console.log('🔐 Frontend: Attempting registration for:', userData.email);
      
      const response = await axios.post('/api/auth/register', userData);
      console.log('🔐 Frontend: Registration response:', response.data);
      
      const { user, requiresTwoFactor } = response.data;
      
      if (requiresTwoFactor) {
        console.log('🔐 Frontend: 2FA required for registration');
        return { user, requiresTwoFactor: true };
      }
      
      console.log('🔐 Frontend: Registration successful, no 2FA required');
      localStorage.setItem('pendingVerificationEmail', userData.email);
      setUser(user);
      return { user, requiresTwoFactor: false };
    } catch (err) {
      console.error('❌ Frontend: Registration error:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to register');
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to change password');
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to send reset email');
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/reset-password', {
        token,
        newPassword: password,
      });
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to reset password');
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/verify-email', { token });
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to verify email');
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    }
  };

  const resendVerification = async (email: string) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/resend-verification', { email });
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to resend verification email');
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    }
  };

  const sendTwoFactorCode = async (userId: string) => {
    try {
      setError(null);
      console.log('🔐 Frontend: Sending 2FA code for user:', userId);
      
      const response = await axios.post('/api/2fa/send-code-login', { userId });
      console.log('🔐 Frontend: 2FA code sent successfully:', response.data);
    } catch (err) {
      console.error('❌ Frontend: Failed to send 2FA code:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to send 2FA code');
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    }
  };

  const completeTwoFactorLogin = async (userId: string, code: string) => {
    try {
      setError(null);
      setLoading(true);
      const response = await axios.post('/api/auth/2fa/complete-login', { userId, code });
      const { tokens, user } = response.data;
      
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
      setUser(user);
      setupAutoLogout();
      
      return { tokens, user };
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to complete 2FA login');
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    sendTwoFactorCode,
    completeTwoFactorLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 