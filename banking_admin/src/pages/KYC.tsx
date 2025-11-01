import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Eye, CheckCircle, XCircle, Clock, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import KYCDetailModal from '../components/KYCDetailModal';
import type { User } from '../types';

const KYC: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [kycRequests, setKycRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [selectedKycRequest, setSelectedKycRequest] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadKycRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.getKycRequests(page, limit, searchTerm);
      setKycRequests(result.requests);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to load KYC requests:', err);
      setError('Không thể tải danh sách yêu cầu KYC');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKycRequests();
  }, [page, searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page when searching
  };

  const filteredRequests = (kycRequests || []).filter(request => {
    const matchesSearch = request.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleViewDetails = (request: User) => {
    setSelectedKycRequest(request);
    setIsModalOpen(true);
  };

  const handleApproveKyc = async (userId: string, notes?: string) => {
    try {
      const success = await apiService.approveKycRequest(userId, notes);
      if (success) {
        await loadKycRequests(); // Reload the list
        alert('Đã duyệt hồ sơ KYC thành công!');
      } else {
        alert('Có lỗi xảy ra khi duyệt hồ sơ KYC');
      }
    } catch (error) {
      console.error('Error approving KYC:', error);
      alert('Có lỗi xảy ra khi duyệt hồ sơ KYC');
    }
  };

  const handleRejectKyc = async (userId: string, notes?: string) => {
    try {
      const success = await apiService.rejectKycRequest(userId, notes);
      if (success) {
        await loadKycRequests(); // Reload the list
        alert('Đã từ chối hồ sơ KYC');
      } else {
        alert('Có lỗi xảy ra khi từ chối hồ sơ KYC');
      }
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      alert('Có lỗi xảy ra khi từ chối hồ sơ KYC');
    }
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
              onClick={loadKycRequests}
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
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return `px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-8xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Quản Lý KYC
              </h1>
              <p className="text-gray-600 text-lg">Xác minh danh tính và duyệt hồ sơ người dùng</p>
            </div>
            <button
              onClick={loadKycRequests}
              className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 text-sm font-medium rounded-xl text-gray-700 hover:bg-white hover:border-gray-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </button>
          </div>
          <div className="mt-4 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-4">
            <p className="text-sm text-purple-800"><span className="font-semibold">Gợi ý:</span> chỉ phê duyệt khi ảnh và thông tin trích xuất khớp giấy tờ. Bạn có thể xem chi tiết hồ sơ trước khi duyệt.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-yellow-200/50 p-6 hover:shadow-xl hover:bg-white transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-yellow-50">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                <span>+8.2%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Chờ Duyệt</p>
              <p className="text-2xl font-bold text-gray-900">{(kycRequests || []).filter(r => r.status === 'PENDING').length}</p>
              <p className="text-xs text-gray-500 mt-2">so với tháng trước</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-green-200/50 p-6 hover:shadow-xl hover:bg-white transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-50">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <span>+12.5%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Đã Duyệt</p>
              <p className="text-2xl font-bold text-gray-900">{(kycRequests || []).filter(r => r.status === 'APPROVED').length}</p>
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
              <p className="text-sm font-medium text-gray-600 mb-1">Từ Chối</p>
              <p className="text-2xl font-bold text-gray-900">{(kycRequests || []).filter(r => r.status === 'REJECTED').length}</p>
              <p className="text-xs text-gray-500 mt-2">so với tháng trước</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200/50 p-6 hover:shadow-xl hover:bg-white transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-purple-50">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                <span>+5.7%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Tổng Hồ Sơ</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
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
                  placeholder="Tìm kiếm theo tên, email hoặc ID..."
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
                <option value="PENDING">Chờ duyệt</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </div>
          </div>
        </div>

        {/* KYC Requests Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID KYC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người Dùng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại giấy tờ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày Nộp</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{request.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
                        <span className="text-sm font-semibold">
                          {request.user?.firstName?.[0]}{request.user?.lastName?.[0]}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {request.user?.firstName} {request.user?.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.documentType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(request.status?.toLowerCase() || 'pending')}
                      <span className={`ml-2 ${getStatusBadge(request.status?.toLowerCase() || 'pending')}`}>
                        {request.status === 'PENDING' ? 'Chờ duyệt' : request.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(request.submittedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleViewDetails(request.user)}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {request.status === 'PENDING' && (
                        <>
                          <button 
                            onClick={() => handleApproveKyc(request.user.id)}
                            className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 transition-colors"
                            title="Duyệt"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRejectKyc(request.user.id)}
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                            title="Từ chối"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <div className="relative">
                        <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">Không có hồ sơ KYC phù hợp</div>
                  </td>
                </tr>
              )}
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

      {/* KYC Detail Modal */}
      <KYCDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedKycRequest(null);
        }}
        kycRequest={selectedKycRequest}
        onApprove={handleApproveKyc}
        onReject={handleRejectKyc}
      />
    </div>
  );
};

export default KYC;
