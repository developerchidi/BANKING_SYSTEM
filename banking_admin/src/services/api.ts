import type { 
  User, 
  Account, 
  Transaction, 
  DashboardStats, 
  RecentActivity,
  Role,
  UserRole
} from '../types';

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// API Service Class
class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('adminToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('🌐 API Request:', { method: options.method || 'GET', url, hasToken: !!this.token });
      const response = await fetch(url, config);
      console.log('🌐 API Response:', { status: response.status, ok: response.ok });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('🌐 API Error:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🌐 API Data:', data);
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(studentId: string, password: string): Promise<{ token: string; user: User }> {
    const response = await this.request<any>(
      '/auth/admin-login',
      {
        method: 'POST',
        body: JSON.stringify({ studentId, password }),
      }
    );

    // Backend returns: { success, message, user, accessToken, refreshToken, requiresTwoFactor, temporaryToken }
    if (response?.success) {
      const token: string | undefined = response.accessToken || response.tokens?.accessToken;
      const user: User | undefined = response.user;
      if (!token || !user) throw new Error('Invalid login response');
      this.token = token;
      localStorage.setItem('adminToken', token);
      return { token, user };
    }

    throw new Error('Login failed');
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await this.request<{ success: boolean; data: DashboardStats }>('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Return mock data as fallback
      return {
        totalUsers: 12345,
        todayTransactions: 1234,
        monthlyRevenue: 2500000000,
        activeAccounts: 8901,
        userGrowth: 5.2,
        transactionGrowth: 12.1,
        revenueGrowth: 8.7,
        accountGrowth: -2.3
      };
    }
  }

  // Users (Admin)
  async getUsers(page: number = 1, limit: number = 20, search?: string): Promise<{ users: User[]; total: number; page: number; limit: number; }> {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), ...(search ? { search } : {}) });
      const response = await this.request<{ success: boolean; data: { users: User[]; total: number; page: number; limit: number; totalPages: number } }>(`/admin/users?${params}`);
      return { users: response.data.users || [], total: response.data.total || 0, page: response.data.page || page, limit: response.data.limit || limit } as any;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return { users: [], total: 0, page, limit };
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await this.request<{ success: boolean; data: User }>(`/admin/users/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    }
  }

  async createUser(payload: { email: string; password: string; firstName: string; lastName: string; phone?: string; }): Promise<User | null> {
    try {
      const response = await this.request<{ success: boolean; data: User }>(`/admin/users`, { method: 'POST', body: JSON.stringify(payload) });
      return response.data || null;
    } catch (error) {
      console.error('Failed to create user:', error);
      return null;
    }
  }

  async updateUser(id: string, payload: Partial<{ firstName: string; lastName: string; phone: string; isActive: boolean; }>): Promise<User | null> {
    try {
      const response = await this.request<{ success: boolean; data: User }>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      return response.data || null;
    } catch (error) {
      console.error('Failed to update user:', error);
      return null;
    }
  }

  // Update only user status (activate/deactivate)
  async updateUserStatus(id: string, isActive: boolean): Promise<User | null> {
    try {
      const response = await this.request<{ success: boolean; data: User }>(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive })
      });
      return response.data || null;
    } catch (error) {
      console.error('Failed to update user status:', error);
      return null;
    }
  }

  async deleteUser(id: string): Promise<{ id: string; isActive: boolean } | null> {
    try {
      const response = await this.request<{ success: boolean; data: { id: string; isActive: boolean } }>(`/admin/users/${id}`, { method: 'DELETE' });
      return response.data || null;
    } catch (error) {
      console.error('Failed to delete user:', error);
      return null;
    }
  }

  // KYC Requests
  async getKycRequests(
    page: number = 1,
    limit: number = 20,
    search?: string
  ): Promise<{
    requests: Array<any>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const response = await this.request<{ success: boolean; data: { requests: any[]; total: number; page: number; limit: number; totalPages: number } }>(
        `/admin/kyc-requests?${params}`
      );

      return {
        requests: response.data.requests || [],
        total: response.data.total || 0,
        page: response.data.page || page,
        limit: response.data.limit || limit,
        totalPages: response.data.totalPages || 0,
      };
    } catch (error) {
      console.error('Failed to fetch KYC requests:', error);
      return {
        requests: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  // Transactions
  async getTransactions(
    page: number = 1,
    limit: number = 20,
    search?: string,
    filters?: {
      status?: string;
      type?: string;
      startDate?: string;
      endDate?: string;
      userId?: string;
    }
  ): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.type && { type: filters.type }),
        ...(filters?.startDate && { startDate: filters.startDate }),
        ...(filters?.endDate && { endDate: filters.endDate }),
        ...(filters?.userId && { userId: filters.userId }),
      });

      const response = await this.request<{ success: boolean; data: { transactions: Transaction[]; total: number; page: number; limit: number; totalPages: number } }>(
        `/banking/admin/transactions?${params}`
      );

      return {
        transactions: response.data.transactions || [],
        total: response.data.total || 0,
        page: response.data.page || page,
        limit: response.data.limit || limit,
        totalPages: response.data.totalPages || 0,
      };
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      return {
        transactions: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const response = await this.request<{ success: boolean; data: { transaction: Transaction } }>(
        `/banking/transactions/${id}`
      );
      return response.data.transaction;
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
      return null;
    }
  }


  async updateKycStatus(
    requestId: string,
    status: 'APPROVED' | 'REJECTED',
    reviewNotes?: string
  ): Promise<boolean> {
    try {
      await this.request(
        `/admin/kyc-requests/${requestId}/status`,
        {
          method: 'PUT',
          body: JSON.stringify({ status, reviewNotes }),
        }
      );
      return true;
    } catch (error) {
      console.error('Failed to update KYC status:', error);
      return false;
    }
  }

  // KYC Approval/Rejection
  async approveKycRequest(userId: string, reviewNotes?: string): Promise<boolean> {
    try {
      const response = await this.request<{ success: boolean }>(
        `/admin/kyc/${userId}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({ reviewNotes }),
        }
      );
      return response.success;
    } catch (error) {
      console.error('Failed to approve KYC request:', error);
      return false;
    }
  }

  async rejectKycRequest(userId: string, reviewNotes?: string): Promise<boolean> {
    try {
      const response = await this.request<{ success: boolean }>(
        `/admin/kyc/${userId}/reject`,
        {
          method: 'POST',
          body: JSON.stringify({ reviewNotes }),
        }
      );
      return response.success;
    } catch (error) {
      console.error('Failed to reject KYC request:', error);
      return false;
    }
  }

  // Get KYC documents
  async getKycDocuments(userId: string): Promise<{
    studentCardImage?: string;
    selfieVideo?: string;
    studentCardUrl?: string;
    selfieUrl?: string;
    extractedData?: string;
  }> {
    try {
      console.log('🔍 API: Fetching KYC documents for user:', userId);
      const response = await this.request<{ 
        success: boolean; 
        data: { 
          studentCardImage?: string; 
          selfieVideo?: string;
          studentCardUrl?: string;
          selfieUrl?: string;
          extractedData?: string;
        } 
      }>(`/admin/kyc/${userId}/documents`);
      
      console.log('🔍 API: KYC documents response:', response);
      console.log('🔍 API: Response data:', response.data);
      
      return response.data || {};
    } catch (error) {
      console.error('🔍 API: Failed to fetch KYC documents:', error);
      return {};
    }
  }

  // Recent Activities
  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    try {
      // This would be an admin-specific endpoint
      const response = await this.request<{ success: boolean; data: RecentActivity[] }>(
        `/admin/activities?limit=${limit}`
      );
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
      return [];
    }
  }

  // System Health
  async getSystemHealth(): Promise<{
    status: string;
    database: string;
    services: Record<string, string>;
  }> {
    try {
      const response = await this.request<{
        status: string;
        database: { prisma: string };
        timestamp: string;
      }>('/health');
      
      return {
        status: response.status,
        database: response.database.prisma,
        services: {
          api: 'OK',
          database: response.database.prisma,
        },
      };
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      return {
        status: 'ERROR',
        database: 'DISCONNECTED',
        services: {
          api: 'ERROR',
          database: 'DISCONNECTED',
        },
      };
    }
  }

  // Vanity Account Numbers (Admin usage as client to public endpoints)
  async getVanitySuggestions(params?: { pattern?: string; limit?: number }): Promise<string[]> {
    const search = new URLSearchParams({
      ...(params?.pattern ? { pattern: params.pattern } : {}),
      ...(params?.limit ? { limit: String(params.limit) } : {}),
    });
    const response = await this.request<{ success: boolean; data: string[] }>(`/vanity/suggest?${search}`);
    return response.data || [];
  }

  async getVanityPrice(number: string): Promise<{ number: string; score: number; price: number; tier: string }> {
    const search = new URLSearchParams({ number });
    const response = await this.request<{ success: boolean; data: { number: string; score: number; price: number; tier: string } }>(`/vanity/price?${search}`);
    return response.data;
  }

  async purchaseVanity(accountId: string, newAccountNumber: string): Promise<{ success: boolean; data?: any; message?: string }> {
    return await this.request(`/vanity/purchase`, {
      method: 'POST',
      body: JSON.stringify({ accountId, newAccountNumber })
    });
  }

  // Vanity Inventory (Admin)
  async addVanityNumbers(numbers: Array<{ number: string; tier?: string; basePrice?: number }>): Promise<any[]> {
    const res = await this.request<{ success: boolean; data: any[] }>(`/vanity/admin/numbers`, {
      method: 'POST',
      body: JSON.stringify({ numbers }),
    });
    return res.data || [];
  }

  async listVanityNumbers(params?: { status?: string; tier?: string; page?: number; limit?: number }): Promise<{ items: any[]; total: number; page: number; limit: number; }> {
    const search = new URLSearchParams({
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.tier ? { tier: params.tier } : {}),
      ...(params?.page ? { page: String(params.page) } : {}),
      ...(params?.limit ? { limit: String(params.limit) } : {}),
    });
    const res = await this.request<{ success: boolean; data: { items: any[]; total: number; page: number; limit: number } }>(`/vanity/admin/numbers?${search}`);
    return { items: res.data.items || [], total: res.data.total || 0, page: res.data.page || 1, limit: res.data.limit || 20 };
  }

  async updateVanityNumber(id: string, payload: { tier?: string; basePrice?: number; status?: string; heldUntil?: string | null }): Promise<any> {
    const res = await this.request<{ success: boolean; data: any }>(`/vanity/admin/numbers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  async deleteVanityNumber(id: string): Promise<boolean> {
    await this.request<{ success: boolean; data: any }>(`/vanity/admin/numbers/${id}`, { method: 'DELETE' });
    return true;
  }

  // Market & availability (view as admin)
  async getVanityMarket(params?: { tier?: string; page?: number; limit?: number }): Promise<{ items: any[]; total: number; page: number; limit: number; }> {
    const search = new URLSearchParams({
      ...(params?.tier ? { tier: params.tier } : {}),
      ...(params?.page ? { page: String(params.page) } : {}),
      ...(params?.limit ? { limit: String(params.limit) } : {}),
    });
    const res = await this.request<{ success: boolean; data: { items: any[]; total: number; page: number; limit: number } }>(`/vanity/market?${search}`);
    return res.data;
  }

  async getVanityAvailability(number: string): Promise<{ number: string; existsInAccounts: boolean; inventoryStatus: string | null }> {
    const res = await this.request<{ success: boolean; data: { number: string; existsInAccounts: boolean; inventoryStatus: string | null } }>(`/vanity/availability/${number}`);
    return res.data;
  }

  // Role Management
  async getRoles(): Promise<Role[]> {
    try {
      const response = await this.request<{ success: boolean; data: Role[] }>('/roles');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      return [];
    }
  }

  async getRole(roleId: string): Promise<Role | null> {
    try {
      const response = await this.request<{ success: boolean; data: Role }>(`/roles/${roleId}`);
      return response.data || null;
    } catch (error) {
      console.error('Failed to fetch role:', error);
      return null;
    }
  }

  async createRole(roleData: Partial<Role>): Promise<Role | null> {
    try {
      const response = await this.request<{ success: boolean; data: Role }>('/roles', {
        method: 'POST',
        body: JSON.stringify(roleData),
      });
      return response.data || null;
    } catch (error) {
      console.error('Failed to create role:', error);
      return null;
    }
  }

  async updateRole(roleId: string, roleData: Partial<Role>): Promise<Role | null> {
    try {
      const response = await this.request<{ success: boolean; data: Role }>(`/roles/${roleId}`, {
        method: 'PUT',
        body: JSON.stringify(roleData),
      });
      return response.data || null;
    } catch (error) {
      console.error('Failed to update role:', error);
      return null;
    }
  }

  async deleteRole(roleId: string): Promise<boolean> {
    try {
      await this.request<{ success: boolean }>(`/roles/${roleId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Failed to delete role:', error);
      return false;
    }
  }

  // User Role Management
  async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      const response = await this.request<{ success: boolean; data: UserRole[] }>(`/users/${userId}/roles`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch user roles:', error);
      return [];
    }
  }

  async assignRoleToUser(userId: string, roleId: string, expiresAt?: string): Promise<UserRole | null> {
    try {
      const response = await this.request<{ success: boolean; data: UserRole }>(`/users/${userId}/roles`, {
        method: 'POST',
        body: JSON.stringify({ roleId, expiresAt }),
      });
      return response.data || null;
    } catch (error) {
      console.error('Failed to assign role to user:', error);
      return null;
    }
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    try {
      await this.request<{ success: boolean }>(`/users/${userId}/roles/${roleId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Failed to remove role from user:', error);
      return false;
    }
  }

  // Admin TopUp (SYSTEM source)
  async adminTopUp(payload: {
    accountId: string;
    amount: number;
    currency?: string;
    reason?: string;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await this.request<{ success: boolean; data?: any; message?: string }>(
        '/admin/transactions/topup',
        {
          method: 'POST',
          body: JSON.stringify({ ...payload }),
        }
      );
      return response;
    } catch (error) {
      console.error('Failed to topup:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Topup failed' };
    }
  }

  async getUserAccounts(userId: string): Promise<Account[]> {
    try {
      const response = await this.request<{ success: boolean; data: Account[] }>(`/banking/users/${userId}/accounts`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch user accounts:', error);
      return [];
    }
  }

  async updateUserProfile(id: string, payload: Partial<{ dateOfBirth: string | null; studentId: string | null; cohort: string | null; school: string | null; }>): Promise<any> {
    try {
      const response = await this.request<{ success: boolean; data: any }>(`/admin/users/${id}/profile`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return response.data || null;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return null;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      console.log('🌐 getCurrentUser - Making request to /auth/me');
      const response = await this.request<{ success: boolean; data: User }>('/auth/me');
      console.log('🌐 getCurrentUser - Raw response:', response);
      console.log('🌐 getCurrentUser - response.data:', response.data);
      console.log('🌐 getCurrentUser - response.data.userRoles:', response.data?.userRoles);
      console.log('🌐 getCurrentUser - Returning:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  }

  setToken(token: string): void {
    this.token = token;
  }

  // Logout
  logout(): void {
    this.token = null;
    localStorage.removeItem('adminToken');
  }

  // Tier Upgrade Requests
  async getTierUpgradeRequests(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<{
    requests: Array<any>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && status !== 'ALL' && { status }),
      });

      const response = await this.request<{ success: boolean; data: { requests: any[]; total: number; page: number; limit: number; totalPages: number } }>(
        `/admin/tier-upgrade-requests?${params}`
      );

      return {
        requests: response.data.requests || [],
        total: response.data.total || 0,
        page: response.data.page || page,
        limit: response.data.limit || limit,
        totalPages: response.data.totalPages || 0,
      };
    } catch (error) {
      console.error('Failed to fetch tier upgrade requests:', error);
      return {
        requests: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  async approveTierUpgrade(requestId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.request<{ success: boolean; message: string }>(
        `/admin/tier-upgrade-requests/${requestId}/approve`,
        {
          method: 'POST',
        }
      );
      return response;
    } catch (error) {
      console.error('Failed to approve tier upgrade:', error);
      throw error;
    }
  }

  async rejectTierUpgrade(requestId: string, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.request<{ success: boolean; message: string }>(
        `/admin/tier-upgrade-requests/${requestId}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
        }
      );
      return response;
    } catch (error) {
      console.error('Failed to reject tier upgrade:', error);
      throw error;
    }
  }

  // Notifications
  async createNotification(payload: {
    title: string;
    content: string;
    receiverIds: string[];
    type?: string;
    priority?: string;
    category?: string;
    relatedType?: string;
    relatedId?: string;
  }): Promise<{ success: boolean; message?: string; data?: any[] }> {
    try {
      const response = await this.request<{ success: boolean; message?: string; data?: any[] }>(
        '/notifications',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      return response;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  async getNotifications(params?: {
    type?: string;
    priority?: string;
    category?: string;
    isRead?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{
    notifications: Array<any>;
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.type) searchParams.append('type', params.type);
      if (params?.priority) searchParams.append('priority', params.priority);
      if (params?.category) searchParams.append('category', params.category);
      if (params?.isRead !== undefined) searchParams.append('isRead', String(params.isRead));
      if (params?.limit) searchParams.append('limit', String(params.limit));
      if (params?.offset !== undefined) searchParams.append('offset', String(params.offset));

      const queryString = searchParams.toString();
      // Use admin endpoint to get all notifications
      const response = await this.request<{
        success: boolean;
        data: {
          notifications: Array<any>;
          total: number;
          limit: number;
          offset: number;
        };
      }>(`/admin/notifications${queryString ? `?${queryString}` : ''}`);
      
      return response.data || { notifications: [], total: 0, limit: 20, offset: 0 };
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return { notifications: [], total: 0, limit: 20, offset: 0 };
    }
  }

  async getUnreadNotificationCount(): Promise<number> {
    try {
      const response = await this.request<{ success: boolean; data: { count: number } }>(
        '/notifications/unread-count'
      );
      return response.data?.count || 0;
    } catch (error) {
      console.error('Failed to get unread notification count:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;