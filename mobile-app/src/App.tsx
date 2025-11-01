import React, { useEffect } from 'react';
import AppNavigator from './navigation/AppNavigator';
import { Provider, useDispatch } from 'react-redux';
import store from './store';
import { loadCurrencyFromBackend, fetchRates } from './store/currencySlice';
import { AppDispatch } from './store';
import { CurrencyProvider } from './context/CurrencyContext';

// Component để load currency khi app khởi động
const AppContent = () => {
  const dispatch = useDispatch<AppDispatch>();

  console.log('[App] AppContent component rendered');

  useEffect(() => {
    console.log('[App] Loading currency on app start');
    console.log('[App] Dispatching loadCurrencyFromBackend...');
    dispatch(loadCurrencyFromBackend());
    console.log('[App] Dispatching fetchRates...');
    dispatch(fetchRates('USD'));
    
    // Log state sau 2 giây để kiểm tra
    setTimeout(() => {
      const state = store.getState();
      console.log('[App] Redux currency state:', state.currency);
      console.log('[App] Exchange rates in store:', state.currency.exchangeRates);
      console.log('[App] Display currency in store:', state.currency.displayCurrency);
    }, 2000);
  }, [dispatch]);

  return <AppNavigator />;
};

export default function App() {
  console.log('[App] Main App component rendered');
  
  return (
    <Provider store={store}>
      <CurrencyProvider>
        <AppContent />
      </CurrencyProvider>
    </Provider>
  );
} 