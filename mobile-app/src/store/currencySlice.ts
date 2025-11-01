import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile, updateDisplayCurrency, fetchExchangeRates } from '../services/bankingService';

interface CurrencyState {
  displayCurrency: string;
  loading: boolean;
  error: string | null;
  exchangeRates: Record<string, number>;
}

const initialState: CurrencyState = {
  displayCurrency: 'USD',
  loading: false,
  error: null,
  exchangeRates: { USD: 1 },
};

// Async thunk để load currency từ backend
export const loadCurrencyFromBackend = createAsyncThunk(
  'currency/loadFromBackend',
  async () => {
    console.log('[CurrencySlice] Loading currency from backend...');
    const profile = await getUserProfile();
    console.log('[CurrencySlice] Profile response:', profile);
    
    if (profile?.success && profile?.data?.displayCurrency) {
      const currency = profile.data.displayCurrency;
      console.log('[CurrencySlice] Setting currency from backend:', currency);
      await AsyncStorage.setItem('displayCurrency', currency);
      return currency;
    } else {
      // Fallback to local storage
      const localCurrency = await AsyncStorage.getItem('displayCurrency') || 'USD';
      console.log('[CurrencySlice] Fallback to local storage:', localCurrency);
      return localCurrency;
    }
  }
);

// Async thunk để update currency
export const updateCurrency = createAsyncThunk(
  'currency/update',
  async (currency: string) => {
    console.log('[CurrencySlice] Updating currency to:', currency);
    
    // Update backend first
    const response = await updateDisplayCurrency(currency);
    
    if (response?.success) {
      console.log('[CurrencySlice] Backend update successful');
      await AsyncStorage.setItem('displayCurrency', currency);
      return currency;
    } else {
      throw new Error('Backend update failed');
    }
  }
);

// Async thunk để refresh currency
export const refreshCurrency = createAsyncThunk(
  'currency/refresh',
  async () => {
    console.log('[CurrencySlice] Refreshing currency...');
    const profile = await getUserProfile();
    console.log('[CurrencySlice] Refresh - Profile response:', profile);
    
    if (profile?.success && profile?.data?.displayCurrency) {
      const currency = profile.data.displayCurrency;
      console.log('[CurrencySlice] Refresh - Setting currency from backend:', currency);
      await AsyncStorage.setItem('displayCurrency', currency);
      return currency;
    } else {
      throw new Error('Failed to refresh currency');
    }
  }
);

// Async thunk để fetch exchange rates từ UniRateAPI
export const fetchRates = createAsyncThunk(
  'currency/fetchRates',
  async (base: string = 'USD') => {
    console.log('🔄 [CurrencySlice] Fetching exchange rates for base:', base);
    const data = await fetchExchangeRates(base);
    console.log('✅ [CurrencySlice] Fetched exchange rates data:', data);
    
    // Đảm bảo rates có đủ các currency, đặc biệt là VND
    const rates = data.rates || {};
    console.log('📊 [CurrencySlice] Processed rates:', rates);
    
    // Kiểm tra xem có VND không
    if (!rates.VND) {
      console.warn('⚠️ [CurrencySlice] VND rate not found in response:', rates);
    }
    
    return rates;
  }
);

// Hàm chuyển đổi tiền tệ
export function convertCurrency(amount: number, from: string, to: string, rates: Record<string, number>) {
  if (from === to) return amount;
  if (!rates[from] || !rates[to]) return amount;
  return amount * (rates[to] / rates[from]);
}

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setCurrency: (state, action: PayloadAction<string>) => {
      console.log('[CurrencySlice] setCurrency reducer called with:', action.payload);
      state.displayCurrency = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load currency from backend
      .addCase(loadCurrencyFromBackend.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCurrencyFromBackend.fulfilled, (state, action) => {
        console.log('[CurrencySlice] loadCurrencyFromBackend fulfilled:', action.payload);
        state.displayCurrency = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(loadCurrencyFromBackend.rejected, (state, action) => {
        console.error('[CurrencySlice] loadCurrencyFromBackend rejected:', action.error);
        state.loading = false;
        state.error = action.error.message || 'Failed to load currency';
      })
      
      // Update currency
      .addCase(updateCurrency.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCurrency.fulfilled, (state, action) => {
        console.log('[CurrencySlice] updateCurrency fulfilled:', action.payload);
        state.displayCurrency = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(updateCurrency.rejected, (state, action) => {
        console.error('[CurrencySlice] updateCurrency rejected:', action.error);
        state.loading = false;
        state.error = action.error.message || 'Failed to update currency';
      })
      
      // Refresh currency
      .addCase(refreshCurrency.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshCurrency.fulfilled, (state, action) => {
        console.log('[CurrencySlice] refreshCurrency fulfilled:', action.payload);
        state.displayCurrency = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(refreshCurrency.rejected, (state, action) => {
        console.error('[CurrencySlice] refreshCurrency rejected:', action.error);
        state.loading = false;
        state.error = action.error.message || 'Failed to refresh currency';
      })

      // Fetch exchange rates
      .addCase(fetchRates.fulfilled, (state, action) => {
        console.log('💾 [CurrencySlice] Saving exchange rates to state:', action.payload);
        console.log('💾 [CurrencySlice] Current state before update:', state.exchangeRates);
        
        // Lưu tất cả rates, không chỉ USD
        state.exchangeRates = { USD: 1, ...action.payload };
        
        console.log('💾 [CurrencySlice] Updated state after save:', state.exchangeRates);
      })
      .addCase(fetchRates.rejected, (state, action) => {
        console.error('❌ [CurrencySlice] Failed to fetch exchange rates:', action.error);
        state.error = action.error.message || 'Failed to fetch exchange rates';
      });
  },
});

export const { setCurrency, clearError } = currencySlice.actions;
export default currencySlice.reducer; 