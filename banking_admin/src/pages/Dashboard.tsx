import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  DollarSign,
  Activity,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock
} from 'lucide-react';
import { apiService } from '../services/api';
import type { DashboardStats, RecentActivity } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, activitiesData] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getRecentActivities(5)
      ]);
      
      setStats(statsData);
      setRecentActivities(activitiesData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  if (loading) {
    return (
      <div className="p-6">
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
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Lỗi tải dữ liệu</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="mt-4 inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const statsData = [
    {
      name: 'Tổng Người Dùng',
      value: stats?.totalUsers ? formatNumber(stats.totalUsers) : '12,345',
      change: stats?.userGrowth ? `+${stats.userGrowth}%` : '+5.2%',
      changeType: 'positive' as const,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      name: 'Giao Dịch Hôm Nay',
      value: stats?.todayTransactions ? formatNumber(stats.todayTransactions) : '1,234',
      change: stats?.transactionGrowth ? `+${stats.transactionGrowth}%` : '+12.1%',
      changeType: 'positive' as const,
      icon: CreditCard,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      name: 'Doanh Thu Tháng',
      value: stats?.monthlyRevenue ? formatCurrency(stats.monthlyRevenue) : '2.500.000.000 ₫',
      change: stats?.revenueGrowth ? `+${stats.revenueGrowth}%` : '+8.7%',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200'
    },
    {
      name: 'Tài Khoản Hoạt Động',
      value: stats?.activeAccounts ? formatNumber(stats.activeAccounts) : '8,901',
      change: stats?.accountGrowth ? `${stats.accountGrowth > 0 ? '+' : ''}${stats.accountGrowth}%` : '-2.3%',
      changeType: stats?.accountGrowth && stats.accountGrowth > 0 ? 'positive' : 'negative',
      icon: TrendingUp,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200'
    }
  ];

  return (
    <div className="p-6">
      <div className="max-w-8xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 text-lg">Tổng quan hệ thống ngân hàng</p>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 text-sm font-medium rounded-xl text-gray-700 hover:bg-white hover:border-gray-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index) => (
            <div 
              key={stat.name} 
              className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border ${stat.borderColor} p-6 hover:shadow-xl hover:bg-white transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animate-fade-in-up`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  stat.changeType === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {stat.changeType === 'positive' ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-2">so với tháng trước</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts and Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transaction Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Giao Dịch Theo Thời Gian</h3>
                <p className="text-sm text-gray-500">Biểu đồ giao dịch 7 ngày qua</p>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">7 ngày</span>
              </div>
            </div>
            <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Biểu đồ giao dịch</p>
                <p className="text-sm text-gray-400">Sẽ được tích hợp Chart.js</p>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Hoạt Động Gần Đây</h3>
                <p className="text-sm text-gray-500">Các hoạt động mới nhất</p>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">24h</span>
              </div>
            </div>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'warning' ? 'bg-yellow-500' :
                      activity.type === 'error' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Chưa có hoạt động gần đây</p>
                  <p className="text-sm text-gray-400 mt-1">Các hoạt động sẽ hiển thị ở đây</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center mb-6">
            <div className="p-2 bg-blue-50 rounded-lg mr-3">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Trạng Thái Hệ Thống</h3>
              <p className="text-sm text-gray-500">Giám sát hệ thống real-time</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
              <div>
                <p className="text-sm font-medium text-green-800">API Server</p>
                <p className="text-xs text-green-600">Hoạt động bình thường</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
              <div>
                <p className="text-sm font-medium text-green-800">Database</p>
                <p className="text-xs text-green-600">Kết nối ổn định</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3 animate-pulse"></div>
              <div>
                <p className="text-sm font-medium text-yellow-800">Email Service</p>
                <p className="text-xs text-yellow-600">Chế độ fallback</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;