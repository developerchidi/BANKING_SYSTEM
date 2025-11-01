import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  getAccounts, 
  transferMoney, 
  verifyTransferOtp,
  checkAccountNumber,
  handleApiError
} from '../../services/bankingService';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { convertCurrency } from '../../store/currencySlice';

const { width } = Dimensions.get('window');

function TransferScreen() {
  // Step: 0 - chọn loại & nhập thông tin, 1 - xác nhận, 2 - OTP, 3 - receipt
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]); // TODO: fetch nếu có API
  const [form, setForm] = useState({
    transferType: 'external',
    fromAccountId: '',
    toAccountId: '',
    toAccountNumber: '',
    toAccountName: '',
    amount: '',
    description: ''
  });
  const [checkingAccount, setCheckingAccount] = useState(false);
  const [accountCheckError, setAccountCheckError] = useState('');
  const [error, setError] = useState('');
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  const displayCurrency = useSelector((state: RootState) => state.currency.displayCurrency);
  const exchangeRates = useSelector((state: RootState) => state.currency.exchangeRates);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await getAccounts();
      const list = res.data?.accounts || res.accounts || [];
      setAccounts(list);
      if (list.length > 0) setForm(f => ({ ...f, fromAccountId: list[0].id }));
    } catch (e) {
      setError('Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  // Lấy tên chủ tài khoản đích (external)
  const handleCheckAccount = async () => {
    setCheckingAccount(true);
    setAccountCheckError('');
    setForm(f => ({ ...f, toAccountName: '' }));
    try {
      const res = await checkAccountNumber(form.toAccountNumber);
      if (res.data?.account?.accountName) {
        setForm(f => ({ ...f, toAccountName: res.data.account.accountName }));
        setAccountCheckError('');
      } else {
        setAccountCheckError('Không tìm thấy tài khoản đích');
      }
    } catch (e) {
      setAccountCheckError('Không tìm thấy tài khoản đích');
    } finally {
      setCheckingAccount(false);
    }
  };

  // Format số tiền
  const formatCurrency = (amount: number, fromCurrency: string = 'USD') => {
    const converted = convertCurrency(amount, fromCurrency, displayCurrency, exchangeRates);
    return new Intl.NumberFormat(
      displayCurrency === 'VND' ? 'vi-VN' : 'en-US',
      { style: 'currency', currency: displayCurrency }
    ).format(converted);
  };

  // Validate form
  const validateForm = () => {
    if (!form.fromAccountId || !form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setError('Vui lòng nhập đầy đủ thông tin và số tiền hợp lệ');
      return false;
    }
    if (form.transferType === 'external' && (!form.toAccountNumber || !form.toAccountName)) {
      setError('Vui lòng nhập và kiểm tra số tài khoản đích');
      return false;
    }
    if (form.transferType === 'internal' && !form.toAccountId) {
      setError('Vui lòng chọn tài khoản đích');
      return false;
    }
    // TODO: validate beneficiary nếu cần
    setError('');
    return true;
  };

  // Chuyển bước xác nhận
  const handleNext = () => {
    if (validateForm()) setStep(1);
  };

  // Thực hiện chuyển khoản
  // Khi gửi lên BE, luôn quy đổi amount về currency gốc của tài khoản nguồn
  const handleTransfer = async () => {
    setError('');
    setLoading(true);
    try {
      const fromAccount = accounts.find(a => a.id === form.fromAccountId);
      const fromCurrency = fromAccount?.currency || 'USD';
      // Quy đổi số tiền nhập (theo displayCurrency) về USD và làm tròn 2 chữ số thập phân
      const amountInDisplay = Number(form.amount);
      let amountInUSD = convertCurrency(amountInDisplay, displayCurrency, fromCurrency, exchangeRates);
      amountInUSD = Math.round(amountInUSD * 100) / 100;
      let transferData: any = {
        fromAccountId: form.fromAccountId,
        amount: amountInUSD, // Gửi số USD đã quy đổi
        description: form.description,
        transferType: form.transferType,
      };
      if (form.transferType === 'internal') {
        transferData.toAccountId = form.toAccountId;
      } else if (form.transferType === 'external') {
        transferData.toAccountNumber = form.toAccountNumber;
        transferData.toAccountName = form.toAccountName;
      }
      // TODO: beneficiary
      const res = await transferMoney(transferData);
      if (res.success && res.data?.transactionId && res.data?.requiresOtp) {
        setTransactionId(res.data.transactionId);
        setStep(2);
      } else if (res.success) {
        setReceipt(res.data?.receipt || res.data);
        setStep(3);
      } else {
        setError(res.message || 'Chuyển khoản thất bại');
      }
    } catch (e: any) {
      setError(handleApiError(e));
    } finally {
      setLoading(false);
    }
  };

  // Xác thực OTP
  const handleVerifyOtp = async () => {
    setVerifyingOtp(true);
    try {
      const res = await verifyTransferOtp({ transactionId, otpCode });
      if (res.success) {
        setReceipt(res.data?.receipt || res.data);
        setStep(3);
      } else {
        setError(res.message || 'Xác thực OTP thất bại');
      }
    } catch (e: any) {
      setError(handleApiError(e));
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setStep(0);
    setForm({
      transferType: 'external',
      fromAccountId: accounts[0]?.id || '',
      toAccountId: '',
      toAccountNumber: '',
      toAccountName: '',
      amount: '',
      description: ''
    });
    setReceipt(null);
    setOtpCode('');
    setTransactionId('');
    setError('');
  };

  // UI từng bước
  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chuyển khoản</Text>
          </View>

          {/* Step 0: Nhập thông tin */}
          {step === 0 && (
            <>
              {/* Chọn loại chuyển khoản */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Loại chuyển khoản</Text>
                <View style={styles.transferTypeContainer}>
                  {['internal', 'external'].map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.transferTypeButton, form.transferType === type && styles.transferTypeButtonActive]}
                      onPress={() => setForm(f => ({ ...f, transferType: type }))}
                    >
                      <Ionicons name={type === 'internal' ? 'swap-horizontal' : 'business'} size={18} color={form.transferType === type ? '#fff' : '#cbd5e1'} />
                      <Text style={[styles.transferTypeText, form.transferType === type && styles.transferTypeTextActive]}>
                        {type === 'internal' ? 'Nội bộ' : 'Ngân hàng khác'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Chọn tài khoản nguồn */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tài khoản nguồn</Text>
                <View style={styles.accountSelector}>
                  {accounts.map(acc => (
                    <TouchableOpacity
                      key={acc.id || acc.accountNumber}
                      style={[styles.accountOption, form.fromAccountId === acc.id && styles.accountOptionActive]}
                      onPress={() => setForm(f => ({ ...f, fromAccountId: acc.id }))}
                    >
                      <View style={styles.accountInfo}>
                        <Text style={styles.accountNumber}>{acc.accountNumber}</Text>
                        <Text style={styles.accountType}>{acc.accountType}</Text>
                      </View>
                      <Text style={styles.accountBalance}>{formatCurrency(acc.balance, acc.currency)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Chọn tài khoản đích hoặc nhập số tài khoản đích */}
              {form.transferType === 'internal' ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Tài khoản đích</Text>
                  <View style={styles.accountSelector}>
                    {accounts.filter(acc => acc.id !== form.fromAccountId).map(acc => (
                      <TouchableOpacity
                        key={acc.id || acc.accountNumber}
                        style={[styles.accountOption, form.toAccountId === acc.id && styles.accountOptionActive]}
                        onPress={() => setForm(f => ({ ...f, toAccountId: acc.id }))}
                      >
                        <View style={styles.accountInfo}>
                          <Text style={styles.accountNumber}>{acc.accountNumber}</Text>
                          <Text style={styles.accountType}>{acc.accountType}</Text>
                        </View>
                        <Text style={styles.accountBalance}>{formatCurrency(acc.balance, acc.currency)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Số tài khoản đích</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập số tài khoản đích"
                    placeholderTextColor="#888"
                    value={form.toAccountNumber}
                    onChangeText={text => setForm(f => ({ ...f, toAccountNumber: text }))}
                    keyboardType="number-pad"
                    onBlur={handleCheckAccount}
                  />
                  {/* Nếu tìm thấy tên chủ tài khoản thì hiện label + input readonly */}
                  {form.toAccountName ? (
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.sectionTitle}>Tên chủ tài khoản đích</Text>
                      <TextInput
                        style={[styles.input, { color: '#10b981', fontWeight: 'bold', backgroundColor: 'rgba(16,185,129,0.07)' }]}
                        value={form.toAccountName}
                        editable={false}
                        selectTextOnFocus={false}
                      />
                    </View>
                  ) : null}
                  {/* Nếu lỗi thì hiện lỗi đỏ */}
                  {accountCheckError ? (
                    <Text style={styles.errorText}>{accountCheckError}</Text>
                  ) : null}
                  {checkingAccount && <ActivityIndicator color="#fff" style={{ marginTop: 8 }} />}
                </View>
              )}

              {/* Nhập số tiền */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Số tiền</Text>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  placeholder="0"
                  placeholderTextColor="#888"
                  value={form.amount}
                  onChangeText={text => setForm(f => ({ ...f, amount: text }))}
                  keyboardType="numeric"
                />
                {form.amount ? (
                  <Text style={{ color: '#fff', marginTop: 4 }}>
                    Quy đổi: {formatCurrency(Number(form.amount), displayCurrency)}
                    {'  ≈  '}
                    {(() => {
                      const fromAccount = accounts.find(a => a.id === form.fromAccountId);
                      const fromCurrency = fromAccount?.currency || 'USD';
                      let amountInUSD = convertCurrency(Number(form.amount), displayCurrency, fromCurrency, exchangeRates);
                      amountInUSD = Math.round(amountInUSD * 100) / 100;
                      return `${amountInUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${fromCurrency}`;
                    })()}
                  </Text>
                ) : null}
              </View>

              {/* Nhập mô tả */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mô tả (tuỳ chọn)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Nhập mô tả giao dịch"
                  placeholderTextColor="#888"
                  value={form.description}
                  onChangeText={text => setForm(f => ({ ...f, description: text }))}
                  multiline
                />
              </View>

              {/* Hiển thị lỗi */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* Nút tiếp tục */}
              <TouchableOpacity style={styles.transferButton} onPress={handleNext} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Tiếp tục</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* Step 1: Xác nhận thông tin */}
          {step === 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Xác nhận thông tin chuyển khoản</Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <Text style={{ color: '#fff', marginBottom: 4 }}>Từ tài khoản: {accounts.find(a => a.id === form.fromAccountId)?.accountNumber}</Text>
                <Text style={{ color: '#fff', marginBottom: 4 }}>
                  Đến: {form.transferType === 'internal'
                    ? accounts.find(a => a.id === form.toAccountId)?.accountNumber
                    : `${form.toAccountNumber} (${form.toAccountName})`}
                </Text>
                <Text style={{ color: '#fff', marginBottom: 4 }}>Số tiền: {formatCurrency(Number(form.amount), accounts.find(a => a.id === form.fromAccountId)?.currency || 'USD')}</Text>
                {form.description ? <Text style={{ color: '#fff', marginBottom: 4 }}>Mô tả: {form.description}</Text> : null}
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={[styles.transferButton, { flex: 1, backgroundColor: '#64748b' }]} onPress={() => setStep(0)}>
                  <Text style={styles.buttonText}>Quay lại</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.transferButton, { flex: 1 }]} onPress={handleTransfer} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Xác nhận</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 2: Nhập OTP */}
          {step === 2 && (
            <Modal visible={true} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Xác thực OTP</Text>
                    <TouchableOpacity onPress={handleReset}>
                      <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.modalSubtitle}>Nhập mã OTP đã gửi về điện thoại/email của bạn để xác nhận giao dịch.</Text>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="Nhập mã OTP"
                    placeholderTextColor="#888"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.modalButton} onPress={handleReset}>
                      <Text style={styles.modalButtonText}>Huỷ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handleVerifyOtp} disabled={verifyingOtp}>
                      {verifyingOtp ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalButtonTextPrimary}>Xác nhận</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* Step 3: Biên nhận giao dịch */}
          {step === 3 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Biên nhận giao dịch</Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <Text style={{ color: '#fff', marginBottom: 4 }}>Từ tài khoản: {accounts.find(a => a.id === form.fromAccountId)?.accountNumber}</Text>
                <Text style={{ color: '#fff', marginBottom: 4 }}>
                  Đến: {form.transferType === 'internal'
                    ? accounts.find(a => a.id === form.toAccountId)?.accountNumber
                    : `${form.toAccountNumber} (${form.toAccountName})`}
                </Text>
                <Text style={{ color: '#fff', marginBottom: 4 }}>Số tiền: {formatCurrency(Number(form.amount), accounts.find(a => a.id === form.fromAccountId)?.currency || 'USD')}</Text>
                {form.description ? <Text style={{ color: '#fff', marginBottom: 4 }}>Mô tả: {form.description}</Text> : null}
                <Text style={{ color: '#10b981', marginTop: 8, fontWeight: 'bold' }}>Giao dịch thành công!</Text>
              </View>
              <TouchableOpacity style={styles.transferButton} onPress={handleReset}>
                <Text style={styles.buttonText}>Tạo giao dịch mới</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default TransferScreen;

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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  transferTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  transferTypeButton: {
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
  transferTypeButtonActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#6366f1',
  },
  transferTypeText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  transferTypeTextActive: {
    color: '#fff',
  },
  accountSelector: {
    gap: 8,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  amountInput: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: { color: 'red', marginTop: 4, marginBottom: 8, fontSize: 13 },
  selectBox: { backgroundColor: '#222', borderRadius: 8, padding: 12, marginBottom: 8 },
  transferButton: { backgroundColor: '#10b981', borderRadius: 12, padding: 16, marginTop: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
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
    width: width * 0.9,
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 24,
  },
  otpInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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