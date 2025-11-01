// API Configuration for Banking System Mobile App
// Thay đổi IP ở đây khi cần thiết

import { CURRENT_ENVIRONMENT } from './environments';

export const API_CONFIG = {
  // Base URL - Thay đổi IP ở đây khi cần
  BASE_URL: CURRENT_ENVIRONMENT.baseUrl,
  
  // Timeout cho API calls
  TIMEOUT: 10000,
  
  // API Endpoints
  ENDPOINTS: {
    AUTH: '/api/auth',
    TWO_FA: '/api/2fa',
    BANKING: '/api/banking',
    USER: '/api/user',
  },
  
  // Development settings
  DEBUG: false,
  LOG_API_CALLS: false,
};

// Helper function để tạo full URL
export const createApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function để log API calls (chỉ trong debug mode)
export const logApiCall = (method: string, url: string, data?: any) => {
  if (API_CONFIG.LOG_API_CALLS) {
    console.log(`🌐 API ${method}: ${url}`, data ? `Data: ${JSON.stringify(data)}` : '');
  }
};

// Helper function để log API response (chỉ trong debug mode)
export const logApiResponse = (method: string, url: string, response: any) => {
  if (API_CONFIG.LOG_API_CALLS) {
    console.log(`✅ API ${method} Response: ${url}`, response);
  }
};

// Helper function để log API error (chỉ trong debug mode)
export const logApiError = (method: string, url: string, error: any) => {
  if (API_CONFIG.LOG_API_CALLS) {
    console.log(`❌ API ${method} Error: ${url}`, error);
  }
}; 