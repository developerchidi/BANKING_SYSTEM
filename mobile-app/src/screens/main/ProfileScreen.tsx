import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  StatusBar,
  Dimensions,
  Platform,
  Image,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import * as authActions from '../../store/authSlice';
import { updateCurrency, refreshCurrency } from '../../store/currencySlice';
import { 
  getUserProfile,
  updateUserProfile,
  handleApiError,
  userService
} from '../../services/bankingService';
import { logout as logoutService } from '../../services/authService';
import { RootState, AppDispatch } from '../../store';

 

const { width, height } = Dimensions.get('window');

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  avatar?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  kycStatus: string;
  profilePicture?: string;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  address: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Settings {
  notifications: boolean;
  biometricAuth: boolean;
  darkMode: boolean;
  language: string;
}

interface UserPreferences {
  language: string;
  theme: string;
  notifications: boolean;
}

const CURRENCY_OPTIONS = [
  { label: 'US Dollar (USD)', value: 'USD' },
  { label: 'Vietnamese Dong (VND)', value: 'VND' },
  { label: 'Euro (EUR)', value: 'EUR' },
  { label: 'Japanese Yen (JPY)', value: 'JPY' },
];

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: ''
  });
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [settings, setSettings] = useState<Settings>({
    notifications: true,
    biometricAuth: false,
    darkMode: true,
    language: 'vi'
  });
  const [editLoading, setEditLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Get currency state from Redux
  const { displayCurrency, loading: currencyLoading, error: currencyError } = useSelector((state: RootState) => state.currency);
  
  
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [pendingCurrency, setPendingCurrency] = useState(displayCurrency);
  const [currencyUpdateLoading, setCurrencyUpdateLoading] = useState(false);
  const [currencyKey, setCurrencyKey] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Luôn sync pendingCurrency với displayCurrency khi displayCurrency thay đổi
  useEffect(() => {
    setPendingCurrency(displayCurrency);
    setCurrencyKey(prev => prev + 1);
  }, [displayCurrency]);

  // Force re-render function
  const forceReRender = () => {
    setForceUpdate(prev => prev + 1);
  };

  // Load profile data
  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [profileResponse, preferencesResponse] = await Promise.all([
        userService.getProfile(),
        userService.getPreferences(),
      ]);
      
      if (profileResponse.success) {
        setProfile(profileResponse.data);
        setProfileData({
          firstName: profileResponse.data.firstName,
          lastName: profileResponse.data.lastName,
          phone: profileResponse.data.phone || '',
          dateOfBirth: profileResponse.data.dateOfBirth || '',
          address: profileResponse.data.address || ''
        });
      }
      
      if (preferencesResponse.success) {
        setPreferences(preferencesResponse.data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  // Load data on mount
  useEffect(() => {
    loadProfileData();
  }, []);

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: async () => {
          await logoutService();
          dispatch(authActions.logout());
        } },
      ]
    );
  };

  // Handle change password
  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  // Handle edit profile
  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  // Handle deactivate account
  const handleDeactivateAccount = () => {
    Alert.alert(
      'Vô hiệu hóa tài khoản',
      'Bạn có chắc chắn muốn vô hiệu hóa tài khoản? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Vô hiệu hóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.deactivateAccount();
              Alert.alert('Thành công', 'Tài khoản đã được vô hiệu hóa');
              dispatch(authActions.logout());
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể vô hiệu hóa tài khoản');
            }
          },
        },
      ]
    );
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return '#10b981';
      case 'PENDING':
        return '#f59e0b';
      case 'REJECTED':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'Đã xác thực';
      case 'PENDING':
        return 'Đang chờ';
      case 'REJECTED':
        return 'Từ chối';
      default:
        return 'Chưa xác thực';
    }
  };

  const handleEditProfileSubmit = async () => {
    if (!validateProfileForm()) return;

    try {
      setEditLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProfile(prev => prev ? {
        ...prev,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        dateOfBirth: profileData.dateOfBirth,
        address: profileData.address
      } : null);
      
      setShowEditModal(false);
      setErrors({});
      
      Alert.alert('Thành công', 'Cập nhật thông tin thành công');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Lỗi', handleApiError(error));
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePasswordSubmit = async () => {
    if (!validatePasswordForm()) return;

    try {
      setPasswordLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setErrors({});
      
      Alert.alert('Thành công', 'Đổi mật khẩu thành công');
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Lỗi', handleApiError(error));
    } finally {
      setPasswordLoading(false);
    }
  };

  const validateProfileForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'Vui lòng nhập tên';
    }

    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'Vui lòng nhập họ';
    }

    if (profileData.phone && !/^[0-9]{10,11}$/.test(profileData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (currencyLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (loading) {
    return (
      <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!profile) {
    return (
      <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Ionicons name="person-circle-outline" size={64} color="rgba(255,255,255,0.5)" />
            <Text style={styles.errorTitle}>Không thể tải thông tin</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadProfileData}>
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hồ sơ</Text>
          <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
            <Ionicons name="create-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <LinearGradient
              colors={['#4f46e5', '#6366f1', '#8b5cf6']}
              style={styles.profileGradient}
            >
              <View style={styles.avatarContainer}>
                {profile.profilePicture ? (
                  <Image source={{ uri: profile.profilePicture }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {getInitials(profile.firstName, profile.lastName)}
                    </Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.profileName}>
                {profile.firstName} {profile.lastName}
              </Text>
              <Text style={styles.profileEmail}>{profile.email}</Text>
              
              <View style={styles.verificationStatus}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(profile.kycStatus) }]} />
                <Text style={styles.statusText}>
                  {getStatusText(profile.kycStatus)}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Profile Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Ionicons name="person-outline" size={20} color="#6366f1" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Họ và tên</Text>
                  <Text style={styles.infoValue}>
                    {profile.firstName} {profile.lastName}
                  </Text>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <Ionicons name="mail-outline" size={20} color="#6366f1" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{profile.email}</Text>
                </View>
              </View>
              
              {profile.phone && (
                <View style={styles.infoItem}>
                  <Ionicons name="call-outline" size={20} color="#6366f1" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Số điện thoại</Text>
                    <Text style={styles.infoValue}>{profile.phone}</Text>
                  </View>
                </View>
              )}
              
              {profile.dateOfBirth && (
                <View style={styles.infoItem}>
                  <Ionicons name="calendar-outline" size={20} color="#6366f1" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Ngày sinh</Text>
                    <Text style={styles.infoValue}>{formatDate(profile.dateOfBirth)}</Text>
                  </View>
                </View>
              )}
              
              {profile.address && (
                <View style={styles.infoItem}>
                  <Ionicons name="location-outline" size={20} color="#6366f1" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Địa chỉ</Text>
                    <Text style={styles.infoValue}>{profile.address}</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={20} color="#6366f1" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Thành viên từ</Text>
                  <Text style={styles.infoValue}>{formatDate(profile.createdAt)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Security Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bảo mật</Text>
            <View style={styles.settingsCard}>
              <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
                <View style={styles.settingIcon}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6366f1" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Đổi mật khẩu</Text>
                  <Text style={styles.settingDescription}>Cập nhật mật khẩu tài khoản</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>
              
              <View style={styles.settingItem}>
                <View style={styles.settingIcon}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#6366f1" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Xác thực 2 yếu tố</Text>
                  <Text style={styles.settingDescription}>
                    {profile.twoFactorEnabled ? 'Đã bật' : 'Chưa bật'}
                  </Text>
                </View>
                <Switch
                  value={profile.twoFactorEnabled}
                  onValueChange={() => {}}
                  trackColor={{ false: '#374151', true: '#4f46e5' }}
                  thumbColor={profile.twoFactorEnabled ? '#fff' : '#9ca3af'}
                />
              </View>
            </View>
          </View>

          {/* App Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cài đặt ứng dụng</Text>
            <View style={styles.settingsCard}>
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingIcon}>
                  <Ionicons name="language-outline" size={20} color="#6366f1" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Ngôn ngữ</Text>
                  <Text style={styles.settingDescription}>{preferences?.language === 'vi' ? 'Tiếng Việt' : 'English'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingIcon}>
                  <Ionicons name="color-palette-outline" size={20} color="#6366f1" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Giao diện</Text>
                  <Text style={styles.settingDescription}>
                    {preferences?.theme === 'light' ? 'Sáng' : 'Tối'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingIcon}>
                  <Ionicons name="notifications-outline" size={20} color="#6366f1" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Thông báo</Text>
                  <Text style={styles.settingDescription}>
                    {preferences?.notifications ? 'Bật' : 'Tắt'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tài khoản</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.dangerRow} onPress={handleDeactivateAccount}>
                <View style={styles.settingLeft}>
                  <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
                  <Text style={[styles.settingLabel, { color: '#ef4444' }]}>Vô hiệu hóa tài khoản</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerRow} onPress={handleLogout}>
                <View style={styles.settingLeft}>
                  <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                  <Text style={[styles.settingLabel, { color: '#ef4444' }]}>Đăng xuất</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Version Info */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
          </View>

          

          {/* Currency Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cài đặt tiền tệ</Text>
            <View style={styles.settingsCard}>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => {
                  setPendingCurrency(displayCurrency);
                  setShowCurrencyModal(true);
                }}
                disabled={currencyLoading}
              >
                <View style={styles.settingIcon}>
                  <Ionicons name="cash-outline" size={20} color="#6366f1" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Đơn vị tiền tệ hiển thị</Text>
                  <Text key={`currency-${currencyKey}-${forceUpdate}`} style={styles.settingDescription}>
                    {currencyLoading ? (
                      <Text style={styles.settingDescription}>Đang tải...</Text>
                    ) : (
                      (() => {
                        const label = CURRENCY_OPTIONS.find(opt => opt.value === displayCurrency)?.label || displayCurrency;
                        return `${label} (${displayCurrency})`;
                      })()
                    )}
                  </Text>
                  {currencyError && (
                    <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                      {currencyError}
                    </Text>
                  )}
                </View>
                {currencyLoading ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#64748b" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Edit Profile Modal */}
        <Modal
          visible={showEditModal}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.form}>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Họ</Text>
                  <TextInput
                    style={[styles.formInput, errors.lastName && styles.formInputError]}
                    placeholder="Nhập họ"
                    placeholderTextColor="#64748b"
                    value={profileData.lastName}
                    onChangeText={(text) => setProfileData(prev => ({ ...prev, lastName: text }))}
                  />
                  {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Tên</Text>
                  <TextInput
                    style={[styles.formInput, errors.firstName && styles.formInputError]}
                    placeholder="Nhập tên"
                    placeholderTextColor="#64748b"
                    value={profileData.firstName}
                    onChangeText={(text) => setProfileData(prev => ({ ...prev, firstName: text }))}
                  />
                  {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Số điện thoại</Text>
                  <TextInput
                    style={[styles.formInput, errors.phone && styles.formInputError]}
                    placeholder="Nhập số điện thoại"
                    placeholderTextColor="#64748b"
                    value={profileData.phone}
                    onChangeText={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
                    keyboardType="phone-pad"
                  />
                  {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Ngày sinh</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#64748b"
                    value={profileData.dateOfBirth}
                    onChangeText={(text) => setProfileData(prev => ({ ...prev, dateOfBirth: text }))}
                  />
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Địa chỉ</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    placeholder="Nhập địa chỉ"
                    placeholderTextColor="#64748b"
                    value={profileData.address}
                    onChangeText={(text) => setProfileData(prev => ({ ...prev, address: text }))}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.modalButtonText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleEditProfileSubmit}
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonTextPrimary}>Lưu thay đổi</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          visible={showPasswordModal}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
                <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Mật khẩu hiện tại</Text>
                  <TextInput
                    style={[styles.formInput, errors.currentPassword && styles.formInputError]}
                    placeholder="Nhập mật khẩu hiện tại"
                    placeholderTextColor="#64748b"
                    value={passwordData.currentPassword}
                    onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                    secureTextEntry
                  />
                  {errors.currentPassword && <Text style={styles.errorText}>{errors.currentPassword}</Text>}
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Mật khẩu mới</Text>
                  <TextInput
                    style={[styles.formInput, errors.newPassword && styles.formInputError]}
                    placeholder="Nhập mật khẩu mới"
                    placeholderTextColor="#64748b"
                    value={passwordData.newPassword}
                    onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                    secureTextEntry
                  />
                  {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Xác nhận mật khẩu mới</Text>
                  <TextInput
                    style={[styles.formInput, errors.confirmPassword && styles.formInputError]}
                    placeholder="Nhập lại mật khẩu mới"
                    placeholderTextColor="#64748b"
                    value={passwordData.confirmPassword}
                    onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                    secureTextEntry
                  />
                  {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowPasswordModal(false)}
                >
                  <Text style={styles.modalButtonText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleChangePasswordSubmit}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonTextPrimary}>Đổi mật khẩu</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Currency Modal */}
        <Modal
          visible={showCurrencyModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCurrencyModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 24, width: '90%' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, marginBottom: 20, textAlign: 'center' }}>
                Chọn đơn vị tiền tệ
              </Text>
              {CURRENCY_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: pendingCurrency === opt.value ? '#334155' : 'transparent',
                    borderRadius: 10,
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    marginBottom: 10,
                    borderWidth: pendingCurrency === opt.value ? 2 : 1,
                    borderColor: pendingCurrency === opt.value ? '#10b981' : '#334155',
                  }}
                  onPress={() => {
                    setPendingCurrency(opt.value);
                  }}
                >
                  <Ionicons name="cash-outline" size={22} color={pendingCurrency === opt.value ? '#10b981' : '#cbd5e1'} style={{ marginRight: 12 }} />
                  <Text style={{ color: '#fff', fontSize: 16 }}>{opt.label}</Text>
                  {pendingCurrency === opt.value && (
                    <Ionicons name="checkmark-circle" size={22} color="#10b981" style={{ marginLeft: 8 }} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={async () => {
                  if (pendingCurrency !== displayCurrency) {
                    setCurrencyUpdateLoading(true);
                    try {
                      await dispatch(updateCurrency(pendingCurrency)).unwrap();
                      
                      // Refresh currency from backend
                      await dispatch(refreshCurrency()).unwrap();
                      
                      // Force refresh the screen data
                      await loadProfileData();
                      
                      // Force re-render
                      forceReRender();
                      
                      Alert.alert('Thành công', 'Đã cập nhật đơn vị tiền tệ!');
                    } catch (error) {
                      console.error('Error updating currency:', error);
                    } finally {
                      setCurrencyUpdateLoading(false);
                      setShowCurrencyModal(false);
                    }
                  } else {
                    setShowCurrencyModal(false);
                  }
                }}
                style={{ 
                  marginTop: 10, 
                  alignItems: 'center', 
                  paddingVertical: 12, 
                  borderRadius: 8, 
                  backgroundColor: pendingCurrency !== displayCurrency ? '#10b981' : '#334155' 
                }}
                disabled={pendingCurrency === displayCurrency || currencyUpdateLoading}
              >
                {currencyUpdateLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                    {pendingCurrency === displayCurrency ? 'Đóng' : 'Lưu lựa chọn'}
                  </Text>
                )}
              </TouchableOpacity>
              {pendingCurrency !== displayCurrency && (
                <TouchableOpacity
                  onPress={() => {
                    setPendingCurrency(displayCurrency);
                    setShowCurrencyModal(false);
                  }}
                  style={{ marginTop: 10, alignItems: 'center', paddingVertical: 12, borderRadius: 8, backgroundColor: '#64748b' }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Hủy</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  profileCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileGradient: {
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  settingsCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99,102,241,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  logoutButton: {
    marginTop: 32,
    marginBottom: 32,
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  form: {
    maxHeight: 400,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
  },
  formInputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 8,
  },
  toggle: {
    width: 40,
    height: 20,
    borderRadius: 10,
    position: 'relative',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#10b981',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ProfileScreen; 