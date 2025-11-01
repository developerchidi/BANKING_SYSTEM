import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { forgotPassword } from '../../services/authService';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { LinearGradient } from 'expo-linear-gradient';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const { width, height } = Dimensions.get('window');

// Responsive values based on screen size
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 414;
const isLargeScreen = width >= 414;

// Dynamic spacing based on screen size
const getResponsiveSpacing = () => {
  if (isSmallScreen) return { padding: 16, gap: 12, fontSize: 12 };
  if (isMediumScreen) return { padding: 20, gap: 16, fontSize: 14 };
  return { padding: 24, gap: 20, fontSize: 16 };
};

const spacing = getResponsiveSpacing();

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleForgot = async () => {
    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await forgotPassword(email);
      setSuccess('Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.');
      setEmail('');
    } catch (err) {
      setError(err.message || 'Gửi email thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#7c3aed', '#0f172a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Animated Background Elements */}
            <View style={styles.backgroundElements}>
              <View style={[styles.blob, styles.blob1]} />
              <View style={[styles.blob, styles.blob2]} />
              <View style={[styles.blob, styles.blob3]} />
            </View>

            {/* Header - Logo & Brand */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="shield-checkmark" size={isSmallScreen ? 20 : 24} color="#ffffff" />
              </View>
              <View style={styles.brandTextContainer}>
                <Text style={styles.brandTitle}>BANKING SYSTEM</Text>
                <Text style={styles.brandSubtitle}>Secure • Fast • Reliable</Text>
              </View>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
              {/* Welcome Text */}
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeTitle}>
                  Forgot your{'\n'}
                  <Text style={styles.welcomeHighlight}>Password?</Text>
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  Don't worry! Enter your email and we'll send you a link to reset your password.
                </Text>
              </View>

              {/* Forgot Password Form */}
              <View style={styles.formContainer}>
                <View style={styles.formCard}>
                  {error ? (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={18} color="#fca5a5" />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  {success ? (
                    <View style={styles.successContainer}>
                      <Ionicons name="checkmark-circle" size={18} color="#86efac" />
                      <Text style={styles.successText}>{success}</Text>
                    </View>
                  ) : null}

                  <View style={styles.form}>
                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Email Address</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
                          placeholder="Enter your email"
                          placeholderTextColor="rgba(255,255,255,0.5)"
        value={email}
        onChangeText={setEmail}
                          keyboardType="email-address"
        autoCapitalize="none"
                          autoCorrect={false}
                          autoFocus
                        />
                      </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                      style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                      onPress={handleForgot}
                      disabled={loading}
                    >
                      {loading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator color="#ffffff" size="small" />
                          <Text style={styles.submitButtonText}>Sending...</Text>
                        </View>
                      ) : (
                        <Text style={styles.submitButtonText}>Send Reset Link</Text>
                      )}
      </TouchableOpacity>

                    {/* Back to Login */}
                    <TouchableOpacity 
                      style={styles.backButton} 
                      onPress={() => navigation.navigate('Login')}
                    >
                      <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.backButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Version Info - Fixed Bottom */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2025 Banking System. All rights reserved.</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blob: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.15,
  },
  blob1: {
    width: 120,
    height: 120,
    backgroundColor: '#a855f7',
    top: -30,
    left: -30,
  },
  blob2: {
    width: 100,
    height: 100,
    backgroundColor: '#fbbf24',
    top: 50,
    right: -20,
  },
  blob3: {
    width: 80,
    height: 80,
    backgroundColor: '#ec4899',
    bottom: 50,
    left: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.padding,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
  },
  brandTextContainer: {
    marginLeft: 16,
    justifyContent: 'center',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: spacing.padding,
    paddingTop: isSmallScreen ? 20 : 40,
  },
  logoContainer: {
    width: isSmallScreen ? 40 : 48,
    height: isSmallScreen ? 40 : 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: isSmallScreen ? 10 : 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: isSmallScreen ? 16 : 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  brandSubtitle: {
    fontSize: isSmallScreen ? 10 : 12,
    color: 'rgba(255,255,255,0.7)',
  },
  welcomeSection: {
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
  },
  welcomeHighlight: {
    color: '#a855f7',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    flex: 1,
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: isSmallScreen ? 16 : 24,
    padding: spacing.padding,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  successText: {
    color: '#86efac',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  form: {
    gap: spacing.gap,
  },
  inputContainer: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: isSmallScreen ? 44 : 50,
    fontSize: isSmallScreen ? 14 : 16,
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#a855f7',
    borderRadius: isSmallScreen ? 12 : 16,
    paddingVertical: isSmallScreen ? 14 : 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginLeft: 8,
  },
  versionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: spacing.padding,
  },
  versionText: {
    fontSize: isSmallScreen ? 11 : 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: isSmallScreen ? 10 : 11,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
}); 