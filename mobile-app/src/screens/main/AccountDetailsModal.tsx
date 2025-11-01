import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCurrency } from '../../context/CurrencyContext';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  accountName?: string;
  balance: number;
  currency: string;
  isActive: boolean;
  isFrozen: boolean;
  dailyLimit?: number;
  monthlyLimit?: number;
  interestRate?: number;
  createdAt: string;
}

interface AccountDetailsModalProps {
  visible: boolean;
  account: Account | null;
  onClose: () => void;
  onStatusChange: () => void;
  updateAccountFreeze: (accountId: string, freeze: boolean, reason?: string) => Promise<any>;
}

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

const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  visible,
  account,
  onClose,
  onStatusChange,
  updateAccountFreeze,
}) => {
  const [statusLoading, setStatusLoading] = useState(false);
  const displayCurrency = useSelector((state: RootState) => state.currency.displayCurrency);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(
      displayCurrency === 'VND' ? 'vi-VN' : 'en-US',
      { style: 'currency', currency: displayCurrency }
    ).format(amount);
  };

  if (!visible || !account) return null;

  const status = mapStatusFromFlags(account.isActive, account.isFrozen);

  return (
    <View style={styles.overlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Chi tiết tài khoản</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.accountDetails} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Số tài khoản</Text>
            <Text style={styles.detailValue}>{account.accountNumber}</Text>
          </View>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Tên tài khoản</Text>
            <Text style={styles.detailValue}>{account.accountName}</Text>
          </View>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Loại tài khoản</Text>
            <Text style={styles.detailValue}>{account.accountType}</Text>
          </View>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Số dư hiện tại</Text>
            <Text style={[styles.detailValue, styles.balanceValue]}>{formatCurrency(account.balance)}</Text>
          </View>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Trạng thái</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
              <Text style={[styles.detailValue, { color: getStatusColor(status) }]}>{getStatusText(status)}</Text>
            </View>
          </View>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Ngày tạo</Text>
            <Text style={styles.detailValue}>{formatDate(account.createdAt)}</Text>
          </View>
          {account.dailyLimit && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Hạn mức ngày</Text>
              <Text style={styles.detailValue}>{formatCurrency(account.dailyLimit)}</Text>
            </View>
          )}
          {account.monthlyLimit && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Hạn mức tháng</Text>
              <Text style={styles.detailValue}>{formatCurrency(account.monthlyLimit)}</Text>
            </View>
          )}
          {account.interestRate && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Lãi suất</Text>
              <Text style={styles.detailValue}>{account.interestRate}% / năm</Text>
            </View>
          )}
          {(status === 'ACTIVE' || status === 'FROZEN') && (
            <TouchableOpacity
              style={[
                styles.statusActionButton,
                status === 'ACTIVE' ? { backgroundColor: '#f59e0b' } : { backgroundColor: '#10b981' },
                statusLoading && { opacity: 0.7 },
              ]}
              activeOpacity={0.8}
              disabled={statusLoading}
              onPress={() => {
                const freeze = status === 'ACTIVE';
                Alert.alert(
                  freeze ? 'Tạm khóa tài khoản' : 'Kích hoạt lại tài khoản',
                  freeze ? 'Bạn có chắc chắn muốn tạm khóa tài khoản này?' : 'Bạn có chắc chắn muốn kích hoạt lại tài khoản này?',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    {
                      text: freeze ? 'Tạm khóa' : 'Kích hoạt lại',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          setStatusLoading(true);
                          await updateAccountFreeze(account.id, freeze);
                          Alert.alert('Thành công', freeze ? 'Tài khoản đã tạm khóa' : 'Tài khoản đã kích hoạt lại');
                          onStatusChange();
                          onClose();
                        } catch (error) {
                          Alert.alert('Lỗi', 'Không thể cập nhật trạng thái tài khoản');
                        } finally {
                          setStatusLoading(false);
                        }
                      },
                    },
                  ]
                );
              }}
            >
              {statusLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons
                    name={status === 'ACTIVE' ? 'lock-closed-outline' : 'checkmark-circle-outline'}
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.statusActionButtonText}>
                    {status === 'ACTIVE' ? 'Tạm khóa tài khoản' : 'Kích hoạt lại tài khoản'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
        <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={onClose}>
          <Text style={styles.modalButtonTextPrimary}>Đóng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
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
  accountDetails: {
    marginBottom: 16,
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
    fontWeight: '500',
    color: '#fff',
  },
  balanceValue: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
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
  modalButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonPrimary: {
    backgroundColor: '#4f46e5',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default AccountDetailsModal; 