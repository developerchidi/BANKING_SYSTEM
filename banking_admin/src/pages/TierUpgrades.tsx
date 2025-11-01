import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Calendar,
  DollarSign,
  Shield,
  Eye,
  RefreshCw
} from 'lucide-react';
import { apiService } from '../services/api';

interface TierUpgradeRequest {
  id: string;
  userId: string;
  currentTier: string;
  targetTier: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    monthlyIncome: number;
    isKycVerified: boolean;
  };
}

const TierUpgrades: React.FC = () => {
  const [requests, setRequests] = useState<TierUpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<TierUpgradeRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  useEffect(() => {
    fetchRequests();
  }, [currentPage, filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTierUpgradeRequests(currentPage, 20, filter);
      setRequests(response.requests);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to fetch tier upgrade requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setActionLoading(true);
      await apiService.approveTierUpgrade(requestId);
      await fetchRequests();
      setShowModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to approve tier upgrade:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setActionLoading(true);
      await apiService.rejectTierUpgrade(requestId, rejectionReason);
      await fetchRequests();
      setShowModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject tier upgrade:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (request: TierUpgradeRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
    setRejectionReason('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'BASIC':
        return 'bg-gray-100 text-gray-800';
      case 'STANDARD':
        return 'bg-blue-100 text-blue-800';
      case 'PREMIUM':
        return 'bg-purple-100 text-purple-800';
      case 'VIP':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Nâng cấp Tier</h1>
          <p className="text-gray-600">Phê duyệt các yêu cầu nâng cấp tài khoản</p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {status === 'ALL' ? 'Tất cả' : 
             status === 'PENDING' ? 'Chờ duyệt' :
             status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier hiện tại → Mục tiêu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thu nhập
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  KYC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày yêu cầu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {request.user?.firstName} {request.user?.lastName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {request.user?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTierColor(request.currentTier)}`}>
                        {request.currentTier}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTierColor(request.targetTier)}`}>
                        {request.targetTier}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {formatCurrency(request.user?.monthlyIncome || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Shield className={`w-4 h-4 mr-1 ${request.user?.isKycVerified ? 'text-green-500' : 'text-red-500'}`} />
                      <span className={`text-sm ${request.user?.isKycVerified ? 'text-green-600' : 'text-red-600'}`}>
                        {request.user?.isKycVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1">
                        {request.status === 'PENDING' ? 'Chờ duyệt' :
                         request.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(request.requestedAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openModal(request)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Chi tiết yêu cầu nâng cấp
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* User Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Thông tin người dùng</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Họ tên:</span>
                      <span className="ml-2 font-medium">{selectedRequest.user?.firstName} {selectedRequest.user?.lastName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 font-medium">{selectedRequest.user?.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Thu nhập:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedRequest.user?.monthlyIncome || 0)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">KYC:</span>
                      <span className={`ml-2 font-medium ${selectedRequest.user?.isKycVerified ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedRequest.user?.isKycVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Request Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Thông tin yêu cầu</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Từ tier:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTierColor(selectedRequest.currentTier)}`}>
                        {selectedRequest.currentTier}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Đến tier:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTierColor(selectedRequest.targetTier)}`}>
                        {selectedRequest.targetTier}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ngày yêu cầu:</span>
                      <span className="font-medium">{formatDate(selectedRequest.requestedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Trạng thái:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {getStatusIcon(selectedRequest.status)}
                        <span className="ml-1">
                          {selectedRequest.status === 'PENDING' ? 'Chờ duyệt' :
                           selectedRequest.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Lý do yêu cầu</h4>
                  <p className="text-sm text-gray-700">{selectedRequest.reason}</p>
                </div>

                {/* Rejection Reason */}
                {selectedRequest.rejectionReason && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">Lý do từ chối</h4>
                    <p className="text-sm text-red-700">{selectedRequest.rejectionReason}</p>
                  </div>
                )}

                {/* Actions */}
                {selectedRequest.status === 'PENDING' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lý do từ chối (nếu từ chối)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Nhập lý do từ chối..."
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleReject(selectedRequest.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                      >
                        {actionLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Từ chối
                      </button>
                      <button
                        onClick={() => handleApprove(selectedRequest.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                      >
                        {actionLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Phê duyệt
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TierUpgrades;
