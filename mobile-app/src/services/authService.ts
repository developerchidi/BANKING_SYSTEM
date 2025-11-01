import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, createApiUrl, logApiCall, logApiResponse, logApiError } from '../config';

const API_URL = createApiUrl(API_CONFIG.ENDPOINTS.AUTH);
const TWO_FA_URL = createApiUrl(API_CONFIG.ENDPOINTS.TWO_FA);

export async function login(email: string, password: string) {
  const res = await axios.post(`${API_URL}/login`, { email, password });
  
  // Lưu accessToken hoặc temporaryToken vào AsyncStorage
  if (res.data.success) {
    if (res.data.requiresTwoFactor && res.data.temporaryToken) {
      await AsyncStorage.setItem('temporaryToken', res.data.temporaryToken);
      await AsyncStorage.setItem('userId', res.data.user.id);
    } else if (res.data.accessToken) {
      await AsyncStorage.setItem('accessToken', res.data.accessToken);
    }
  }
  return res.data;
}

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}) {
  const res = await axios.post(`${API_URL}/register`, data);
  return res.data;
}

export async function forgotPassword(email: string) {
  const res = await axios.post(`${API_URL}/forgot-password`, { email });
  return res.data;
}

export async function resetPassword(token: string, password: string) {
  const res = await axios.post(`${API_URL}/reset-password`, { token, password });
  return res.data;
}

export async function verifyEmail(token: string) {
  const res = await axios.post(`${API_URL}/verify-email`, { token });
  return res.data;
}

export async function resendVerification(email: string) {
  const res = await axios.post(`${API_URL}/resend-verification`, { email });
  return res.data;
}

export async function completeTwoFactorLogin(userId: string, code: string) {
  // Lấy temporaryToken từ AsyncStorage
  const temporaryToken = await AsyncStorage.getItem('temporaryToken');
  if (!temporaryToken) throw new Error('Chưa đăng nhập hoặc token 2FA đã hết hạn');

  const res = await axios.post(
    `${TWO_FA_URL}/verify-code`,
    { code },
    { headers: { Authorization: `Bearer ${temporaryToken}` } }
  );
  // Lưu accessToken vào AsyncStorage nếu 2FA thành công
  if (res.data.success && res.data.accessToken) {
    await AsyncStorage.setItem('accessToken', res.data.accessToken);
    // Xóa temporary token sau khi 2FA thành công
    await AsyncStorage.removeItem('temporaryToken');
  }
  return res.data;
}

export async function sendTwoFactorCode() {
  // Lấy temporaryToken từ AsyncStorage cho 2FA
  const temporaryToken = await AsyncStorage.getItem('temporaryToken');
  if (!temporaryToken) throw new Error('Chưa đăng nhập hoặc token 2FA đã hết hạn');
  
  const res = await axios.post(`${TWO_FA_URL}/send-code`, {}, {
    headers: { Authorization: `Bearer ${temporaryToken}` }
  });
  return res.data;
}

export async function logout() {
  await AsyncStorage.removeItem('accessToken');
  await AsyncStorage.removeItem('userId');
  await AsyncStorage.removeItem('temporaryToken');
} 