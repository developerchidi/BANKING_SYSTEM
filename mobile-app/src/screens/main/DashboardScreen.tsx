import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  StatusBar,
  Platform,
  Animated,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthenticated } from '../../store/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  getUserProfile, 
  getAccounts, 
  getTransactions, 
  getDashboardSummary,
  handleApiError 
} from '../../services/bankingService';
import { useCurrency } from '../../context/CurrencyContext';
import { RootState } from '../../store';
import { convertCurrency } from '../../store/currencySlice';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
}

interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string;
  isActive: boolean;
  isFrozen: boolean;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  status: string;
}

interface DashboardData {
  totalBalance: number;
  accountCount: number;
  recentTransactions: Transaction[];
}

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallPhone = width < 375; // iPhone SE, small Android
const isMediumPhone = width >= 375 && width < 414; // iPhone 12/13/14, most Android
const isLargePhone = width >= 414 && width < 768; // iPhone 12/13/14 Pro Max, large Android
const isTablet = width >= 768; // iPad, Android tablets

// Dynamic responsive values
const getResponsiveValues = () => {
  if (isSmallPhone) {
    return {
      padding: 16,
      gap: 12,
      fontSize: {
        small: 10,
        regular: 12,
        medium: 14,
        large: 16,
        xlarge: 18,
        xxlarge: 24,
        xxxlarge: 28,
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        xxl: 24,
        xxxl: 32,
      },
      iconSize: {
        small: 16,
        medium: 20,
        large: 24,
        xlarge: 28,
        xxlarge: 32,
        xxxlarge: 40,
      },
      cardRadius: 12,
      buttonHeight: 44,
    };
  } else if (isMediumPhone) {
    return {
      padding: 20,
      gap: 16,
      fontSize: {
        small: 11,
        regular: 13,
        medium: 15,
        large: 17,
        xlarge: 19,
        xxlarge: 26,
        xxxlarge: 30,
      },
      spacing: {
        xs: 5,
        sm: 10,
        md: 15,
        lg: 20,
        xl: 24,
        xxl: 28,
        xxxl: 36,
      },
      iconSize: {
        small: 18,
        medium: 22,
        large: 26,
        xlarge: 30,
        xxlarge: 34,
        xxxlarge: 42,
      },
      cardRadius: 14,
      buttonHeight: 48,
    };
  } else if (isLargePhone) {
    return {
      padding: 24,
      gap: 20,
      fontSize: {
        small: 12,
        regular: 14,
        medium: 16,
        large: 18,
        xlarge: 20,
        xxlarge: 28,
        xxxlarge: 32,
      },
      spacing: {
        xs: 6,
        sm: 12,
        md: 18,
        lg: 24,
        xl: 28,
        xxl: 32,
        xxxl: 40,
      },
      iconSize: {
        small: 20,
        medium: 24,
        large: 28,
        xlarge: 32,
        xxlarge: 36,
        xxxlarge: 44,
      },
      cardRadius: 16,
      buttonHeight: 52,
    };
  } else { // Tablet
    return {
      padding: 32,
      gap: 24,
      fontSize: {
        small: 14,
        regular: 16,
        medium: 18,
        large: 20,
        xlarge: 22,
        xxlarge: 32,
        xxxlarge: 36,
      },
      spacing: {
        xs: 8,
        sm: 16,
        md: 24,
        lg: 32,
        xl: 40,
        xxl: 48,
        xxxl: 56,
      },
      iconSize: {
        small: 24,
        medium: 28,
        large: 32,
        xlarge: 36,
        xxlarge: 40,
        xxxlarge: 48,
      },
      cardRadius: 20,
      buttonHeight: 56,
    };
  }
};

const responsive = getResponsiveValues();

// Define a fixed header height based on the largest element (avatar)
const headerHeight = responsive.iconSize.xxxlarge * 1.4;

export default DashboardScreen;

function DashboardScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [balanceAnimation] = useState(new Animated.Value(1));
  const displayCurrency = useSelector((state: RootState) => state.currency.displayCurrency);
  const exchangeRates = useSelector((state: RootState) => state.currency.exchangeRates);
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  
  const formatCurrency = (amount: number, fromCurrency: string = 'USD') => {
    const converted = convertCurrency(amount, fromCurrency, displayCurrency, exchangeRates);
    return new Intl.NumberFormat(
      displayCurrency === 'VND' ? 'vi-VN' : 'en-US',
      { style: 'currency', currency: displayCurrency }
    ).format(converted);
  };

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load data in parallel
      const [profileRes, accountsRes, transactionsRes, summaryRes] = await Promise.allSettled([
        getUserProfile(),
        getAccounts(),
        getTransactions(undefined, 5, 0), // Get 5 recent transactions
        getDashboardSummary()
      ]);

      // Handle profile data
      if (profileRes.status === 'fulfilled') {
        const profileData = profileRes.value.data || profileRes.value;
        setUserProfile(profileData);
      }

      // Handle accounts data
      if (accountsRes.status === 'fulfilled') {
        const accountsData = accountsRes.value.data || accountsRes.value;
        const accountsList = accountsData.accounts || accountsData || [];
        setAccounts(accountsList);
      }

      // Handle transactions data
      if (transactionsRes.status === 'fulfilled') {
        const transactionsData = transactionsRes.value.data || transactionsRes.value;
        const transactionsList = transactionsData.transactions || transactionsData || [];
        setTransactions(transactionsList);
      }

      // Handle dashboard summary
      if (summaryRes.status === 'fulfilled') {
        const summaryData = summaryRes.value.data || summaryRes.value;
        setDashboardData(summaryData);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Handle quick action taps
  const handleQuickAction = async (action: string) => {
    setActionLoading(action);
    
    try {
      switch (action) {
        case 'transfer':
          // Navigate to transfer tab
          navigation.navigate('Transfer');
          break;
        case 'payment':
          // Navigate to payments tab
          navigation.navigate('Payments');
          break;
        case 'history':
          // Navigate to transactions tab
          navigation.navigate('Transactions');
          break;
        case 'settings':
          // Navigate to profile tab
          navigation.navigate('Profile');
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error in ${action}:`, error);
      Alert.alert('Lỗi', 'Không thể thực hiện thao tác này');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle account tap
  const handleAccountTap = (account: Account) => {
    // Navigate to accounts tab for now
    navigation.navigate('Accounts');
  };

  // Handle transaction tap
  const handleTransactionTap = (transaction: Transaction) => {
    // Navigate to transactions tab for now
    navigation.navigate('Transactions');
  };

  // Handle view all accounts
  const handleViewAllAccounts = () => {
    navigation.navigate('Accounts');
  };

  // Handle view all transactions
  const handleViewAllTransactions = () => {
    navigation.navigate('Transactions');
  };

  // Handle notification tap
  const handleNotificationTap = () => {
    // Show alert for now since we don't have notifications screen
    Alert.alert('Thông báo', 'Chức năng thông báo đang được phát triển');
  };

  // Animated balance toggle
  const toggleBalance = () => {
    Animated.sequence([
      Animated.timing(balanceAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(balanceAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    setShowBalance(!showBalance);
  };

  // Retry loading data
  const handleRetry = () => {
    setError('');
    loadDashboardData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Hôm nay';
    } else if (diffDays === 2) {
      return 'Hôm qua';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  const getTransactionIcon = (type: string, description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('chuyển') || desc.includes('transfer')) return 'swap-horizontal';
    if (desc.includes('thanh toán') || desc.includes('payment')) return 'card';
    if (desc.includes('rút') || desc.includes('withdraw')) return 'cash-outline';
    if (desc.includes('nạp') || desc.includes('deposit')) return 'add-circle-outline';
    if (desc.includes('lương') || desc.includes('salary')) return 'business-outline';
    return type === 'CREDIT' ? 'arrow-down-circle' : 'arrow-up-circle';
  };

  const getTransactionColor = (type: string) => {
    return type === 'CREDIT' ? '#10b981' : '#ef4444';
  };

  const getAccountStatus = (acc) => {
    if (!acc.isActive) return { text: 'Đã đóng', color: '#ef4444' };
    if (acc.isFrozen) return { text: 'Tạm khóa', color: '#f59e0b' };
    return { text: 'Hoạt động', color: '#10b981' };
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={styles.loadingContainer}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContent}>
          <View style={[styles.loadingIcon, { 
            width: responsive.iconSize.xxxlarge * 2, 
            height: responsive.iconSize.xxxlarge * 2,
            borderRadius: responsive.iconSize.xxxlarge,
            marginBottom: responsive.spacing.xl
          }]}>
            <Ionicons name="shield-checkmark" size={responsive.iconSize.xxxlarge} color="#ffffff" />
          </View>
          <Text style={[styles.loadingText, { fontSize: responsive.fontSize.xlarge }]}>
            Đang tải dữ liệu...
          </Text>
          <ActivityIndicator 
            size="large" 
            color="#ffffff" 
            style={{ marginTop: responsive.spacing.xl }} 
          />
        </View>
      </LinearGradient>
    );
  }

  // Error state
  if (error) {
    return (
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline" size={responsive.iconSize.xxxlarge * 1.5} color="#ef4444" />
            <Text style={[styles.errorTitle, { fontSize: responsive.fontSize.xlarge, marginTop: responsive.spacing.lg }]}>
              Không thể tải dữ liệu
            </Text>
            <Text style={[styles.errorMessage, { fontSize: responsive.fontSize.medium, marginTop: responsive.spacing.md }]}>
              {error}
            </Text>
            <TouchableOpacity 
              style={[styles.retryButton, { 
                marginTop: responsive.spacing.xl,
                paddingHorizontal: responsive.spacing.xl,
                paddingVertical: responsive.spacing.lg,
                borderRadius: responsive.cardRadius
              }]}
              onPress={handleRetry}
            >
              <Text style={[styles.retryButtonText, { fontSize: responsive.fontSize.large }]}>
                Thử lại
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#334155']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
              colors={['#ffffff']}
            />
          }
        >
          {/* Header */}
          <View style={[styles.header, { height: headerHeight, paddingHorizontal: responsive.padding, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}> 
            <View style={[styles.headerLeft, { flexDirection: 'row', alignItems: 'center', height: headerHeight }]}> 
              <View style={[styles.avatarContainer, {
                width: responsive.iconSize.xxxlarge * 1.2,
                height: responsive.iconSize.xxxlarge * 1.2,
                borderRadius: responsive.iconSize.xxxlarge * 0.6,
                marginRight: responsive.spacing.lg,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.15)',
              }]}> 
                <Text style={[styles.avatarText, { fontSize: responsive.fontSize.xlarge, alignSelf: 'center' }]}> 
                  {userProfile?.firstName?.charAt(0) || 'U'} 
                </Text> 
              </View> 
              <View style={[styles.userInfo, { justifyContent: 'center', height: headerHeight }]}> 
                <Text style={[styles.greeting, { fontSize: responsive.fontSize.medium, alignSelf: 'flex-start', color: '#cbd5e1' }]}>Xin chào,</Text> 
                <Text style={[styles.userName, { fontSize: responsive.fontSize.xlarge, alignSelf: 'flex-start', color: '#fff', fontWeight: 'bold' }]}>{userProfile?.firstName || 'Người dùng'}</Text> 
              </View> 
            </View> 
            <TouchableOpacity 
              style={{ minWidth: responsive.iconSize.xxxlarge * 1.2, height: headerHeight, justifyContent: 'center', alignItems: 'center', padding: 0, paddingRight: responsive.spacing.md }}
              onPress={handleNotificationTap}
            > 
              <Ionicons name="notifications-outline" size={responsive.iconSize.large} color="#fff" style={{ alignSelf: 'center' }} />
              <View style={[styles.notificationBadge, {
                top: responsive.spacing.xs,
                right: responsive.spacing.xs,
                width: responsive.spacing.xs * 2,
                height: responsive.spacing.xs * 2,
                borderRadius: responsive.spacing.xs
              }]} />
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <View style={[styles.balanceSection, { paddingHorizontal: responsive.padding, marginBottom: responsive.spacing.xxxl }]}> 
            <LinearGradient
              colors={['#4f46e5', '#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.balanceCard, { borderRadius: responsive.cardRadius * 1.5, paddingVertical: responsive.spacing.xxxl, paddingHorizontal: responsive.spacing.xxl, shadowColor: '#6366f1', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 }]}
            >
              <View style={[styles.balanceHeader, { marginBottom: responsive.spacing.lg }]}> 
                <Text style={[styles.balanceLabel, { fontSize: responsive.fontSize.large, color: '#fff', fontWeight: '600' }]}>Tổng số dư</Text>
                <TouchableOpacity onPress={toggleBalance} style={[styles.eyeButton, { padding: responsive.spacing.xs, paddingRight: responsive.spacing.lg }]}> 
                  <Ionicons name={showBalance ? "eye-outline" : "eye-off-outline"} size={responsive.iconSize.medium} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>
              <Animated.Text 
                style={[
                  styles.balanceAmount, 
                  { 
                    fontSize: responsive.fontSize.xxxlarge, 
                    textDecorationLine: 'none', 
                    color: '#fff', 
                    fontWeight: 'bold', 
                    marginBottom: responsive.spacing.md,
                    opacity: balanceAnimation
                  }
                ]}
              > 
                {showBalance ? formatCurrency(totalBalance, 'USD') : '••••••••'}
              </Animated.Text>
              <Text style={[styles.balanceSubtitle, { fontSize: responsive.fontSize.medium, color: '#e0e7ef' }]}> 
                {accounts.length} tài khoản • {transactions.length} giao dịch gần đây
              </Text>
            </LinearGradient>
          </View>

          {/* Quick Actions */}
          <View style={[styles.section, { paddingHorizontal: responsive.padding, marginBottom: responsive.spacing.xxxl }]}> 
            <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.xxlarge, color: '#fff', fontWeight: 'bold', marginBottom: responsive.spacing.lg }]}>Thao tác nhanh</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: responsive.gap, paddingRight: responsive.spacing.md }}>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => handleQuickAction('transfer')}
                disabled={actionLoading === 'transfer'}
              >
                <LinearGradient colors={['#10b981', '#059669']} style={[styles.actionGradient, { width: responsive.iconSize.xxxlarge * 1.4, height: responsive.iconSize.xxxlarge * 1.4, borderRadius: 999, marginBottom: responsive.spacing.sm, justifyContent: 'center', alignItems: 'center' }]}> 
                  {actionLoading === 'transfer' ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="swap-horizontal" size={responsive.iconSize.xlarge} color="#fff" />
                  )}
                </LinearGradient>
                <Text style={[styles.actionText, { fontSize: responsive.fontSize.small, marginTop: responsive.spacing.md }]}>Chuyển tiền</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => handleQuickAction('payment')}
                disabled={actionLoading === 'payment'}
              >
                <LinearGradient colors={['#f59e0b', '#d97706']} style={[styles.actionGradient, { width: responsive.iconSize.xxxlarge * 1.4, height: responsive.iconSize.xxxlarge * 1.4, borderRadius: 999, marginBottom: responsive.spacing.sm, justifyContent: 'center', alignItems: 'center' }]}> 
                  {actionLoading === 'payment' ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="card-outline" size={responsive.iconSize.xlarge} color="#fff" />
                  )}
                </LinearGradient>
                <Text style={[styles.actionText, { fontSize: responsive.fontSize.small, marginTop: responsive.spacing.md }]}>Thanh toán</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => handleQuickAction('history')}
                disabled={actionLoading === 'history'}
              >
                <LinearGradient colors={['#3b82f6', '#2563eb']} style={[styles.actionGradient, { width: responsive.iconSize.xxxlarge * 1.4, height: responsive.iconSize.xxxlarge * 1.4, borderRadius: 999, marginBottom: responsive.spacing.sm, justifyContent: 'center', alignItems: 'center' }]}> 
                  {actionLoading === 'history' ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="time-outline" size={responsive.iconSize.xlarge} color="#fff" />
                  )}
                </LinearGradient>
                <Text style={[styles.actionText, { fontSize: responsive.fontSize.small, marginTop: responsive.spacing.md }]}>Lịch sử</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => handleQuickAction('settings')}
                disabled={actionLoading === 'settings'}
              >
                <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={[styles.actionGradient, { width: responsive.iconSize.xxxlarge * 1.4, height: responsive.iconSize.xxxlarge * 1.4, borderRadius: 999, marginBottom: responsive.spacing.sm, justifyContent: 'center', alignItems: 'center' }]}> 
                  {actionLoading === 'settings' ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="settings-outline" size={responsive.iconSize.xlarge} color="#fff" />
                  )}
                </LinearGradient>
                <Text style={[styles.actionText, { fontSize: responsive.fontSize.small, marginTop: responsive.spacing.md }]}>Cài đặt</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Account List */}
          <View style={[styles.section, { paddingHorizontal: responsive.padding, marginBottom: responsive.spacing.xxxl }]}> 
            <View style={[styles.sectionHeader, { marginBottom: responsive.spacing.lg }]}> 
              <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.xxlarge, color: '#fff', fontWeight: 'bold' }]}>Tài khoản của bạn</Text>
              <TouchableOpacity 
                style={{ paddingRight: responsive.spacing.lg }}
                onPress={handleViewAllAccounts}
              >
                <Text style={[styles.viewAllText, { fontSize: responsive.fontSize.medium, color: '#a5b4fc', fontWeight: '600' }]}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            {accounts.length > 0 ? (
              accounts.map((account, index) => (
                <TouchableOpacity 
                  key={account.id || `account-${index}`} 
                  style={[styles.accountCard, { marginBottom: responsive.spacing.lg, borderRadius: responsive.cardRadius, backgroundColor: 'rgba(255,255,255,0.07)', shadowColor: '#6366f1', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4, width: '100%', padding: responsive.spacing.xl }]}
                  onPress={() => handleAccountTap(account)}
                  activeOpacity={0.7}
                > 
                  <View style={[styles.accountHeader, { marginBottom: responsive.spacing.lg }]}> 
                    <View style={[styles.accountIcon, { width: responsive.iconSize.xxxlarge, height: responsive.iconSize.xxxlarge, borderRadius: 999, marginRight: responsive.spacing.md, backgroundColor: 'rgba(99,102,241,0.15)', justifyContent: 'center', alignItems: 'center' }]}> 
                      <Ionicons name={account.accountType === 'SAVINGS' ? 'wallet' : 'card'} size={responsive.iconSize.medium} color="#6366f1" />
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={[styles.accountTitle, { fontSize: responsive.fontSize.large, color: '#fff', fontWeight: '600', marginBottom: 2 }]}>{account.accountType === 'SAVINGS' ? 'Tài khoản tiết kiệm' : account.accountType === 'CHECKING' ? 'Tài khoản vãng lai' : account.accountType}</Text>
                      <Text style={[styles.accountNumber, { fontSize: responsive.fontSize.medium, color: '#cbd5e1' }]}>{account.accountNumber.replace(/(\d{4})(?=\d)/g, '$1 ')}</Text>
                    </View>
                    {/* Account Status */}
                    {(() => {
                      const status = getAccountStatus(account);
                      return (
                        <View style={styles.accountStatus}>
                          <View style={[styles.statusDot, { width: responsive.spacing.xs * 2, height: responsive.spacing.xs * 2, borderRadius: responsive.spacing.xs, marginRight: responsive.spacing.xs, backgroundColor: status.color }]} />
                          <Text style={[styles.statusText, { fontSize: responsive.fontSize.medium, color: status.color, paddingRight: responsive.spacing.md, fontWeight: '600' }]}>{status.text}</Text>
                        </View>
                      );
                    })()}
                  </View>
                  <Text style={[styles.accountBalance, { fontSize: responsive.fontSize.xxlarge, color: '#fff', fontWeight: 'bold', marginTop: responsive.spacing.md, marginBottom: responsive.spacing.sm }]}>{formatCurrency(account.balance, 'USD')}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.emptyCard, { borderRadius: responsive.cardRadius, padding: responsive.spacing.xxxl, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed', alignItems: 'center', width: '100%' }]}> 
                <Ionicons name="wallet-outline" size={responsive.iconSize.xxxlarge * 1.2} color="rgba(255,255,255,0.5)" style={{ marginBottom: responsive.spacing.lg }} />
                <Text style={[styles.emptyText, { fontSize: responsive.fontSize.large, marginBottom: responsive.spacing.md, color: '#fff', fontWeight: '600' }]}>Chưa có tài khoản nào</Text>
                <Text style={[styles.emptySubtext, { fontSize: responsive.fontSize.medium, color: '#cbd5e1' }]}>Tạo tài khoản đầu tiên của bạn</Text>
              </View>
            )}
          </View>

          {/* Recent Transactions */}
          <View style={[styles.section, { paddingHorizontal: responsive.padding, marginBottom: responsive.spacing.xxxl }]}> 
            <View style={[styles.sectionHeader, { marginBottom: responsive.spacing.lg }]}> 
              <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.xxlarge, color: '#fff', fontWeight: 'bold' }]}>Giao dịch gần đây</Text>
              <TouchableOpacity 
                style={{ paddingRight: responsive.spacing.lg }}
                onPress={handleViewAllTransactions}
              >
                <Text style={[styles.viewAllText, { fontSize: responsive.fontSize.medium, color: '#a5b4fc', fontWeight: '600' }]}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.transactionsContainer, { borderRadius: responsive.cardRadius, padding: responsive.spacing.xl, backgroundColor: 'rgba(255,255,255,0.04)', width: '100%' }]}> 
              {transactions.length > 0 ? (
                transactions.map((transaction, index) => (
                  <TouchableOpacity 
                    key={transaction.id || `transaction-${index}`} 
                    style={[styles.transactionCard, { paddingVertical: responsive.spacing.lg, borderBottomWidth: index === transactions.length - 1 ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.08)', width: '100%' }]}
                    onPress={() => handleTransactionTap(transaction)}
                    activeOpacity={0.7}
                  > 
                    <View style={[styles.transactionIcon, { width: responsive.iconSize.xxxlarge, height: responsive.iconSize.xxxlarge, borderRadius: 999, marginRight: responsive.spacing.md, backgroundColor: 'rgba(99,102,241,0.12)', justifyContent: 'center', alignItems: 'center' }]}> 
                      <Ionicons name={getTransactionIcon(transaction.type, transaction.description)} size={responsive.iconSize.medium} color={getTransactionColor(transaction.type)} />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={[styles.transactionDescription, { fontSize: responsive.fontSize.large, color: '#fff', fontWeight: '500', marginBottom: 2 }]}>{transaction.description}</Text>
                      <Text style={[styles.transactionDate, { fontSize: responsive.fontSize.medium, color: '#cbd5e1' }]}>{formatDate(transaction.createdAt)}</Text>
                    </View>
                    <View style={styles.transactionAmount}>
                      <Text style={[styles.amountText, { fontSize: responsive.fontSize.large, color: getTransactionColor(transaction.type), fontWeight: 'bold' }]}>{transaction.type === 'CREDIT' ? '+' : '-'}{formatCurrency(transaction.amount, 'USD')}</Text>
                      <View style={[styles.statusBadge, { paddingHorizontal: responsive.spacing.md, paddingVertical: responsive.spacing.xs, borderRadius: responsive.spacing.md, backgroundColor: transaction.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)' }]}> 
                        <Text style={[styles.statusBadgeText, { fontSize: responsive.fontSize.medium, color: transaction.status === 'COMPLETED' ? '#10b981' : '#f59e0b', fontWeight: '600' }]}>{transaction.status === 'COMPLETED' ? 'Thành công' : transaction.status === 'PENDING' ? 'Đang xử lý' : transaction.status}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={[styles.emptyCard, { borderRadius: responsive.cardRadius, padding: responsive.spacing.xxxl, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed', alignItems: 'center', width: '100%' }]}> 
                  <Ionicons name="receipt-outline" size={responsive.iconSize.xxxlarge * 1.2} color="rgba(255,255,255,0.5)" style={{ marginBottom: responsive.spacing.lg }} />
                  <Text style={[styles.emptyText, { fontSize: responsive.fontSize.large, marginBottom: responsive.spacing.md, color: '#fff', fontWeight: '600' }]}>Chưa có giao dịch nào</Text>
                  <Text style={[styles.emptySubtext, { fontSize: responsive.fontSize.medium, color: '#cbd5e1' }]}>Thực hiện giao dịch đầu tiên</Text>
                </View>
              )}
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={[styles.bottomSpacing, { height: responsive.spacing.xl }]} />
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  userName: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    backgroundColor: '#ef4444',
  },
  logoutButton: {
    // padding handled dynamically
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    color: '#fca5a5',
    fontWeight: 'bold',
    marginTop: 16,
  },
  errorMessage: {
    color: '#fca5a5',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  balanceSection: {
    // padding handled dynamically
  },
  balanceCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  eyeButton: {
    // padding handled dynamically
  },
  balanceAmount: {
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  balanceSubtitle: {
    color: 'rgba(255,255,255,0.7)',
  },
  section: {
    // padding handled dynamically
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  viewAllText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    alignItems: 'center',
    width: '23%',
  },
  actionGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
  },
  accountCard: {
    overflow: 'hidden',
  },
  accountGradient: {
    // padding handled dynamically
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountTitle: {
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  accountNumber: {
    color: 'rgba(255,255,255,0.7)',
  },
  accountStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    // size handled dynamically
  },
  statusText: {
    fontWeight: '500',
  },
  accountBalance: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  transactionsContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  transactionIcon: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  transactionDate: {
    color: 'rgba(255,255,255,0.6)',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontWeight: '600',
    marginBottom: 4,
  },
  statusBadge: {
    // padding and borderRadius handled dynamically
  },
  statusBadgeText: {
    fontWeight: '500',
  },
  bottomSpacing: {
    // height handled dynamically
  },
}); 