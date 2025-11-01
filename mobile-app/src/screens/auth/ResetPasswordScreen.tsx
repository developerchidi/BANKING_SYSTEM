import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { resetPassword } from '../../services/authService';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = route.params || {};
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleReset = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu không khớp');
      setLoading(false);
      return;
    }
    try {
      await resetPassword(token, form.password);
      setSuccess('Đặt lại mật khẩu thành công!');
      setTimeout(() => navigation.navigate('Login'), 2000);
    } catch (err) {
      setError(err.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đặt lại mật khẩu</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}
      <TextInput style={styles.input} placeholder="Mật khẩu mới" value={form.password} onChangeText={v => handleChange('password', v)} secureTextEntry />
      <TextInput style={styles.input} placeholder="Nhập lại mật khẩu" value={form.confirmPassword} onChangeText={v => handleChange('confirmPassword', v)} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>}
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