import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isKycVerified: boolean;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  userRoles?: Array<{
    id: string;
    userId: string;
    roleId: string;
    assignedBy?: string;
    assignedAt: string;
    expiresAt?: string;
    isActive: boolean;
    role: {
      id: string;
      name: string;
      displayName: string;
      description?: string;
      permissions?: string[];
      level: number;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
    createdAt: string;
    updatedAt: string;
  }>;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (studentId: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roleName: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adminToken');
      console.log('🔐 Auth check - token exists:', !!token);
      
      if (token) {
        try {
          // Set token in API service
          apiService.setToken(token);
          
          // Get current user info
          console.log('🔐 Getting current user...');
          const userData = await apiService.getCurrentUser();
          console.log('🔐 User data received:', userData);
          
          if (userData) {
            console.log('🔐 User roles:', userData.roles);
            console.log('🔐 User roles length:', userData.roles?.length);
            setUser(userData);
          } else {
            console.log('🔐 No user data received, clearing auth');
            localStorage.removeItem('adminToken');
            apiService.logout();
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('adminToken');
          apiService.logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (studentId: string, password: string) => {
    try {
      const response = await apiService.login(studentId, password);
      
      // apiService.login() returns { token: string; user: User } on success
      // or throws an error on failure
      if (response.token && response.user) {
        const token = response.token;
        localStorage.setItem('adminToken', token);
        apiService.setToken(token);
        
        // Get user data
        const userData = await apiService.getCurrentUser();
        console.log('🔐 AuthContext - getCurrentUser result:', userData);
        console.log('🔐 AuthContext - userData type:', typeof userData);
        console.log('🔐 AuthContext - userData is null?', userData === null);
        console.log('🔐 AuthContext - userData is undefined?', userData === undefined);
        
        if (userData) {
          console.log('🔐 AuthContext - Setting user data:', userData);
          console.log('🔐 AuthContext - userData keys:', Object.keys(userData));
          console.log('🔐 AuthContext - userData.userRoles:', userData.userRoles);
          setUser(userData);
        } else {
          console.log('🔐 AuthContext - No user data, throwing error');
          throw new Error('Failed to get user data after login');
        }
        
        return { success: true };
      } else {
        return { success: false, message: 'Đăng nhập thất bại' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Có lỗi xảy ra khi đăng nhập' };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    apiService.logout();
    setUser(null);
  };

  const isAuthenticated = !!user;

  const hasRole = (roleName: string): boolean => {
    if (!user?.userRoles) return false;
    return user.userRoles.some(userRole => userRole.role.name === roleName);
  };

  const hasPermission = (permission: string): boolean => {
    console.log('🔐 Checking permission:', permission);
    console.log('🔐 User:', user);
    console.log('🔐 User roles:', user?.userRoles);
    
    if (!user?.userRoles) {
      console.log('🔐 No roles found, returning false');
      return false;
    }
    
    // Get all permissions from user's roles
    const permissions = new Set<string>();
    user.userRoles.forEach(userRole => {
      // This would need to be implemented based on your role system
      // For now, we'll use role levels as a simple permission system
      const roleLevel = userRole.role.level;
      console.log('🔐 Role:', userRole.role.name, 'Level:', roleLevel);
      
      // Define permission levels (this is a simplified approach)
      if (roleLevel >= 100) {
        // SUPER_ADMIN has all permissions
        permissions.add('*');
        console.log('🔐 SUPER_ADMIN detected, adding all permissions');
      } else if (roleLevel >= 90) {
        // ADMIN has most permissions
        permissions.add('user:read');
        permissions.add('user:write');
        permissions.add('role:manage');
      } else if (roleLevel >= 70) {
        // MANAGER/COMPLIANCE/AUDITOR
        permissions.add('user:read');
        permissions.add('transaction:read');
      } else if (roleLevel >= 50) {
        // TELLER/CUSTOMER_SERVICE
        permissions.add('user:read');
        permissions.add('transaction:read');
      }
    });
    
    console.log('🔐 All permissions:', Array.from(permissions));
    const hasPermissionResult = permissions.has('*') || permissions.has(permission);
    console.log('🔐 Has permission result:', hasPermissionResult);
    
    return hasPermissionResult;
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
