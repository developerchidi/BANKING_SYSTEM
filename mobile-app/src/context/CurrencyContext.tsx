import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile, updateDisplayCurrency } from '../services/bankingService';
import { Alert } from 'react-native';

interface CurrencyContextType {
  displayCurrency: string;
  setDisplayCurrency: (currency: string) => Promise<void>;
  refreshCurrency: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const CurrencyContext = createContext<CurrencyContextType>({
  displayCurrency: 'USD',
  setDisplayCurrency: async () => {},
  refreshCurrency: async () => {},
  loading: false,
  error: null,
});

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [displayCurrency, setDisplayCurrencyState] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('[CurrencyContext] Provider initialized with displayCurrency:', displayCurrency);

  // Load currency from backend or local
  useEffect(() => {
    console.log('[CurrencyContext] useEffect triggered - loading currency');
    const loadCurrency = async () => {
      console.log('[CurrencyContext] loadCurrency function started');
      setLoading(true);
      setError(null);
      try {
        console.log('[CurrencyContext] Calling getUserProfile...');
        const profile = await getUserProfile();
        console.log('[CurrencyContext] Profile response:', profile);
        
        if (profile?.success && profile?.data?.displayCurrency) {
          const currency = profile.data.displayCurrency;
          console.log('[CurrencyContext] Setting currency from backend:', currency);
          setDisplayCurrencyState(currency);
          await AsyncStorage.setItem('displayCurrency', currency);
          console.log('[CurrencyContext] Loaded from backend:', currency);
        } else {
          // Fallback to local storage
          const localCurrency = await AsyncStorage.getItem('displayCurrency') || 'USD';
          console.log('[CurrencyContext] Fallback to local storage:', localCurrency);
          setDisplayCurrencyState(localCurrency);
        }
      } catch (e) {
        console.error('[CurrencyContext] Error loading currency:', e);
        // Fallback to local storage on error
        const localCurrency = await AsyncStorage.getItem('displayCurrency') || 'USD';
        setDisplayCurrencyState(localCurrency);
        setError('Không thể tải cài đặt từ server, sử dụng cài đặt local');
      } finally {
        setLoading(false);
        console.log('[CurrencyContext] loadCurrency completed, loading set to false');
      }
    };
    loadCurrency();
  }, []);

  // Debug: Log when displayCurrency changes
  useEffect(() => {
    console.log('[CurrencyContext] displayCurrency state changed to:', displayCurrency);
  }, [displayCurrency]);

  // Hàm đổi currency
  const setDisplayCurrency = async (currency: string) => {
    if (currency === displayCurrency) {
      console.log('[CurrencyContext] Currency unchanged:', currency);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('[CurrencyContext] Updating currency to:', currency);
      
      // Update backend first
      const response = await updateDisplayCurrency(currency);
      
      if (response?.success) {
        console.log('[CurrencyContext] Backend update successful');
        
        // Update local state and storage after successful backend update
        setDisplayCurrencyState(currency);
        await AsyncStorage.setItem('displayCurrency', currency);
        
        console.log('[CurrencyContext] Local state updated to:', currency);
      } else {
        throw new Error('Backend update failed');
      }
      
    } catch (e) {
      console.error('[CurrencyContext] Error updating currency:', e);
      setError('Không thể cập nhật đơn vị tiền tệ');
      
      // Don't revert on error, keep the current state
      console.log('[CurrencyContext] Keeping current currency on error');
      
      // Show error alert
      Alert.alert(
        'Lỗi',
        'Không thể cập nhật đơn vị tiền tệ. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Refresh currency from backend
  const refreshCurrency = async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await getUserProfile();
      console.log('[CurrencyContext] Refresh - Profile response:', profile);
      
      if (profile?.success && profile?.data?.displayCurrency) {
        const currency = profile.data.displayCurrency;
        console.log('[CurrencyContext] Refresh - Setting currency from backend:', currency);
        setDisplayCurrencyState(currency);
        await AsyncStorage.setItem('displayCurrency', currency);
      }
    } catch (e) {
      console.error('[CurrencyContext] Refresh - Error:', e);
      setError('Không thể refresh từ server');
    } finally {
      setLoading(false);
    }
  };

  console.log('[CurrencyContext] Rendering provider with displayCurrency:', displayCurrency);
  
  return (
    <CurrencyContext.Provider value={{ 
      displayCurrency, 
      setDisplayCurrency, 
      refreshCurrency,
      loading,
      error 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  console.log('[useCurrency] Hook called, displayCurrency:', context.displayCurrency);
  return context;
}; 