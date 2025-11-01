import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setAuthenticated } from '../store/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function AppNavigator() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [isLoading, setIsLoading] = useState(true);
  
  console.log('AppNavigator (Redux): isAuthenticated =', isAuthenticated);

  // Check authentication status on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const hasToken = !!token;
        
        console.log('AppNavigator: Checking auth status, token exists:', hasToken);
        
        if (hasToken !== isAuthenticated) {
          dispatch(setAuthenticated(hasToken));
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        dispatch(setAuthenticated(false));
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [dispatch, isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <NavigationContainer key={isAuthenticated ? 'main' : 'auth'}>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
}); 