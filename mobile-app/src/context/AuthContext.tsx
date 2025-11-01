import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isAuthenticated: boolean;
  setAuthenticated: (auth: boolean) => void;
  checkAuth: () => Promise<void>;
  forceUpdate: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setAuthenticated: () => {},
  checkAuth: async () => {},
  forceUpdate: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [, setForce] = useState(0);

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    setAuthenticated(!!token);
    console.log('AuthContext: checkAuth, token =', token, 'isAuthenticated =', !!token);
  };

  // Hàm này sẽ force re-render context
  const forceUpdate = () => setForce(f => f + 1);

  useEffect(() => {
    checkAuth();
    const interval = setInterval(() => {
      checkAuth();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setAuthenticated, checkAuth, forceUpdate }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 