import React, { useState, useEffect } from 'react';
import { Bell, Send, Users, Search, X, Plus, CheckCircle, Clock, Filter, Eye, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

interface NotificationForm {
  title: string;
  content: string;
  receiverIds: string[];
  type: string;
  priority: string;
  category: string;
}

const Notifications: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Notification list states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [notificationsPage, setNotificationsPage] = useState(1);
  const [notificationsTotal, setNotificationsTotal] = useState(0);
  const [notificationsLimit] = useState(20);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  const [formData, setFormData] = useState<NotificationForm>({
    title: '',
    content: '',
    receiverIds: [],
    type: 'ANNOUNCEMENT',
    priority: 'NORMAL',
    category: '',
  });

  // Load all users for selection
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const result = await apiService.getUsers(1, 1000); // Get large batch for selection
        setAllUsers(result.users || []);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    loadUsers();
  }, []);

  // Load notifications list
  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const result = await apiService.getNotifications({
        type: filterType !== 'all' ? filterType : undefined,
        priority: filterPriority !== 'all' ? filterPriority : undefined,
        limit: notificationsLimit,
        offset: (notificationsPage - 1) * notificationsLimit,
      });
      setNotifications(result.notifications || []);
      setNotificationsTotal(result.total || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setToast({ message: 'Không thể tải danh sách thông báo', type: 'error' });
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [notificationsPage, filterType, filterPriority]);

  const handleViewDetail = async (notification: any) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
  };

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = allUsers.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setUserSearchResults(filtered.slice(0, 20)); // Limit to 20 results
    } else {
      setUserSearchResults([]);
    }
  }, [searchTerm, allUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserSelect = (userId: string) => {
    if (!selectedUsers.includes(userId)) {
      setSelectedUsers([...selectedUsers, userId]);
      setFormData((prev) => ({
        ...prev,
        receiverIds: [...prev.receiverIds, userId],
      }));
    }
    setSearchTerm('');
    setUserSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    setFormData((prev) => ({
      ...prev,
      receiverIds: prev.receiverIds.filter((id) => id !== userId),
    }));
  };

  const handleSelectAllUsers = () => {
    const allUserIds = allUsers.map((u) => u.id);
    setSelectedUsers(allUserIds);
    setFormData((prev) => ({ ...prev, receiverIds: allUserIds }));
    setSearchTerm('');
    setUserSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      setToast({ message: 'Vui lòng nhập tiêu đề và nội dung', type: 'error' });
      return;
    }

    if (formData.receiverIds.length === 0) {
      setToast({ message: 'Vui lòng chọn ít nhất một người nhận', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.createNotification({
        title: formData.title,
        content: formData.content,
        receiverIds: formData.receiverIds,
        type: formData.type,
        priority: formData.priority,
        category: formData.category || undefined,
      });

      if (response.success) {
        setToast({
          message: `Đã gửi thông báo thành công cho ${formData.receiverIds.length} người nhận`,
          type: 'success',
        });
        // Reset form
        setFormData({
          title: '',
          content: '',
          receiverIds: [],
          type: 'ANNOUNCEMENT',
          priority: 'NORMAL',
          category: '',
        });
        setSelectedUsers([]);
        setShowCreateForm(false);
        // Reload notifications list
        await loadNotifications();
      } else {
        setToast({ message: response.message || 'Có lỗi xảy ra khi tạo thông báo', type: 'error' });
      }
    } catch (error: any) {
      setToast({
        message: error.message || 'Có lỗi xảy ra khi tạo thông báo',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bell className="w-8 h-8 text-purple-600" />
              Quản Lý Thông Báo
            </h1>
            <p className="text-gray-600 mt-2">Tạo và gửi thông báo cho người dùng</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Tạo Thông Báo
          </button>
        </div>

        {/* Create Notification Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Tạo Thông Báo Mới</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu Đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Nhập tiêu đề thông báo"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội Dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Nhập nội dung thông báo"
                />
              </div>

              {/* Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại Thông Báo
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="SYSTEM">Hệ Thống</option>
                    <option value="ANNOUNCEMENT">Thông Báo</option>
                    <option value="TRANSACTION">Giao Dịch</option>
                    <option value="SECURITY">Bảo Mật</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Lưu ý: Thông báo KYC được gửi tự động khi duyệt/từ chối KYC
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Độ Ưu Tiên
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="LOW">Thấp</option>
                    <option value="NORMAL">Bình Thường</option>
                    <option value="HIGH">Cao</option>
                    <option value="URGENT">Khẩn Cấp</option>
                  </select>
                </div>
              </div>

              {/* Category (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh Mục (Tùy chọn)
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ví dụ: PROMOTION, UPDATE, MAINTENANCE"
                />
              </div>

              {/* Receiver Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Người Nhận <span className="text-red-500">*</span>
                </label>

                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selectedUsers.slice(0, 5).map((userId) => {
                      const user = allUsers.find((u) => u.id === userId);
                      return (
                        <span
                          key={userId}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                        >
                          {user ? `${user.firstName} ${user.lastName}` : userId.substring(0, 8)}
                          <button
                            type="button"
                            onClick={() => handleRemoveUser(userId)}
                            className="hover:text-purple-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                    {selectedUsers.length > 5 && (
                      <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        +{selectedUsers.length - 5} người khác
                      </span>
                    )}
                  </div>
                )}

                {/* Search and Select Users */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/4 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm người dùng theo tên hoặc email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />

                  {/* Quick Actions */}
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllUsers}
                      className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Users className="w-4 h-4 inline mr-1" />
                      Chọn Tất Cả ({allUsers.length} users)
                    </button>
                  </div>

                  {/* Search Results Dropdown */}
                  {userSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {userSearchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleUserSelect(user.id)}
                          disabled={selectedUsers.includes(user.id)}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                            selectedUsers.includes(user.id) ? 'bg-gray-100 opacity-50' : ''
                          }`}
                        >
                          <div className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary */}
                {selectedUsers.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    Đã chọn: <strong>{selectedUsers.length}</strong> người nhận
                  </p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Gửi Thông Báo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Info Card */}
        {!showCreateForm && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bell className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Tạo Thông Báo Cho Người Dùng
                </h3>
                <p className="text-gray-600 mb-3">
                  Bạn có thể tạo và gửi thông báo cho một hoặc nhiều người dùng. Thông báo sẽ được
                  gửi real-time qua WebSocket và lưu trữ trong hệ thống.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="px-3 py-1 bg-white rounded-lg text-sm text-gray-700">
                    <strong>Loại:</strong> Hệ Thống, Thông Báo, Giao Dịch, Bảo Mật
                  </span>
                  <span className="px-3 py-1 bg-white rounded-lg text-sm text-gray-700">
                    <strong>Ưu Tiên:</strong> Thấp, Bình Thường, Cao, Khẩn Cấp
                  </span>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Lưu ý:</strong> Thông báo KYC được gửi tự động khi bạn duyệt hoặc từ chối yêu cầu KYC trong trang KYC Management.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        {!showCreateForm && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Danh Sách Thông Báo</h2>
                <button
                  onClick={loadNotifications}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Làm mới
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value);
                      setNotificationsPage(1);
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">Tất cả loại</option>
                    <option value="SYSTEM">Hệ Thống</option>
                    <option value="ANNOUNCEMENT">Thông Báo</option>
                    <option value="TRANSACTION">Giao Dịch</option>
                    <option value="SECURITY">Bảo Mật</option>
                    <option value="KYC">KYC</option>
                  </select>
                </div>
                <select
                  value={filterPriority}
                  onChange={(e) => {
                    setFilterPriority(e.target.value);
                    setNotificationsPage(1);
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Tất cả độ ưu tiên</option>
                  <option value="LOW">Thấp</option>
                  <option value="NORMAL">Bình Thường</option>
                  <option value="HIGH">Cao</option>
                  <option value="URGENT">Khẩn Cấp</option>
                </select>
              </div>
            </div>

            {/* Notifications Table */}
            <div className="overflow-x-auto">
              {notificationsLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Đang tải...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Chưa có thông báo nào</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tiêu Đề
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loại
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ưu Tiên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Người Nhận
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Người Tạo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày Tạo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao Tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {notifications.map((notification) => {
                      const getTypeColor = (type: string) => {
                        switch (type) {
                          case 'KYC':
                            return 'bg-orange-100 text-orange-800';
                          case 'TRANSACTION':
                            return 'bg-green-100 text-green-800';
                          case 'SECURITY':
                            return 'bg-red-100 text-red-800';
                          case 'ANNOUNCEMENT':
                            return 'bg-blue-100 text-blue-800';
                          default:
                            return 'bg-gray-100 text-gray-800';
                        }
                      };

                      const getPriorityColor = (priority: string) => {
                        switch (priority) {
                          case 'URGENT':
                            return 'bg-red-100 text-red-800';
                          case 'HIGH':
                            return 'bg-orange-100 text-orange-800';
                          case 'NORMAL':
                            return 'bg-blue-100 text-blue-800';
                          default:
                            return 'bg-gray-100 text-gray-800';
                        }
                      };

                      const formatDate = (dateString: string) => {
                        const date = new Date(dateString);
                        return date.toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                      };

                      return (
                        <tr key={notification.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {notification.content}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(
                                notification.type
                              )}`}
                            >
                              {notification.type === 'SYSTEM'
                                ? 'Hệ Thống'
                                : notification.type === 'ANNOUNCEMENT'
                                ? 'Thông Báo'
                                : notification.type === 'TRANSACTION'
                                ? 'Giao Dịch'
                                : notification.type === 'SECURITY'
                                ? 'Bảo Mật'
                                : notification.type === 'KYC'
                                ? 'KYC'
                                : notification.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                                notification.priority
                              )}`}
                            >
                              {notification.priority === 'URGENT'
                                ? 'Khẩn Cấp'
                                : notification.priority === 'HIGH'
                                ? 'Cao'
                                : notification.priority === 'NORMAL'
                                ? 'Bình Thường'
                                : 'Thấp'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {notification.receiver ? (
                              <div>
                                <div className="font-medium">
                                  {notification.receiver.firstName} {notification.receiver.lastName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {notification.receiver.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {notification.sender ? (
                              <div>
                                <div className="font-medium">
                                  {notification.sender.firstName} {notification.sender.lastName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {notification.sender.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(notification.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleViewDetail(notification)}
                              className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              Xem
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {notificationsTotal > notificationsLimit && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Hiển thị {(notificationsPage - 1) * notificationsLimit + 1} -{' '}
                  {Math.min(notificationsPage * notificationsLimit, notificationsTotal)} /{' '}
                  {notificationsTotal} thông báo
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNotificationsPage((p) => Math.max(1, p - 1))}
                    disabled={notificationsPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() =>
                      setNotificationsPage((p) =>
                        Math.min(Math.ceil(notificationsTotal / notificationsLimit), p + 1)
                      )
                    }
                    disabled={
                      notificationsPage >= Math.ceil(notificationsTotal / notificationsLimit)
                    }
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notification Detail Modal */}
        <Modal
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedNotification(null);
          }}
          widthClass="max-w-2xl"
        >
          {selectedNotification && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Chi Tiết Thông Báo</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedNotification(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu Đề</label>
                  <p className="text-gray-900 font-medium">{selectedNotification.title}</p>
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội Dung</label>
                <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                  {selectedNotification.content}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      selectedNotification.type === 'KYC'
                        ? 'bg-orange-100 text-orange-800'
                        : selectedNotification.type === 'TRANSACTION'
                        ? 'bg-green-100 text-green-800'
                        : selectedNotification.type === 'SECURITY'
                        ? 'bg-red-100 text-red-800'
                        : selectedNotification.type === 'ANNOUNCEMENT'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selectedNotification.type}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ưu Tiên</label>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      selectedNotification.priority === 'URGENT'
                        ? 'bg-red-100 text-red-800'
                        : selectedNotification.priority === 'HIGH'
                        ? 'bg-orange-100 text-orange-800'
                        : selectedNotification.priority === 'NORMAL'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selectedNotification.priority}
                  </span>
                </div>
              </div>
              {selectedNotification.category && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh Mục</label>
                  <p className="text-gray-700">{selectedNotification.category}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Người Nhận</label>
                {selectedNotification.receiver ? (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium text-gray-900">
                      {selectedNotification.receiver.firstName}{' '}
                      {selectedNotification.receiver.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{selectedNotification.receiver.email}</p>
                  </div>
                ) : (
                  <p className="text-gray-400">N/A</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Người Tạo</label>
                {selectedNotification.sender ? (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium text-gray-900">
                      {selectedNotification.sender.firstName} {selectedNotification.sender.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{selectedNotification.sender.email}</p>
                  </div>
                ) : (
                  <p className="text-gray-400">N/A</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày Tạo</label>
                  <p className="text-gray-700">
                    {new Date(selectedNotification.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                {selectedNotification.readAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đã Đọc Lúc
                    </label>
                    <p className="text-gray-700">
                      {new Date(selectedNotification.readAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    selectedNotification.isRead
                      ? 'bg-green-50 text-green-700'
                      : 'bg-yellow-50 text-yellow-700'
                  }`}
                >
                  {selectedNotification.isRead ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {selectedNotification.isRead ? 'Đã Đọc' : 'Chưa Đọc'}
                  </span>
                </div>
              </div>
              </div>
            </div>
          )}
        </Modal>
      </div>

      {/* Toast Notification */}
      <Toast
        open={toast !== null}
        title={toast?.type === 'success' ? 'Thành công' : 'Lỗi'}
        message={toast?.message}
        onClose={() => setToast(null)}
      />
    </div>
  );
};

export default Notifications;

