import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Eye, RefreshCw, AlertCircle, CreditCard, DollarSign, User as UserIcon, Building2, Shield } from 'lucide-react';
import { apiService } from '../services/api';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import type { User, Account } from '../types';

const Deposit: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [depositing, setDepositing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.getUsers(1, 100, searchTerm);
      setUsers(result.users);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleUserSelect = async (user: User) => {
    setSelectedUser(user);
    setSelectedAccount(null);
    
    // Load user accounts
    try {
      const accounts = await apiService.getUserAccounts(user.id);
      if (accounts.length > 0) {
        setSelectedAccount(accounts[0]); // Select first account
      }
    } catch (err) {
      console.error('Failed to load user accounts:', err);
    }
  };

  const handleDeposit = async () => {
    if (!selectedUser || !selectedAccount || !depositAmount) {
      setError('Vui lòng chọn người dùng, tài khoản và nhập số tiền');
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Số tiền không hợp lệ');
      return;
    }

    try {
      setDepositing(true);
      setError(null);

      const result = await apiService.adminTopUp({
        accountId: selectedAccount.id,
        amount,
        currency: 'VND',
        reason: depositDescription || 'Admin top-up',
        idempotencyKey: `admin-topup-${selectedAccount.id}-${Date.now()}`,
      });

      if (result.success) {
        // Reset form
        setDepositAmount('');
        setDepositDescription('');
        setSelectedUser(null);
        setSelectedAccount(null);
        
        // Reload users to update balances
        await loadUsers();
        setToastMsg(`Nạp ${formatCurrency(amount)} (Nguồn: Hệ thống) cho ${selectedUser.firstName} ${selectedUser.lastName} thành công`);
        setShowToast(true);
      } else {
        setError(result.message || 'Nạp tiền thất bại');
      }
    } catch (err) {
      console.error('Deposit failed:', err);
      setError('Nạp tiền thất bại');
    } finally {
      setDepositing(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-8xl mx-auto space-y-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !depositing) {
    return (
      <div className="p-6">
        <div className="max-w-8xl mx-auto space-y-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Lỗi tải dữ liệu</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={loadUsers}
              className="mt-4 inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-8xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Nạp Tiền Admin
            </h1>
            <p className="text-gray-600 text-lg">Nạp tiền vào tài khoản người dùng</p>
          </div>
          <button
            onClick={loadUsers}
            className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 text-sm font-medium rounded-xl text-gray-700 hover:bg-white hover:border-gray-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </button>
        </div>

        {/* Current Admin Info */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 animate-fade-in">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Admin Thực Hiện</h3>
              <p className="text-gray-600">
                <strong>Tên:</strong> {currentAdmin?.firstName} {currentAdmin?.lastName}
              </p>
              <p className="text-gray-600">
                <strong>Email:</strong> {currentAdmin?.email}
              </p>
              <p className="text-sm text-purple-600 font-medium">
                Tài khoản hệ thống sẽ được sử dụng làm người gửi
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Selection */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <UserIcon className="w-5 h-5 mr-2 text-purple-600" />
              Chọn Người Dùng
            </h2>
            
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm người dùng..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedUser?.id === user.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">ID: {user.id}</div>
                      <div className={`inline-flex items-center justify-center text-xs px-2 py-1 rounded-full align-middle ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deposit Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Thông Tin Nạp Tiền
            </h2>

            {selectedUser ? (
              <div className="space-y-4">
                {/* Selected User Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Người dùng đã chọn:</h3>
                  <div className="text-sm text-purple-800">
                    <div><strong>Tên:</strong> {selectedUser.firstName} {selectedUser.lastName}</div>
                    <div><strong>Email:</strong> {selectedUser.email}</div>
                    <div><strong>ID:</strong> {selectedUser.id}</div>
                  </div>
                </div>

                {/* Account Selection */}
                {selectedAccount && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-medium text-green-900 mb-2">Tài khoản:</h3>
                    <div className="text-sm text-green-800">
                      <div><strong>Số tài khoản:</strong> {selectedAccount.accountNumber}</div>
                      <div><strong>Tên tài khoản:</strong> {selectedAccount.accountName}</div>
                      <div><strong>Số dư hiện tại:</strong> {formatCurrency(selectedAccount.balance || 0)}</div>
                    </div>
                  </div>
                )}

                {/* Deposit Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số tiền nạp (VND) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      placeholder="Nhập số tiền..."
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả (tùy chọn)
                  </label>
                  <textarea
                    placeholder="Nhập mô tả giao dịch..."
                    value={depositDescription}
                    onChange={(e) => setDepositDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  </div>
                )}

                {/* Deposit Button */}
                <button
                  onClick={handleDeposit}
                  disabled={depositing || !depositAmount}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {depositing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Đang nạp tiền...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Nạp Tiền
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chọn người dùng</h3>
                <p className="text-gray-500">Vui lòng chọn người dùng từ danh sách bên trái để bắt đầu nạp tiền</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toast open={showToast} onClose={() => setShowToast(false)} title="Nạp tiền thành công" message={toastMsg} />
    </div>
  );
};

export default Deposit;
