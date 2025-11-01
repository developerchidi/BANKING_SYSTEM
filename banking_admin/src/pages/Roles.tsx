import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Eye, Edit, Trash2, UserCheck, UserX, RefreshCw, AlertCircle, Shield, Users } from 'lucide-react';
import { apiService } from '../services/api';
import type { Role, UserRole } from '../types';

const Roles: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const rolesData = await apiService.getRoles();
      setRoles(rolesData);
    } catch (err) {
      console.error('Failed to load roles:', err);
      setError('Không thể tải danh sách roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && role.isActive) ||
                         (filterStatus === 'inactive' && !role.isActive);
    
    return matchesSearch && matchesFilter;
  });

  const getRoleBadge = (level: number) => {
    if (level >= 90) return 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800';
    if (level >= 70) return 'px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800';
    if (level >= 50) return 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800';
    if (level >= 30) return 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800';
    return 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800';
  };

  const getRoleLevelText = (level: number) => {
    if (level >= 90) return 'Cao nhất';
    if (level >= 70) return 'Cao';
    if (level >= 50) return 'Trung bình';
    if (level >= 30) return 'Thấp';
    return 'Cơ bản';
  };

  const getPermissionCount = (permissions: string[] | undefined) => {
    return permissions ? permissions.length : 0;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-8xl mx-auto space-y-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
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
              onClick={loadRoles}
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
              Quản Lý Roles
            </h1>
            <p className="text-gray-600 text-lg">Quản lý vai trò và quyền hạn trong hệ thống</p>
          </div>
          <button
            onClick={loadRoles}
            className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 text-sm font-medium rounded-xl text-gray-700 hover:bg-white hover:border-gray-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên role hoặc mô tả..."
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
                <option value="all">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>
          </div>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role, index) => (
            <div key={role.id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl hover:bg-white transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animate-fade-in-up" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{role.displayName}</h3>
                    <p className="text-sm text-gray-500">{role.name}</p>
                  </div>
                </div>
                <span className={getRoleBadge(role.level)}>
                  {getRoleLevelText(role.level)}
                </span>
              </div>
              
              {role.description && (
                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
              )}
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Cấp độ:</span>
                  <span className="font-medium text-gray-900">{role.level}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Quyền hạn:</span>
                  <span className="font-medium text-gray-900">
                    {getPermissionCount(role.permissions)} quyền
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Trạng thái:</span>
                  <span className={`font-medium ${role.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {role.isActive ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Tạo: {new Date(role.createdAt).toLocaleDateString('vi-VN')}
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-900 p-1">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 p-1">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 p-1">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRoles.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy role nào</h3>
            <p className="text-gray-500">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Roles;
