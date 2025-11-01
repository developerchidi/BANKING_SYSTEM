import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, createApiUrl, logApiCall, logApiResponse, logApiError } from '../config';
import store from '../store';
import { logout } from '../store/authSlice';
import { CommonActions } from '@react-navigation/native';

const API_URL = API_CONFIG.BASE_URL + '/api';

// Đọc API key từ .env file
const UNIRATE_API_KEY = 'aR7WIfkcWrio3y3n9j41PWLZ7lEy0koteWgI7L0Za5qkGjaO99EpHi53Q70ZxsjA';

// Create axios instance with auth interceptor
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log API call
    logApiCall(config.method?.toUpperCase() || 'GET', config.url || '', config.data);
    
    return config;
  },
  (error) => {
    logApiError('REQUEST', 'unknown', error);
    return Promise.reject(error);
  }
);

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    // Log successful response
    logApiResponse(response.config.method?.toUpperCase() || 'GET', response.config.url || '', response.data);
    return response;
  },
  async (error) => {
    // Log error response
    logApiError(error.config?.method?.toUpperCase() || 'GET', error.config?.url || '', error);
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('accessToken');
      store.dispatch(logout());
      // Optional: reset navigation to login
      // Nếu bạn muốn chuyển về màn hình login ngay lập tức, hãy dùng NavigationService hoặc truyền navigation vào đây
    }
    return Promise.reject(error);
  }
);

// User Profile
export async function getUserProfile() {
  const response = await apiClient.get('/user/profile');
  return response.data;
}

export async function updateUserProfile(data: any) {
  const response = await apiClient.put('/user/profile', data);
  return response.data;
}

// Account Management
export async function getAccounts() {
  const response = await apiClient.get('/banking/accounts');
  return response.data;
}

export async function getAccountDetails(accountId: string) {
  const response = await apiClient.get(`/banking/accounts/${accountId}`);
  return response.data;
}

export async function getAccountBalance(accountId: string) {
  const response = await apiClient.get(`/banking/accounts/${accountId}/balance`);
  return response.data;
}

export async function createAccount(accountData: any) {
  const response = await apiClient.post('/banking/accounts', accountData);
  return response.data;
}

// Transactions
export async function getTransactions(accountId?: string, limit = 10, offset = 0) {
  const params: any = { limit, offset };
  if (accountId) {
    params.accountId = accountId;
  }
  const response = await apiClient.get('/banking/transactions', { params });
  return response.data;
}

export async function getTransactionDetails(transactionId: string) {
  const response = await apiClient.get(`/banking/transactions/${transactionId}`);
  return response.data;
}

export async function transferMoney(transferData: {
  fromAccountId: string;
  toAccountId?: string;
  toAccountNumber?: string;
  amount: number;
  description?: string;
  transferType: 'internal' | 'external' | 'beneficiary';
}) {
  const response = await apiClient.post('/banking/transfer', transferData);
  return response.data;
}

// Verify Transfer OTP
export async function verifyTransferOtp(data: {
  transactionId: string;
  otpCode: string;
}) {
  const response = await apiClient.post('/banking/transfer/verify-otp', data);
  return response.data;
}

// Resend Transfer OTP
export async function resendTransferOtp(data: {
  transactionId: string;
}) {
  const response = await apiClient.post('/banking/transfer/resend-otp', data);
  return response.data;
}

// Cards
export async function getCards() {
  const response = await apiClient.get('/banking/cards');
  return response.data;
}

export async function getCardDetails(cardId: string) {
  const response = await apiClient.get(`/banking/cards/${cardId}`);
  return response.data;
}

// Dashboard Summary
export async function getDashboardSummary() {
  const response = await apiClient.get('/banking/dashboard/summary');
  return response.data;
}

// Account Statement
export async function getAccountStatement(accountId: string, startDate: string, endDate: string) {
  const response = await apiClient.get(`/banking/accounts/${accountId}/statement`, {
    params: { startDate, endDate }
  });
  return response.data;
}

// Beneficiaries
export async function getBeneficiaries() {
  const response = await apiClient.get('/banking/beneficiaries');
  return response.data;
}

export async function addBeneficiary(beneficiaryData: any) {
  const response = await apiClient.post('/banking/beneficiaries', beneficiaryData);
  return response.data;
}

// Kiểm tra số tài khoản đích và lấy tên chủ tài khoản
export async function checkAccountNumber(accountNumber: string) {
  const response = await apiClient.get(`/banking/accounts/lookup?accountNumber=${encodeURIComponent(accountNumber)}`);
  return response.data;
}

// Error handling helper
export function handleApiError(error: any): string {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Có lỗi xảy ra, vui lòng thử lại';
}

// User Profile APIs
export const userService = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/user/profile');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update user profile
  updateProfile: async (data: {
    firstName: string;
    lastName: string;
    phone?: string;
    profilePicture?: string;
  }) => {
    try {
      const response = await apiClient.put('/user/profile', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Change password
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    try {
      const response = await apiClient.post('/user/change-password', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get user preferences
  getPreferences: async () => {
    try {
      const response = await apiClient.get('/user/preferences');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update user preferences
  updatePreferences: async (data: {
    language?: string;
    theme?: string;
    notifications?: boolean;
  }) => {
    try {
      const response = await apiClient.put('/user/preferences', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get KYC status
  getKycStatus: async () => {
    try {
      const response = await apiClient.get('/user/kyc-status');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Submit KYC
  submitKyc: async (data: any) => {
    try {
      const response = await apiClient.post('/user/kyc', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Upload document
  uploadDocument: async (file: any, docType: 'ID_CARD' | 'PASSPORT') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);
      
      const response = await apiClient.post('/user/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Deactivate account
  deactivateAccount: async () => {
    try {
      const response = await apiClient.post('/user/deactivate');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export async function updateDisplayCurrency(displayCurrency: string) {
  const response = await apiClient.put('/user/display-currency', { displayCurrency });
  return response.data;
} 

// UniRateAPI - lấy tỷ giá real-time
export async function fetchExchangeRates(base: string = 'USD') {
  try {
    console.log('🔑 [ExchangeRates] API Key available:', !!UNIRATE_API_KEY);
    console.log('🔑 [ExchangeRates] API Key length:', UNIRATE_API_KEY.length);
    
    if (!UNIRATE_API_KEY) {
      console.error('❌ [ExchangeRates] No API key found! Please set UNIRATE_API_KEY in .env file');
      throw new Error('API key not configured');
    }
    
    const url = `https://api.unirateapi.com/api/rates?api_key=${UNIRATE_API_KEY}&from=${base}`;
    console.log('🌐 [ExchangeRates] Fetching exchange rates from:', url);
    
    const response = await fetch(url);
    console.log('📡 [ExchangeRates] Response status:', response.status);
    console.log('📡 [ExchangeRates] Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [ExchangeRates] Failed to fetch exchange rates:', response.status, response.statusText);
      console.error('❌ [ExchangeRates] Error response:', errorText);
      throw new Error(`Failed to fetch exchange rates: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ [ExchangeRates] Raw exchange rates response:', data);
    
    // Đảm bảo trả về format đúng: { base: 'USD', rates: { VND: ..., EUR: ..., ... } }
    if (data.rates) {
      console.log('✅ [ExchangeRates] Processed exchange rates:', data.rates);
      console.log('✅ [ExchangeRates] Available currencies:', Object.keys(data.rates));
      return data;
    } else {
      console.error('❌ [ExchangeRates] Invalid exchange rates format:', data);
      throw new Error('Invalid exchange rates format');
    }
  } catch (error) {
    console.error('❌ [ExchangeRates] Error fetching exchange rates:', error);
    console.error('❌ [ExchangeRates] Error details:', error.message);
    throw error;
  }
} 