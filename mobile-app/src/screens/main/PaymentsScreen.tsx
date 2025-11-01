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
  StatusBar,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  getAccounts, 
  handleApiError 
} from '../../services/bankingService';
import { useCurrency } from '../../context/CurrencyContext';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const { width } = Dimensions.get('window');

interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string;
}

interface Bill {
  id: string;
  billNumber: string;
  billType: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  description: string;
  provider: string;
  currency: string;
}

interface PaymentData {
  fromAccountId: string;
  billId?: string;
  billType: string;
  amount: number;
  description: string;
  provider: string;
  billNumber?: string;
}

export default function PaymentsScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    fromAccountId: '',
    billType: 'ELECTRICITY',
    amount: 0,
    description: '',
    provider: ''
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const { displayCurrency } = useCurrency();
  const displayCurrencyRedux = useSelector((state: RootState) => state.currency.displayCurrency);

  // Mock bills data
  const mockBills: Bill[] = [
    {
      id: '1',
      billNumber: 'EVN001234567',
      billType: 'ELECTRICITY',
      amount: 450000,
      dueDate: '2024-01-15',
      status: 'PENDING',
      description: 'Hóa đơn tiền điện tháng 12/2024',
      provider: 'EVN',
      currency: 'VND'
    },
    {
      id: '2',
      billNumber: 'SAV001234567',
      billType: 'WATER',
      amount: 120000,
      dueDate: '2024-01-20',
      status: 'PENDING',
      description: 'Hóa đơn tiền nước tháng 12/2024',
      provider: 'SAVACO',
      currency: 'VND'
    },
    {
      id: '3',
      billNumber: 'VNPT001234567',
      billType: 'INTERNET',
      amount: 350000,
      dueDate: '2024-01-10',
      status: 'OVERDUE',
      description: 'Hóa đơn internet tháng 12/2024',
      provider: 'VNPT',
      currency: 'VND'
    },
    {
      id: '4',
      billNumber: 'MOB001234567',
      billType: 'MOBILE',
      amount: 150000,
      dueDate: '2024-01-25',
      status: 'PENDING',
      description: 'Hóa đơn điện thoại tháng 12/2024',
      provider: 'Viettel',
      currency: 'VND'
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load accounts
      const accountsResponse = await getAccounts();
      const accountsList = accountsResponse.data?.accounts || accountsResponse || [];
      setAccounts(accountsList.filter((acc: Account) => acc.status === 'ACTIVE'));
      
      // Set first account as default
      if (accountsList.length > 0) {
        setPaymentData(prev => ({
          ...prev,
          fromAccountId: accountsList[0].id
        }));
      }
      
      // Set mock bills
      setBills(mockBills);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Lỗi', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleBillPress = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentData({
      fromAccountId: paymentData.fromAccountId,
      billId: bill.id,
      billType: bill.billType,
      amount: bill.amount,
      description: bill.description,
      provider: bill.provider,
      billNumber: bill.billNumber
    });
    setShowPaymentModal(true);
  };

  const handleQuickPayment = (billType: string) => {
    setPaymentData(prev => ({
      ...prev,
      billType,
      amount: 0,
      description: '',
      provider: ''
    }));
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!validatePaymentForm()) return;

    try {
      setPaymentLoading(true);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update bill status
      if (selectedBill) {
        setBills(prev => prev.map(bill => 
          bill.id === selectedBill.id 
            ? { ...bill, status: 'PAID' as const }
            : bill
        ));
      }
      
      setShowPaymentModal(false);
      setSelectedBill(null);
      setPaymentData({
        fromAccountId: paymentData.fromAccountId,
        billType: 'ELECTRICITY',
        amount: 0,
        description: '',
        provider: ''
      });
      setErrors({});
      
      Alert.alert('Thành công', 'Thanh toán hóa đơn thành công');
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Lỗi', 'Thanh toán thất bại. Vui lòng thử lại.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const validatePaymentForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!paymentData.fromAccountId) {
      newErrors.fromAccountId = 'Vui lòng chọn tài khoản thanh toán';
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      newErrors.amount = 'Vui lòng nhập số tiền hợp lệ';
    }

    if (!paymentData.description.trim()) {
      newErrors.description = 'Vui lòng nhập mô tả thanh toán';
    }

    if (!paymentData.provider.trim()) {
      newErrors.provider = 'Vui lòng nhập nhà cung cấp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(
      displayCurrencyRedux === 'VND' ? 'vi-VN' : 'en-US',
      { style: 'currency', currency: displayCurrencyRedux }
    ).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getBillTypeText = (type: string) => {
    switch (type) {
      case 'ELECTRICITY': return 'Tiền điện';
      case 'WATER': return 'Tiền nước';
      case 'INTERNET': return 'Internet';
      case 'MOBILE': return 'Điện thoại';
      case 'CABLE': return 'Truyền hình';
      default: return type;
    }
  };

  const getBillTypeIcon = (type: string) => {
    switch (type) {
      case 'ELECTRICITY': return 'flash';
      case 'WATER': return 'water';
      case 'INTERNET': return 'wifi';
      case 'MOBILE': return 'phone-portrait';
      case 'CABLE': return 'tv';
      default: return 'receipt';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'PAID': return '#10b981';
      case 'OVERDUE': return '#ef4444';
      default: return '#cbd5e1';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chưa thanh toán';
      case 'PAID': return 'Đã thanh toán';
      case 'OVERDUE': return 'Quá hạn';
      default: return status;
    }
  };

  const getProviderIcon = (provider: string) => {
    const providerLower = provider.toLowerCase();
    if (providerLower.includes('evn')) return 'flash';
    if (providerLower.includes('savaco') || providerLower.includes('water')) return 'water';
    if (providerLower.includes('vnpt')) return 'wifi';
    if (providerLower.includes('viettel')) return 'phone-portrait';
    if (providerLower.includes('mobifone')) return 'phone-portrait';
    if (providerLower.includes('vinaphone')) return 'phone-portrait';
    return 'business';
  };

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

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh toán</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Quick Payment Options */}
        <View style={styles.quickPaymentSection}>
          <Text style={styles.sectionTitle}>Thanh toán nhanh</Text>
          <View style={styles.quickPaymentGrid}>
            {[
              { type: 'ELECTRICITY', icon: 'flash', label: 'Tiền điện' },
              { type: 'WATER', icon: 'water', label: 'Tiền nước' },
              { type: 'INTERNET', icon: 'wifi', label: 'Internet' },
              { type: 'MOBILE', icon: 'phone-portrait', label: 'Điện thoại' }
            ].map((item, index) => (
              <TouchableOpacity
                key={item.type}
                style={styles.quickPaymentItem}
                onPress={() => handleQuickPayment(item.type)}
              >
                <View style={styles.quickPaymentIcon}>
                  <Ionicons name={item.icon as any} size={24} color="#6366f1" />
                </View>
                <Text style={styles.quickPaymentLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bills List */}
        <View style={styles.billsSection}>
          <Text style={styles.sectionTitle}>Hóa đơn chờ thanh toán</Text>
          <ScrollView
            style={styles.billsList}
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
            {bills.length > 0 ? (
              bills.map((bill, index) => (
                <TouchableOpacity
                  key={bill.id}
                  style={styles.billCard}
                  onPress={() => handleBillPress(bill)}
                  activeOpacity={0.7}
                >
                  <View style={styles.billHeader}>
                    <View style={styles.billIcon}>
                      <Ionicons 
                        name={getBillTypeIcon(bill.billType)} 
                        size={24} 
                        color="#6366f1" 
                      />
                    </View>
                    <View style={styles.billInfo}>
                      <Text style={styles.billDescription}>{bill.description}</Text>
                      <Text style={styles.billNumber}>{bill.billNumber}</Text>
                      <Text style={styles.billProvider}>{bill.provider}</Text>
                    </View>
                    <View style={styles.billStatus}>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(bill.status)}20` }
                      ]}>
                        <Text style={[
                          styles.statusBadgeText,
                          { color: getStatusColor(bill.status) }
                        ]}>
                          {getStatusText(bill.status)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.billDetails}>
                    <View style={styles.billAmount}>
                      <Text style={styles.amountLabel}>Số tiền</Text>
                      <Text style={styles.amountValue}>
                        {formatCurrency(bill.amount)}
                      </Text>
                    </View>
                    <View style={styles.billDueDate}>
                      <Text style={styles.dueDateLabel}>Hạn thanh toán</Text>
                      <Text style={[
                        styles.dueDateValue,
                        { color: bill.status === 'OVERDUE' ? '#ef4444' : '#cbd5e1' }
                      ]}>
                        {formatDate(bill.dueDate)}
                      </Text>
                    </View>
                  </View>

                  {bill.status !== 'PAID' && (
                    <TouchableOpacity
                      style={styles.payButton}
                      onPress={() => handleBillPress(bill)}
                    >
                      <LinearGradient
                        colors={['#10b981', '#059669']}
                        style={styles.payButtonGradient}
                      >
                        <Ionicons name="card" size={16} color="#fff" />
                        <Text style={styles.payButtonText}>Thanh toán ngay</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={64} color="rgba(255,255,255,0.5)" />
                <Text style={styles.emptyTitle}>Không có hóa đơn nào</Text>
                <Text style={styles.emptySubtitle}>
                  Bạn không có hóa đơn nào cần thanh toán
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Payment Modal */}
        <Modal
          visible={showPaymentModal}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedBill ? 'Thanh toán hóa đơn' : 'Thanh toán mới'}
                </Text>
                <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.paymentForm}>
                {/* From Account */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Tài khoản thanh toán</Text>
                  <View style={styles.accountSelector}>
                    {accounts.map(account => (
                      <TouchableOpacity
                        key={account.id}
                        style={[
                          styles.accountOption,
                          paymentData.fromAccountId === account.id && styles.accountOptionActive
                        ]}
                        onPress={() => setPaymentData(prev => ({ ...prev, fromAccountId: account.id }))}
                      >
                        <View style={styles.accountInfo}>
                          <Text style={styles.accountNumber}>{account.accountNumber}</Text>
                          <Text style={styles.accountType}>
                            {account.accountType === 'SAVINGS' ? 'Tiết kiệm' : 'Vãng lai'}
                          </Text>
                        </View>
                        <Text style={styles.accountBalance}>
                          {formatCurrency(account.balance)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {errors.fromAccountId && <Text style={styles.errorText}>{errors.fromAccountId}</Text>}
                </View>

                {/* Bill Type */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Loại hóa đơn</Text>
                  <View style={styles.billTypeSelector}>
                    {['ELECTRICITY', 'WATER', 'INTERNET', 'MOBILE', 'CABLE'].map(type => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.billTypeOption,
                          paymentData.billType === type && styles.billTypeOptionActive
                        ]}
                        onPress={() => setPaymentData(prev => ({ ...prev, billType: type }))}
                      >
                        <Ionicons 
                          name={getBillTypeIcon(type)} 
                          size={16} 
                          color={paymentData.billType === type ? '#fff' : '#cbd5e1'} 
                        />
                        <Text style={[
                          styles.billTypeOptionText,
                          paymentData.billType === type && styles.billTypeOptionTextActive
                        ]}>
                          {getBillTypeText(type)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Provider */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Nhà cung cấp</Text>
                  <TextInput
                    style={[styles.formInput, errors.provider && styles.formInputError]}
                    placeholder="Nhập tên nhà cung cấp"
                    placeholderTextColor="#64748b"
                    value={paymentData.provider}
                    onChangeText={(text) => setPaymentData(prev => ({ ...prev, provider: text }))}
                  />
                  {errors.provider && <Text style={styles.errorText}>{errors.provider}</Text>}
                </View>

                {/* Bill Number */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Mã hóa đơn</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Nhập mã hóa đơn (tùy chọn)"
                    placeholderTextColor="#64748b"
                    value={paymentData.billNumber}
                    onChangeText={(text) => setPaymentData(prev => ({ ...prev, billNumber: text }))}
                  />
                </View>

                {/* Amount */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Số tiền</Text>
                  <TextInput
                    style={[styles.formInput, styles.amountInput, errors.amount && styles.formInputError]}
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    value={paymentData.amount > 0 ? paymentData.amount.toString() : ''}
                    onChangeText={(text) => {
                      const amount = parseFloat(text.replace(/[^0-9]/g, '')) || 0;
                      setPaymentData(prev => ({ ...prev, amount }));
                    }}
                    keyboardType="numeric"
                  />
                  {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
                </View>

                {/* Description */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Mô tả</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea, errors.description && styles.formInputError]}
                    placeholder="Nhập mô tả thanh toán"
                    placeholderTextColor="#64748b"
                    value={paymentData.description}
                    onChangeText={(text) => setPaymentData(prev => ({ ...prev, description: text }))}
                    multiline
                    numberOfLines={3}
                  />
                  {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowPaymentModal(false)}
                >
                  <Text style={styles.modalButtonText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handlePayment}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonTextPrimary}>Thanh toán</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  placeholder: {
    width: 40,
  },
  quickPaymentSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  quickPaymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickPaymentItem: {
    width: (width - 64) / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quickPaymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99,102,241,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickPaymentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  billsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  billsList: {
    flex: 1,
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
  billCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  billIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99,102,241,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  billInfo: {
    flex: 1,
  },
  billDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  billNumber: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 2,
  },
  billProvider: {
    fontSize: 12,
    color: '#64748b',
  },
  billStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  billDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  billAmount: {
    alignItems: 'flex-start',
  },
  amountLabel: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  billDueDate: {
    alignItems: 'flex-end',
  },
  dueDateLabel: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  dueDateValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  payButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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
    paddingHorizontal: 32,
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
  paymentForm: {
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
  accountSelector: {
    gap: 8,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  accountOptionActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
    borderColor: '#4f46e5',
  },
  accountInfo: {
    flex: 1,
  },
  accountNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  accountBalance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  billTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  billTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 6,
  },
  billTypeOptionActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#6366f1',
  },
  billTypeOptionText: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  billTypeOptionTextActive: {
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
  amountInput: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
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