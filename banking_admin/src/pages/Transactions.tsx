import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Eye, CheckCircle, XCircle, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import type { Transaction } from '../types';

const Transactions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.getTransactions(page, limit, searchTerm);
      setTransactions(result.transactions);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError('Không thể tải danh sách giao dịch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [page, searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page when searching
  };


  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = (transaction.transactionNumber || transaction.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.senderAccount?.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.receiverAccount?.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || transaction.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-8xl mx-auto space-y-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
              onClick={loadTransactions}
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

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    };
    return `px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      transfer: 'bg-blue-100 text-blue-800',
      deposit: 'bg-green-100 text-green-800',
      withdrawal: 'bg-purple-100 text-purple-800',
    };
    return `px-2 py-1 text-xs font-medium rounded-full ${styles[type as keyof typeof styles]}`;
  };

  return (
    <div className="p-6">
      <div className="max-w-8xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Quản Lý Giao Dịch
            </h1>
            <p className="text-gray-600 text-lg">Theo dõi và quản lý tất cả giao dịch trong hệ thống</p>
          </div>
          <button
            onClick={loadTransactions}
            className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 text-sm font-medium rounded-xl text-gray-700 hover:bg-white hover:border-gray-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-green-200/50 p-6 hover:shadow-xl hover:bg-white transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-50">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <span>+12.5%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Thành Công</p>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
              <p className="text-xs text-gray-500 mt-2">so với tháng trước</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-yellow-200/50 p-6 hover:shadow-xl hover:bg-white transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-yellow-50">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                <span>+5.2%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Chờ Xử Lý</p>
              <p className="text-2xl font-bold text-gray-900">56</p>
              <p className="text-xs text-gray-500 mt-2">so với tháng trước</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-red-200/50 p-6 hover:shadow-xl hover:bg-white transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-red-50">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                <span>-2.1%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Thất Bại</p>
              <p className="text-2xl font-bold text-gray-900">23</p>
              <p className="text-xs text-gray-500 mt-2">so với tháng trước</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200/50 p-6 hover:shadow-xl hover:bg-white transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-50">
                <span className="text-blue-600 font-bold text-lg">₫</span>
              </div>
              <div className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                <span>+8.7%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Tổng Giá Trị</p>
              <p className="text-2xl font-bold text-gray-900">₫2.5B</p>
              <p className="text-xs text-gray-500 mt-2">so với tháng trước</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo ID, người gửi hoặc người nhận..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="completed">Thành công</option>
                <option value="pending">Chờ xử lý</option>
                <option value="failed">Thất bại</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã Giao Dịch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người Gửi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người Nhận
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiền Ra (Ghi nợ)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiền Vào (Ghi có)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phí
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng Thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời Gian
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{transaction.transactionNumber || transaction.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transaction.senderAccount?.accountNumber || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transaction.receiverAccount?.accountNumber || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getTypeBadge(transaction.type)}>
                      {transaction.type === 'TRANSFER' ? 'Chuyển khoản' :
                       transaction.type === 'DEPOSIT' ? 'Nạp tiền' : 
                       transaction.type === 'WITHDRAWAL' ? 'Rút tiền' : transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* Tiền ra = amount + fee đối với tài khoản gửi */}
                    <div className="text-sm font-medium text-red-600">- {formatCurrency((transaction.type === 'TRANSFER' ? (transaction.amount + (transaction.fee || 0)) : (transaction.type === 'WITHDRAWAL' ? (transaction.amount + (transaction.fee || 0)) : 0)) || 0)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* Tiền vào = amount đối với tài khoản nhận */}
                    <div className="text-sm font-medium text-green-600">+ {formatCurrency((transaction.type === 'TRANSFER' ? transaction.amount : (transaction.type === 'DEPOSIT' ? transaction.amount : 0)) || 0)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatCurrency(transaction.fee || 0)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(transaction.status)}
                      <span className={`ml-2 ${getStatusBadge(transaction.status)}`}>
                        {transaction.status === 'COMPLETED' ? 'Thành công' :
                         transaction.status === 'PENDING' ? 'Chờ xử lý' : 
                         transaction.status === 'FAILED' ? 'Thất bại' : transaction.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(transaction.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1">
                        <Eye className="w-4 h-4" />
                      </button>
                      <div className="relative">
                        <button className="text-gray-400 hover:text-gray-600 p-1">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button 
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <button 
              onClick={() => setPage(page + 1)}
              disabled={page * limit >= total}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">{(page - 1) * limit + 1}</span> đến <span className="font-medium">{Math.min(page * limit, total)}</span> của{' '}
                <span className="font-medium">{total}</span> kết quả
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button 
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600">
                  {page}
                </button>
                <button 
                  onClick={() => setPage(page + 1)}
                  disabled={page * limit >= total}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </nav>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
