import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../../services/authService';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { setAuthenticated } from '../../store/authSlice';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { LinearGradient } from 'expo-linear-gradient';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

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

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await login(email, password);
      console.log('Login result:', result);
      
      if (result.requiresTwoFactor) {
        // Navigate to 2FA screen
        navigation.navigate('TwoFactor', { userId: result.user.id, email: result.user.email });
      } else if (result.success && result.accessToken) {
        // Direct login success - update Redux state
        dispatch(setAuthenticated(true));
        
        // Show success message
        Alert.alert(
          'Thành công',
          'Đăng nhập thành công!',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(result.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
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
                  Welcome to{'\n'}
                  <Text style={styles.welcomeHighlight}>Modern Banking</Text>
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  Experience the future of banking with our secure, intuitive platform designed for the modern world.
                </Text>
              </View>

              {/* Features */}
              <View style={styles.featuresSection}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="shield-checkmark" size={16} color="#10b981" />
                  </View>
                  <Text style={styles.featureText}>Bank-level security encryption</Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="headset" size={16} color="#3b82f6" />
                  </View>
                  <Text style={styles.featureText}>24/7 customer support</Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="time" size={16} color="#8b5cf6" />
                  </View>
                  <Text style={styles.featureText}>Real-time transaction monitoring</Text>
                </View>
              </View>

              {/* Login Form */}
              <View style={styles.formContainer}>
                <View style={styles.formCard}>


                  {error ? (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={20} color="#fca5a5" />
                      <Text style={styles.errorText}>{error}</Text>
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

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Password</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Enter your password"
                          placeholderTextColor="rgba(255,255,255,0.5)"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeIcon}
                        >
                          <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color="rgba(255,255,255,0.5)"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Forgot Password */}
                    <TouchableOpacity
                      style={styles.forgotPassword}
                      onPress={() => navigation.navigate('ForgotPassword')}
                    >
                      <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity
                      style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                      onPress={handleLogin}
                      disabled={loading}
                    >
                      {loading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator color="#ffffff" size="small" />
                          <Text style={styles.loginButtonText}>Signing in...</Text>
                        </View>
                      ) : (
                        <Text style={styles.loginButtonText}>Sign In</Text>
                      )}
                    </TouchableOpacity>

                    {/* Sign Up Link */}
                    <View style={styles.signUpContainer}>
                      <Text style={styles.signUpText}>Don't have an account? </Text>
                      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.signUpLink}>Sign up</Text>
                      </TouchableOpacity>
                    </View>
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
    opacity: 0.2,
  },
  blob1: {
    width: 200,
    height: 200,
    backgroundColor: '#a855f7',
    top: -50,
    left: -50,
  },
  blob2: {
    width: 150,
    height: 150,
    backgroundColor: '#fbbf24',
    top: 100,
    right: -30,
  },
  blob3: {
    width: 180,
    height: 180,
    backgroundColor: '#ec4899',
    bottom: 100,
    left: 50,
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
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
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
  featuresSection: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
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
  formHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  form: {
    gap: spacing.gap,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: isSmallScreen ? 44 : 50,
    fontSize: isSmallScreen ? 14 : 16,
    color: '#ffffff',
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#a855f7',
    fontWeight: '500',
  },
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  signUpLink: {
    fontSize: 14,
    color: '#a855f7',
    fontWeight: 'bold',
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