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
  RefreshControl,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  getAccounts, 
  createAccount,
  getAccountDetails,
  handleApiError 
} from '../../services/bankingService';
import axios from 'axios';
import AccountDetailsModal from './AccountDetailsModal';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { convertCurrency } from '../../store/currencySlice';

interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  accountName?: string;
  balance: number;
  currency: string;
  status: string;
  dailyLimit?: number;
  monthlyLimit?: number;
  interestRate?: number;
  createdAt: string;
}

interface CreateAccountData {
  accountType: string;
  accountName: string;
  currency: string;
  dailyLimit?: number;
  monthlyLimit?: number;
  interestRate?: number;
}

async function updateAccountFreeze(accountId: string, freeze: boolean, reason?: string) {
  const response = await axios.post(`/banking/accounts/${accountId}/freeze`, { freeze, reason });
  return response.data;
}

const AccountsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [createData, setCreateData] = useState<CreateAccountData>({
    accountType: 'SAVINGS',
    accountName: '',
    currency: 'VND'
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [statusLoading, setStatusLoading] = useState(false);

  const displayCurrency = useSelector((state: RootState) => state.currency.displayCurrency);
  const exchangeRates = useSelector((state: RootState) => state.currency.exchangeRates);
  const formatCurrency = (amount: number, fromCurrency: string = 'USD') => {
    const converted = convertCurrency(amount, fromCurrency, displayCurrency, exchangeRates);
    return new Intl.NumberFormat(
      displayCurrency === 'VND' ? 'vi-VN' : 'en-US',
      { style: 'currency', currency: displayCurrency }
    ).format(converted);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await getAccounts();
      const accountsList = response.data?.accounts || response || [];
      setAccounts(accountsList);
    } catch (error) {
      console.error('Error loading accounts:', error);
      Alert.alert('Lỗi', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAccounts();
    setRefreshing(false);
  };

  const handleCreateAccount = async () => {
    if (!validateCreateForm()) return;

    try {
      setCreateLoading(true);
      await createAccount(createData);
      
      setShowCreateModal(false);
      setCreateData({
        accountType: 'SAVINGS',
        accountName: '',
        currency: 'VND'
      });
      setErrors({});
      
      Alert.alert('Thành công', 'Tài khoản đã được tạo thành công');
      loadAccounts();
    } catch (error) {
      console.error('Error creating account:', error);
      Alert.alert('Lỗi', handleApiError(error));
    } finally {
      setCreateLoading(false);
    }
  };

  const validateCreateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!createData.accountName.trim()) {
      newErrors.accountName = 'Vui lòng nhập tên tài khoản';
    }

    if (createData.accountName.length > 100) {
      newErrors.accountName = 'Tên tài khoản không được vượt quá 100 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAccountPress = async (account: Account) => {
    try {
      setSelectedAccount(account);
      setShowAccountModal(true);
    } catch (error) {
      console.error('Error loading account details:', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết tài khoản');
    }
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'Không xác định';
    let date;
    if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'string' && /^\d+$/.test(dateValue)) {
      // Nếu là chuỗi số (timestamp dạng string)
      date = new Date(Number(dateValue));
    } else {
      date = new Date(dateValue);
    }
    if (isNaN(date.getTime())) return 'Không xác định';
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getAccountTypeText = (type: string) => {
    switch (type) {
      case 'SAVINGS': return 'Tài khoản tiết kiệm';
      case 'CHECKING': return 'Tài khoản vãng lai';
      case 'FIXED_DEPOSIT': return 'Tài khoản tiết kiệm có kỳ hạn';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#10b981';
      case 'FROZEN': return '#f59e0b';
      case 'CLOSED': return '#ef4444';
      default: return '#cbd5e1';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Hoạt động';
      case 'FROZEN': return 'Tạm khóa';
      case 'CLOSED': return 'Đã đóng';
      default: return status;
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Đang tải tài khoản...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  console.log('exchangeRates in Accounts:', exchangeRates, 'displayCurrency:', displayCurrency);

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tài khoản</Text>
          <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['#4f46e5', '#6366f1', '#8b5cf6']}
            style={styles.summaryGradient}
          >
            <Text style={styles.summaryTitle}>Tổng quan tài khoản</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatNumber}>{accounts.length}</Text>
                <Text style={styles.summaryStatLabel}>Tài khoản</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatNumber}>
                  {formatCurrency(accounts.reduce((sum, acc) => sum + acc.balance, 0), 'USD')}
                </Text>
                <Text style={styles.summaryStatLabel}>Tổng số dư</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Accounts List */}
        <ScrollView
          style={styles.content}
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
          {accounts.length > 0 ? (
            accounts.map((account, index) => (
              <TouchableOpacity
                key={account.id || account.accountNumber || index}
                style={styles.accountCard}
                onPress={() => handleAccountPress(account)}
                activeOpacity={0.7}
              >
                <View style={styles.accountHeader}>
                  <View style={styles.accountIcon}>
                    <Ionicons 
                      name={account.accountType === 'SAVINGS' ? 'wallet' : 'card'} 
                      size={24} 
                      color="#6366f1" 
                    />
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>
                      {account.accountName || getAccountTypeText(account.accountType)}
                    </Text>
                    <Text style={styles.accountNumber}>{account.accountNumber}</Text>
                    <Text style={styles.accountType}>
                      {getAccountTypeText(account.accountType)}
                    </Text>
                  </View>
                  <View style={styles.accountStatus}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(account.status) }
                    ]} />
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(account.status) }
                    ]}>
                      {getStatusText(account.status)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.accountBalance}>
                  <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
                  <Text style={styles.balanceAmount}>
                    {formatCurrency(account.balance, 'USD')}
                  </Text>
                </View>

                <View style={styles.accountFooter}>
                  <Text style={styles.accountDate}>
                    Tạo ngày: {formatDate(account.createdAt)}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#64748b" />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={64} color="rgba(255,255,255,0.5)" />
              <Text style={styles.emptyTitle}>Chưa có tài khoản nào</Text>
              <Text style={styles.emptySubtitle}>
                Tạo tài khoản đầu tiên để bắt đầu sử dụng dịch vụ
              </Text>
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.createFirstButtonText}>Tạo tài khoản đầu tiên</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Create Account Modal */}
        <Modal
          visible={showCreateModal}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tạo tài khoản mới</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Loại tài khoản</Text>
                <View style={styles.accountTypeSelector}>
                  {['SAVINGS', 'CHECKING'].map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.accountTypeOption,
                        createData.accountType === type && styles.accountTypeOptionActive
                      ]}
                      onPress={() => setCreateData(prev => ({ ...prev, accountType: type }))}
                    >
                      <Ionicons 
                        name={type === 'SAVINGS' ? 'wallet' : 'card'} 
                        size={20} 
                        color={createData.accountType === type ? '#fff' : '#cbd5e1'} 
                      />
                      <Text style={[
                        styles.accountTypeOptionText,
                        createData.accountType === type && styles.accountTypeOptionTextActive
                      ]}>
                        {getAccountTypeText(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Tên tài khoản</Text>
                <TextInput
                  style={[styles.formInput, errors.accountName && styles.formInputError]}
                  placeholder="Nhập tên tài khoản"
                  placeholderTextColor="#64748b"
                  value={createData.accountName}
                  onChangeText={(text) => setCreateData(prev => ({ ...prev, accountName: text }))}
                />
                {errors.accountName && <Text style={styles.errorText}>{errors.accountName}</Text>}
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Loại tiền tệ</Text>
                <View style={styles.currencySelector}>
                  {['VND', 'USD', 'EUR'].map(currency => (
                    <TouchableOpacity
                      key={currency}
                      style={[
                        styles.currencyOption,
                        createData.currency === currency && styles.currencyOptionActive
                      ]}
                      onPress={() => setCreateData(prev => ({ ...prev, currency }))}
                    >
                      <Text style={[
                        styles.currencyOptionText,
                        createData.currency === currency && styles.currencyOptionTextActive
                      ]}>
                        {currency}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.modalButtonText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleCreateAccount}
                  disabled={createLoading}
                >
                  {createLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonTextPrimary}>Tạo tài khoản</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Account Details Modal */}
        <AccountDetailsModal
          visible={showAccountModal}
          account={selectedAccount}
          onClose={() => setShowAccountModal(false)}
          onStatusChange={loadAccounts}
          updateAccountFreeze={updateAccountFreeze}
        />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    padding: 8,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
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
  accountCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99,102,241,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 16,
    color: '#cbd5e1',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 14,
    color: '#64748b',
  },
  accountStatus: {
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
    fontSize: 12,
    fontWeight: '600',
  },
  accountBalance: {
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  accountFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountDate: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  createFirstButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
    width: '95%',
    maxWidth: 420,
    maxHeight: '95%',
    minHeight: 320,
    alignSelf: 'center',
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
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 8,
  },
  accountTypeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  accountTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  accountTypeOptionActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#6366f1',
  },
  accountTypeOptionText: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  accountTypeOptionTextActive: {
    color: '#fff',
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
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  currencySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  currencyOptionActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#6366f1',
  },
  currencyOptionText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  currencyOptionTextActive: {
    color: '#fff',
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
  accountDetails: {
    maxHeight: 400,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  statusActionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
}); 

export default AccountsScreen; 