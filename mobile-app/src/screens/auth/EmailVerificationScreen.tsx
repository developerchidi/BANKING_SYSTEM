import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { verifyEmail, resendVerification } from '../../services/authService';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function EmailVerificationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { email, token } = route.params || {};
  const [inputToken, setInputToken] = useState(token || '');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await verifyEmail(inputToken);
      setSuccess('Xác thực email thành công!');
      setTimeout(() => navigation.navigate('Login'), 2000);
    } catch (err) {
      setError(err.message || 'Xác thực thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    setSuccess('');
    try {
      await resendVerification(email);
      setSuccess('Đã gửi lại email xác thực!');
    } catch (err) {
      setError(err.message || 'Gửi lại thất bại');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Xác thực Email</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}
      <TextInput style={styles.input} placeholder="Mã xác thực" value={inputToken} onChangeText={setInputToken} autoCapitalize="none" />
      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Xác thực</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleResend} disabled={resendLoading}>
        {resendLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Gửi lại email xác thực</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Quay lại đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  input: { width: '100%', padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 16, backgroundColor: '#fff' },
  button: { width: '100%', backgroundColor: '#4f46e5', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  error: { color: '#ef4444', marginBottom: 12 },
  success: { color: '#10b981', marginBottom: 12 },
  link: { color: '#4f46e5', marginTop: 8 },
}); 