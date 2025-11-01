import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  Alert, 
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Modal,
  Animated
} from 'react-native';
import { completeTwoFactorLogin, sendTwoFactorCode } from '../../services/authService';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setAuthenticated } from '../../store/authSlice';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type TwoFactorScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'TwoFactor'>;
type TwoFactorScreenRouteProp = RouteProp<AuthStackParamList, 'TwoFactor'>;

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

export default function TwoFactorScreen() {
  const navigation = useNavigation<TwoFactorScreenNavigationProp>();
  const route = useRoute<TwoFactorScreenRouteProp>();
  const { email } = route.params;
  const [userId, setUserId] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);
  const dispatch = useDispatch();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Lấy userId từ AsyncStorage khi component mount
  useEffect(() => {
    const getUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          setError('Không tìm thấy thông tin người dùng');
        }
      } catch (err) {
        setError('Lỗi khi tải thông tin người dùng');
      }
    };
    getUserId();
  }, []);

  // Gửi mã OTP tự động khi vào màn hình
  useEffect(() => {
    const autoSendCode = async () => {
      setError('');
      setSuccess('');
      try {
        await sendTwoFactorCode();
        setSuccess('Đã gửi mã xác thực đến email!');
      } catch (err) {
        setError(err.message || 'Gửi mã xác thực thất bại');
      }
    };
    autoSendCode();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const showSuccessModalWithAnimation = () => {
    setShowSuccessModal(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideSuccessModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessModal(false);
      // Navigate to main app after modal closes
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as any }],
      });
    });
  };

  const handleSubmit = async () => {
    if (!userId) {
      setError('Không tìm thấy thông tin người dùng');
      return;
    }
    
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Vui lòng nhập đủ 6 số');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('Submitting 2FA code:', fullCode);
      const result = await completeTwoFactorLogin(userId, fullCode);
      console.log('2FA result:', result);
      
      if (result.success) {
        setSuccess('Xác thực thành công!');
        
        // Verify token was saved
      const token = await AsyncStorage.getItem('accessToken');
      console.log('Token after 2FA:', token);
        
        if (token) {
          // Update Redux state
      dispatch(setAuthenticated(true));
          
          // Clear temporary data
          await AsyncStorage.removeItem('temporaryToken');
          await AsyncStorage.removeItem('userId');
          
          // Show beautiful success modal
          showSuccessModalWithAnimation();
        } else {
          throw new Error('Token không được lưu đúng cách');
        }
      } else {
        throw new Error(result.message || 'Xác thực thất bại');
      }
    } catch (err) {
      console.error('2FA Error:', err);
      setError(err.message || 'Xác thực thất bại');
      setCode(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    setSuccess('');
    try {
      await sendTwoFactorCode();
      setSuccess('Đã gửi lại mã xác thực!');
    } catch (err) {
      setError(err.message || 'Gửi lại thất bại');
    } finally {
      setResendLoading(false);
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
                  Two-Factor{'\n'}
                  <Text style={styles.welcomeHighlight}>Authentication</Text>
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  Enter the 6-digit code sent to your email for secure access.
                </Text>
              </View>

              {/* 2FA Form */}
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

                  {/* Email Display */}
                  <View style={styles.emailContainer}>
                    <Text style={styles.emailLabel}>Code sent to:</Text>
                    <Text style={styles.emailText}>{email}</Text>
                  </View>

                  {/* OTP Input */}
                  <View style={styles.otpContainer}>
                    <Text style={styles.otpLabel}>Enter 6-digit code</Text>
      <View style={styles.codeContainer}>
        {code.map((v, i) => (
          <TextInput
            key={i}
                          ref={(ref) => {
                            if (ref) inputRefs.current[i] = ref;
                          }}
            style={styles.codeInput}
            value={v}
                          onChangeText={(val) => handleChange(i, val)}
                          onKeyPress={(e) => handleKeyPress(i, e)}
            keyboardType="number-pad"
            maxLength={1}
            autoFocus={i === 0}
                          placeholder="•"
                          placeholderTextColor="rgba(255,255,255,0.3)"
          />
        ))}
      </View>
                  </View>

                  {/* Buttons */}
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                      style={[styles.primaryButton, loading && styles.buttonDisabled]} 
                      onPress={handleSubmit} 
                      disabled={loading}
                    >
                      {loading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator color="#ffffff" size="small" />
                          <Text style={styles.buttonText}>Verifying...</Text>
                        </View>
                      ) : (
                        <Text style={styles.buttonText}>Verify Code</Text>
                      )}
      </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.secondaryButton, resendLoading && styles.buttonDisabled]} 
                      onPress={handleResend} 
                      disabled={resendLoading}
                    >
                      {resendLoading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator color="#a855f7" size="small" />
                          <Text style={styles.secondaryButtonText}>Sending...</Text>
                        </View>
                      ) : (
                        <Text style={styles.secondaryButtonText}>Resend Code</Text>
                      )}
      </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.backButton} 
                      onPress={() => navigation.goBack()}
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

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="none"
        onRequestClose={hideSuccessModal}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient
              colors={['#10b981', '#059669', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalGradient}
            >
              {/* Success Icon */}
              <View style={styles.successIconContainer}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark" size={40} color="#ffffff" />
                </View>
              </View>

              {/* Success Title */}
              <Text style={styles.modalTitle}>Đăng nhập thành công!</Text>
              
              {/* Success Message */}
              <Text style={styles.modalMessage}>
                Chào mừng bạn quay trở lại!{'\n'}
                Tài khoản của bạn đã được xác thực an toàn.
              </Text>

              {/* Continue Button */}
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={hideSuccessModal}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>Tiếp tục</Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Modal>
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
  logoContainer: {
    width: isSmallScreen ? 40 : 48,
    height: isSmallScreen ? 40 : 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: isSmallScreen ? 10 : 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTextContainer: {
    marginLeft: 16,
    justifyContent: 'center',
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
  mainContent: {
    flex: 1,
    paddingHorizontal: spacing.padding,
    paddingTop: isSmallScreen ? 20 : 40,
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
  emailContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  emailLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  otpContainer: {
    marginBottom: 32,
  },
  otpLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: isSmallScreen ? 8 : 12,
  },
  codeInput: {
    width: isSmallScreen ? 44 : 50,
    height: isSmallScreen ? 52 : 60,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: isSmallScreen ? 10 : 12,
    textAlign: 'center',
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  buttonContainer: {
    gap: spacing.gap,
  },
  primaryButton: {
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
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: isSmallScreen ? 12 : 16,
    paddingVertical: isSmallScreen ? 14 : 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#a855f7',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#a855f7',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  modalGradient: {
    padding: 32,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
}); 