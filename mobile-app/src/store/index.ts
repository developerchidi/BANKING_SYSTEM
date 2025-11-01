import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import currencyReducer from './currencySlice';
import { loadCurrencyFromBackend, fetchRates } from './store/currencySlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    currency: currencyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store; 