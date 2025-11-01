import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Eye, Edit, Trash2, UserCheck, UserX, RefreshCw, AlertCircle, Plus, X } from 'lucide-react';
import { apiService } from '../services/api';
import type { User } from '../types';
import Modal from '../components/Modal';

const Users: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  // Modal & form states
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState<{ email: string; password?: string; firstName: string; lastName: string; phone?: string; isActive?: boolean; dateOfBirth?: string | null; studentId?: string | null; cohort?: string | null; school?: string | null; }>({ email: '', password: '', firstName: '', lastName: '', phone: '', isActive: true, dateOfBirth: null, studentId: null, cohort: null, school: null });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  // View details state
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [viewRoles, setViewRoles] = useState<any[]>([]);
  const [viewAccounts, setViewAccounts] = useState<any[]>([]);
  const [viewTxs, setViewTxs] = useState<any[]>([]);
  const [viewTxsTotal, setViewTxsTotal] = useState(0);
  const [viewTxsPage, setViewTxsPage] = useState(1);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.getUsers(page, limit, searchTerm);
      setUsers(result.users);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page when searching
  };

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      const updatedUser = await apiService.updateUserStatus(userId, isActive);
      if (updatedUser) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, isActive } : user
        ));
      }
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  };

  // Modal handlers
  const openCreate = () => { setForm({ email: '', password: '', firstName: '', lastName: '', phone: '' }); setFormError(null); setShowCreate(true); };
  const openEdit = async (user: User) => {
    setSelectedUser(user);
    setFormError(null);
    setEditLoading(true);
    setShowEdit(true);
    try {
      const full = await apiService.getUserById(user.id);
      const u: any = full || user;
      setForm({
        email: u.email,
        password: '',
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone || '',
        isActive: u.isActive,
        dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().slice(0,10) : (u.userProfile?.dateOfBirth ? new Date(u.userProfile.dateOfBirth).toISOString().slice(0,10) : null),
        studentId: u.userProfile?.studentId || null,
        cohort: u.userProfile?.cohort || null,
        school: u.userProfile?.school || null,
      });
    } catch (e) {
      // fallback to row data
      setForm({
        email: (user as any).email,
        password: '',
        firstName: (user as any).firstName,
        lastName: (user as any).lastName,
        phone: (user as any).phone || '',
        isActive: (user as any).isActive,
        dateOfBirth: (user as any)?.dateOfBirth ? new Date((user as any).dateOfBirth).toISOString().slice(0,10) : null,
        studentId: (user as any)?.userProfile?.studentId || null,
        cohort: (user as any)?.userProfile?.cohort || null,
        school: (user as any)?.userProfile?.school || null,
      });
    } finally {
      setEditLoading(false);
    }
  };
  const openView = async (user: User) => {
    setSelectedUser(user);
    setShowView(true);
    setViewLoading(true);
    setViewError(null);
    try {
      // Load in parallel
      const [u, roles, accounts] = await Promise.all([
        apiService.getUserById(user.id),
        apiService.getUserRoles(user.id),
        apiService.getUserAccounts(user.id)
      ]);
      setViewUser(u || user);
      setViewRoles(roles || []);
      setViewAccounts(accounts || []);
      // Fetch first page transactions related to user (admin endpoint)
      const txRes = await apiService.getTransactions(1, 50, undefined, { userId: user.id });
      setViewTxs(txRes.transactions || []);
      setViewTxsTotal(txRes.total || 0);
      setViewTxsPage(txRes.page || 1);
    } catch (e) {
      setViewError('Không thể tải chi tiết người dùng');
      setViewUser(user);
      setViewRoles([]);
      setViewAccounts([]);
    } finally {
      setViewLoading(false);
    }
  };
  const openDelete = (user: User) => { setSelectedUser(user); setShowDelete(true); };
  const closeAllModals = () => { setShowCreate(false); setShowEdit(false); setShowView(false); setShowDelete(false); setSelectedUser(null); setFormError(null); };

  // Form submit
  const validateCreateForm = () => {
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Email không hợp lệ';
    if (!form.password || (form.password || '').length < 8) return 'Mật khẩu tối thiểu 8 ký tự';
    if (!form.firstName || !form.lastName) return 'Vui lòng nhập Họ và Tên';
    return null;
  };

  const handleCreate = async () => {
    try {
      setFormError(null);
      const errMsg = validateCreateForm();
      if (errMsg) { setFormError(errMsg); return; }
      setSubmitting(true);
      const created = await apiService.createUser({ email: form.email, password: form.password || '', firstName: form.firstName, lastName: form.lastName, phone: form.phone } as any);
      if (!created) throw new Error('Tạo người dùng thất bại');
      closeAllModals();
      await loadUsers();
    } catch (e: any) {
      setFormError(e?.message || 'Không thể tạo người dùng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    try {
      setFormError(null);
      if (!form.firstName || !form.lastName) { setFormError('Vui lòng nhập Họ và Tên'); return; }
      setSubmitting(true);
      const updated = await apiService.updateUser(selectedUser.id, { firstName: form.firstName, lastName: form.lastName, phone: form.phone, isActive: form.isActive });
      // Update extended profile fields (admin)
      await apiService.updateUserProfile(selectedUser.id, {
        dateOfBirth: form.dateOfBirth || null,
        studentId: (form.studentId || '') as any,
        cohort: (form.cohort || '') as any,
        school: (form.school || '') as any,
      });
      if (!updated) throw new Error('Cập nhật người dùng thất bại');
      closeAllModals();
      await loadUsers();
    } catch (e: any) {
      setFormError(e?.message || 'Không thể cập nhật người dùng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      setSubmitting(true);
      const result = await apiService.deleteUser(selectedUser.id);
      if (!result) throw new Error('Xóa người dùng thất bại');
      closeAllModals();
      await loadUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.phone && user.phone.includes(searchTerm));
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800'
      : 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800';
  };

  const getKycBadge = (status: string) => {
    const styles = {
      APPROVED: 'bg-blue-100 text-blue-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return `px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`;
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Quản Lý Người Dùng
            </h1>
            <p className="text-gray-600 text-lg">Quản lý tài khoản và thông tin người dùng</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={openCreate} className="inline-flex items-center px-6 py-3 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 shadow-sm transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Thêm người dùng
            </button>
            <button
              onClick={loadUsers}
              className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 text-sm font-medium rounded-xl text-gray-700 hover:bg-white hover:border-gray-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="suspended">Tạm khóa</option>
            </select>
          </div>
        </div>
      </div>

        {/* Users Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người Dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Liên Hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng Thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  KYC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email Verified
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày Tham Gia
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(user.isActive)}>
                      {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getKycBadge(user.kycStatus)}>
                      {user.kycStatus === 'APPROVED' ? 'Đã xác thực' :
                       user.kycStatus === 'PENDING' ? 'Chờ duyệt' : 'Từ chối'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.isEmailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1" onClick={() => openView(user)}>
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-amber-600 hover:text-amber-800" onClick={() => openEdit(user)}>
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleStatusChange(user.id, !user.isActive)}
                        className={`p-1 ${user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      >
                        {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button className="text-red-600 hover:text-red-800 p-1" onClick={() => openDelete(user)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
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
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Trước
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Sau
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">{((page - 1) * limit) + 1}</span> đến <span className="font-medium">{Math.min(page * limit, total)}</span> của{' '}
                <span className="font-medium">{total}</span> kết quả
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Trước
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-purple-50 text-sm font-medium text-purple-600">
                  1
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Sau
                </button>
              </nav>
            </div>
          </div>
        </div>
  {/* Create Modal */}
  {showCreate && (
    <Modal open={showCreate} onClose={closeAllModals} widthClass="max-w-lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Thêm người dùng</h3>
          <button onClick={closeAllModals} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        {formError && <div className="mb-3 text-sm text-red-600">{formError}</div>}
        <div className="grid grid-cols-1 gap-4">
          <input className="border rounded-lg px-3 py-2" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Mật khẩu" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input className="border rounded-lg px-3 py-2" placeholder="Họ" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="Tên" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <input className="border rounded-lg px-3 py-2" placeholder="Số điện thoại (tuỳ chọn)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={closeAllModals} className="px-4 py-2 rounded-lg border">Hủy</button>
          <button disabled={submitting} onClick={handleCreate} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">{submitting ? 'Đang lưu...' : 'Tạo mới'}</button>
        </div>
      </div>
    </Modal>
  )}
  {/* Edit Modal */}
  {showEdit && selectedUser && (
    <Modal open={showEdit} onClose={closeAllModals} widthClass="max-w-lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Chỉnh sửa người dùng</h3>
          <button onClick={closeAllModals} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        {formError && <div className="mb-3 text-sm text-red-600">{formError}</div>}
        {editLoading ? (
          <div className="text-sm text-gray-600">Đang tải thông tin...</div>
        ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-gray-500">Email</label>
            <input className="w-full h-11 border rounded-lg px-3 bg-gray-100" placeholder="Email" value={form.email} disabled />
          </div>
          <div className="col-span-1">
            <label className="text-xs text-gray-500">Họ</label>
            <input className="w-full h-11 border rounded-lg px-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Họ" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div className="col-span-1">
            <label className="text-xs text-gray-500">Tên</label>
            <input className="w-full h-11 border rounded-lg px-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Tên" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500">Số điện thoại</label>
            <input className="w-full h-11 border rounded-lg px-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Số điện thoại (tuỳ chọn)" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="col-span-1">
            <label className="text-xs text-gray-500">Ngày sinh</label>
            <input type="date" className="w-full h-11 border rounded-lg px-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent" value={form.dateOfBirth || ''} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
          </div>
          <div className="col-span-1">
            <label className="text-xs text-gray-500">Mã số sinh viên</label>
            <input className="w-full h-11 border rounded-lg px-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="B20DCCN001" value={form.studentId || ''} onChange={e => setForm({ ...form, studentId: e.target.value })} />
          </div>
          <div className="col-span-1">
            <label className="text-xs text-gray-500">Khóa</label>
            <input className="w-full h-11 border rounded-lg px-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="K20" value={form.cohort || ''} onChange={e => setForm({ ...form, cohort: e.target.value })} />
          </div>
          <div className="col-span-1">
            <label className="text-xs text-gray-500">Trường</label>
            <input className="w-full h-11 border rounded-lg px-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="PTIT" value={form.school || ''} onChange={e => setForm({ ...form, school: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
              <span>Kích hoạt tài khoản</span>
            </label>
          </div>
          {selectedUser && (
            <div className="col-span-2 grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div>
                <div className="text-gray-500">KYC</div>
                <div className="font-medium">{selectedUser.kycStatus}</div>
              </div>
              <div>
                <div className="text-gray-500">Email verified</div>
                <div className="font-medium">{selectedUser.isEmailVerified ? 'Có' : 'Không'}</div>
              </div>
            </div>
          )}
        </div>
        )}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={closeAllModals} className="px-4 py-2 rounded-lg border">Hủy</button>
          <button disabled={submitting} onClick={handleEdit} className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60">{submitting ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
        </div>
      </div>
    </Modal>
  )}
  {/* View Modal */}
  {showView && selectedUser && (
    <Modal open={showView} onClose={closeAllModals} widthClass="max-w-7xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Chi tiết người dùng</h3>
          <button onClick={closeAllModals} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        {viewLoading ? (
          <div className="text-sm text-gray-600">Đang tải chi tiết...</div>
        ) : (
          <>
            {viewError && <div className="mb-3 text-sm text-red-600">{viewError}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              {/* Left: user info */}
              <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-gray-500">ID</div>
                    <div className="font-medium break-all">{(viewUser || selectedUser).id}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Ngày tham gia</div>
                    <div className="font-medium">{new Date((viewUser || selectedUser).createdAt).toLocaleString('vi-VN')}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-gray-500">Họ tên</div>
                    <div className="font-medium">{(viewUser || selectedUser).firstName} {(viewUser || selectedUser).lastName}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Email</div>
                    <div className="font-medium">{(viewUser || selectedUser).email}</div>
                  </div>
                </div>
            {/* Profile extras */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-gray-500">Ngày sinh</div>
                <div className="font-medium">{(viewUser as any)?.dateOfBirth ? new Date((viewUser as any).dateOfBirth).toLocaleDateString('vi-VN') : ((viewUser as any)?.userProfile?.dateOfBirth ? new Date((viewUser as any).userProfile.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A')}</div>
              </div>
              <div>
                <div className="text-gray-500">MSSV</div>
                <div className="font-medium">{(viewUser as any)?.userProfile?.studentId || 'N/A'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-gray-500">Khóa</div>
                <div className="font-medium">{(viewUser as any)?.userProfile?.cohort || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500">Trường</div>
                <div className="font-medium">{(viewUser as any)?.userProfile?.school || 'N/A'}</div>
              </div>
            </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-gray-500">Điện thoại</div>
                    <div className="font-medium">{((viewUser as any)?.phone) || (selectedUser as any).phone || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Trạng thái</div>
                    <div className="font-medium">{(viewUser || selectedUser).isActive ? 'Hoạt động' : 'Không hoạt động'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-gray-500">Email verified</div>
                    <div className="font-medium">{(viewUser || selectedUser).isEmailVerified ? 'Có' : 'Không'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">KYC</div>
                    <div className="font-medium">{(viewUser || selectedUser).kycStatus}</div>
                  </div>
                </div>
                {/* Roles */}
                <div>
                  <div className="text-gray-500 mb-1">Vai trò</div>
                  {viewRoles.length === 0 ? (
                    <div className="text-gray-600">Chưa có vai trò</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {viewRoles.map((ur: any) => (
                        <span key={ur.id || ur.role?.id} className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          {ur.role?.displayName || ur.role?.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Accounts */}
                <div>
                  <div className="text-gray-500 mb-1">Tài khoản</div>
                  {viewAccounts.length === 0 ? (
                    <div className="text-gray-600">Không có tài khoản</div>
                  ) : (
                    <div className="space-y-2">
                      {viewAccounts.map((acc: any) => (
                        <div key={acc.id} className="border rounded-lg p-2">
                          <div className="flex justify-between text-sm">
                            <div>
                              <div className="font-medium">{acc.accountName} • {acc.accountNumber}</div>
                              <div className="text-gray-500">{acc.accountType} • {acc.currency}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">Số dư: {new Intl.NumberFormat('vi-VN').format(acc.balance)} {acc.currency}</div>
                              <div className="text-gray-500">Khả dụng: {new Intl.NumberFormat('vi-VN').format(acc.availableBalance)} {acc.currency}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Right: recent transactions */}
              <div className="space-y-2">
                <div className="text-gray-500">Giao dịch gần đây</div>
                {viewTxs.length === 0 ? (
                  <div className="text-gray-600">Chưa có giao dịch</div>
                ) : (
                  <div className="border rounded-lg max-h-[60vh] overflow-y-auto overflow-x-hidden">
                    <table className="w-full text-sm table-fixed">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left w-[28%]">Mã GD</th>
                          <th className="px-3 py-2 text-left w-[14%]">Loại</th>
                          <th className="px-3 py-2 text-left w-[20%]">Số tiền</th>
                          <th className="px-3 py-2 text-left w-[18%]">Trạng thái</th>
                          <th className="px-3 py-2 text-left w-[20%]">Thời gian</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewTxs.map((t: any) => (
                          <tr key={t.id} className="border-t">
                            <td className="px-3 py-2 break-all">{t.transactionNumber || t.id}</td>
                            <td className="px-3 py-2">{t.type}</td>
                            <td className="px-3 py-2">{new Intl.NumberFormat('vi-VN').format(t.amount)} {t.currency}</td>
                            <td className="px-3 py-2">{t.status}</td>
                            <td className="px-3 py-2">{new Date(t.createdAt).toLocaleString('vi-VN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="p-2 text-xs text-gray-600">Tổng: {viewTxsTotal}</div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        <div className="mt-6 flex items-center justify-end"><button onClick={closeAllModals} className="px-4 py-2 rounded-lg border">Đóng</button></div>
      </div>
    </Modal>
  )}
  {/* Delete Modal */}
  {showDelete && selectedUser && (
    <Modal open={showDelete} onClose={closeAllModals} widthClass="max-w-md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-red-600">Xóa người dùng</h3>
          <button onClick={closeAllModals} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-gray-700">Bạn có chắc muốn xóa người dùng "{selectedUser.firstName} {selectedUser.lastName}"? Hành động này không thể hoàn tác.</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={closeAllModals} className="px-4 py-2 rounded-lg border">Hủy</button>
          <button disabled={submitting} onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">{submitting ? 'Đang xóa...' : 'Xóa'}</button>
        </div>
      </div>
    </Modal>
  )}
        </div>
      </div>
    </div>
  );
};

export default Users;
