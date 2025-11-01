import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

function formatCurrency(amount: number) {
  const displayCurrency = useSelector((state: RootState) => state.currency.displayCurrency);
  return new Intl.NumberFormat(
    displayCurrency === 'VND' ? 'vi-VN' : 'en-US',
    { style: 'currency', currency: displayCurrency }
  ).format(amount);
}

function formatDate(dateValue: any) {
  if (!dateValue) return 'Không xác định';
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return 'Không xác định';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const TransferReceiptScreen = ({ route, navigation }: any) => {
  const { transaction, transferData, accounts } = route.params || {};

  // Lấy số tài khoản nguồn
  const fromAccountNumber =
    transaction.fromAccountNumber ||
    transaction.senderAccountNumber ||
    (accounts && accounts.find(acc => acc.id === (transaction.fromAccountId || transferData?.fromAccountId))?.accountNumber) ||
    transferData?.fromAccountNumber ||
    '';

  // Lấy số tài khoản đích
  const toAccountNumber =
    transaction.toAccountNumber ||
    transaction.receiverAccountNumber ||
    transferData?.toAccountNumber ||
    '';

  const fromAccount = accounts?.find(acc => acc.id === (transaction.fromAccountId || transferData?.fromAccountId));
  const fromAccountName = fromAccount?.accountName || transferData?.fromAccountName || '';
  const toAccountName = transaction.toAccountName || transferData?.toAccountName || '';

  if (!transaction) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Không tìm thấy thông tin giao dịch.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.receiptBox}>
        <View style={styles.iconWrapper}>
          <Ionicons name="checkmark-circle" size={72} color="#10b981" />
        </View>
        <Text style={styles.title}>Chuyển khoản thành công</Text>
        <View style={styles.row}><Text style={styles.label}>Số giao dịch</Text><Text style={styles.value}>{transaction.transactionNumber || transaction.id}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Số tiền</Text><Text style={[styles.value, styles.amountValue]}>{formatCurrency(transaction.amount)}</Text></View>
        <View style={styles.row}>
          <Text style={styles.label}>Tài khoản nguồn</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.value}>{fromAccountNumber}</Text>
            {fromAccountName ? <Text style={styles.subValue}>{fromAccountName}</Text> : null}
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tài khoản đích</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.value}>{toAccountNumber}</Text>
            {toAccountName ? <Text style={styles.subValue}>{toAccountName}</Text> : null}
          </View>
        </View>
        <View style={styles.row}><Text style={styles.label}>Thời gian</Text><Text style={styles.value}>{formatDate(transaction.createdAt)}</Text></View>
        {transaction.description && <View style={styles.row}><Text style={styles.label}>Nội dung</Text><Text style={styles.value}>{transaction.description}</Text></View>}
        <View style={styles.row}><Text style={styles.label}>Trạng thái</Text><Text style={[styles.value, styles.statusValue]}>{transaction.status || 'Thành công'}</Text></View>
      </View>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.popToTop()}>
        <Ionicons name="home-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.backButtonText}>Về trang chủ</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  receiptBox: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 32,
    marginTop: 32,
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 24,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '500',
    flex: 1.2,
  },
  value: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
    flex: 2,
  },
  amountValue: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 18,
  },
  statusValue: {
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 8,
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
  },
  subValue: {
    color: '#cbd5e1',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
  },
});

export default TransferReceiptScreen; 