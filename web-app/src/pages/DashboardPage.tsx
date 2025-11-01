import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TransferForm from '../components/banking/TransferForm';
import InternalTransferModal from '../components/ui/InternalTransferModal';
import ExternalTransferModal from '../components/ui/ExternalTransferModal';
import BeneficiaryTransferModal from '../components/ui/BeneficiaryTransferModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../components/ui/Card';

interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  transactionCount: number;
  loading: boolean;
  error: string | null;
  currency?: string;
}

interface Transaction {
  id: string;
  transactionNumber: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  description?: string;
  fee?: number;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    transactionCount: 0,
    loading: true,
    error: null,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [showInternalModal, setShowInternalModal] = useState(false);
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);

  // Tính toán dữ liệu biểu đồ từ transactions
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch accounts for balance
      const accountsResponse = await fetch('http://192.168.31.39:3001/api/banking/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Fetch transactions for stats
      const transactionsResponse = await fetch('http://192.168.31.39:3001/api/banking/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let totalBalance = 0;
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        totalBalance = accountsData.data.accounts.reduce((sum: number, account: any) => sum + account.balance, 0);
      }

      let monthlyIncome = 0;
      let monthlyExpenses = 0;
      let transactionCount = 0;
      let recentTx: Transaction[] = [];
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        const transactions = transactionsData.data.transactions;
        transactionCount = transactions.length;
        recentTx = transactions.slice(0, 5);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        transactions.forEach((transaction: any) => {
          const transactionDate = new Date(transaction.createdAt);
          if (transactionDate.getMonth() === currentMonth && 
              transactionDate.getFullYear() === currentYear) {
            if (transaction.type === 'DEPOSIT' || transaction.type === 'CREDIT') {
              monthlyIncome += transaction.amount;
            }
            if (
              transaction.type === 'WITHDRAWAL' ||
              transaction.type === 'DEBIT' ||
              transaction.type === 'PAYMENT' ||
              transaction.type === 'TRANSFER'
            ) {
              monthlyExpenses += transaction.amount + (transaction.fee || 0);
            }
          }
        });
      }
      setStats({
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        transactionCount,
        loading: false,
        error: null,
      });
      setRecentTransactions(recentTx);
    } catch (error) {
      setStats(prev => ({
        ...prev,
        loading: false,
        error: `Failed to load dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }));
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    // Sau khi fetchDashboardStats xong, lấy transactions để tính chartData
    const fetchAndProcessChartData = async () => {
      const token = localStorage.getItem('accessToken');
      const transactionsResponse = await fetch('http://192.168.31.39:3001/api/banking/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        const transactions = transactionsData.data.transactions;
        // Group by month
        const months = Array.from({ length: 12 }, (_, i) => ({
          month: new Date(0, i).toLocaleString('en-US', { month: 'short' }),
          income: 0,
          expenses: 0,
          net: 0,
        }));
        transactions.forEach((tx: any) => {
          const date = new Date(tx.createdAt);
          const m = date.getMonth();
          // Income
          if (tx.type === 'DEPOSIT' || tx.type === 'CREDIT') {
            months[m].income += tx.amount;
          }
          // Expenses
          if (
            tx.type === 'WITHDRAWAL' || tx.type === 'DEBIT' || tx.type === 'PAYMENT' || tx.type === 'TRANSFER'
          ) {
            months[m].expenses += tx.amount + (tx.fee || 0);
          }
        });
        months.forEach(m => m.net = m.income - m.expenses);
        setChartData(months);
      }
    };
    fetchAndProcessChartData();
  }, [stats.transactionCount]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat(
      currency === 'VND' ? 'vi-VN' : 'en-US',
      {
        style: 'currency',
        currency,
      }
    ).format(amount);
  };

  if (stats.loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      {/* <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Banking Dashboard</h1>
        <p className="text-gray-600 mb-6">
          Manage your accounts, view transactions, and transfer money securely.
        </p>
        {stats.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{stats.error}</p>
              </div>
            </div>
          </div>
        )}
      </div> */}

      {/* Stats widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Balance */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBalance, stats.currency)}</p>
            </div>
          </div>
        </Card>
        {/* Monthly Income */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Income</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.monthlyIncome, stats.currency)}</p>
            </div>
          </div>
        </Card>
        {/* Monthly Expenses */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Expenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.monthlyExpenses, stats.currency)}</p>
            </div>
          </div>
        </Card>
        {/* Recent Transactions */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.transactionCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quick Transfer Actions */}
        <Card className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          
          {/* Quick Transfer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Internal Transfer */}
            <button
              onClick={() => setShowInternalModal(true)}
              className="group relative bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 text-left transition-all duration-200 hover:shadow-lg hover:scale-105 hover:border-blue-300"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">Internal Transfer</h4>
                  <p className="text-sm text-gray-600">Between your accounts</p>
                  <p className="text-xs text-orange-600 font-medium mt-1">Small fee</p>
                </div>
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* External Transfer */}
            <button
              onClick={() => setShowExternalModal(true)}
              className="group relative bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6 text-left transition-all duration-200 hover:shadow-lg hover:scale-105 hover:border-orange-300"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">External Transfer</h4>
                  <p className="text-sm text-gray-600">To other accounts</p>
                  <p className="text-xs text-orange-600 font-medium mt-1">Small fee</p>
                </div>
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Beneficiary Transfer */}
            <button
              onClick={() => setShowBeneficiaryModal(true)}
              className="group relative bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 text-left transition-all duration-200 hover:shadow-lg hover:scale-105 hover:border-green-300"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">Beneficiary</h4>
                  <p className="text-sm text-gray-600">Saved recipients</p>
                  <p className="text-xs text-orange-600 font-medium mt-1">Small fee</p>
                </div>
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(stats.monthlyIncome, stats.currency)}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Spent</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(stats.monthlyExpenses, stats.currency)}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Net</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(stats.monthlyIncome - stats.monthlyExpenses, stats.currency)}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Transactions Widget */}
        <Card className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          {recentTransactions.length === 0 ? (
            <div className="text-gray-500">No recent transactions.</div>
          ) : (
            recentTransactions.length > 4 ? (
              <div className="max-h-64 overflow-y-auto">
                <ul className="divide-y divide-gray-200">
                  {recentTransactions.map(tx => (
                    <li key={tx.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{tx.transactionNumber}</div>
                        <div className="text-xs text-gray-500">{tx.description || tx.type}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-semibold ${tx.type === 'DEPOSIT' || tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>{tx.type === 'DEPOSIT' || tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount + (tx.fee || 0), tx.currency)}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{tx.status}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {recentTransactions.map(tx => (
                  <li key={tx.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{tx.transactionNumber}</div>
                      <div className="text-xs text-gray-500">{tx.description || tx.type}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-semibold ${tx.type === 'DEPOSIT' || tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>{tx.type === 'DEPOSIT' || tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount + (tx.fee || 0), tx.currency)}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{tx.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}
        </Card>
      </div>

      {/* Chart tổng quan thu/chi/lợi nhuận */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Overview</h3>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value, stats.currency)} />
              <Legend />
              <Bar dataKey="income" fill="#22c55e" name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              <Bar dataKey="net" fill="#3b82f6" name="Net" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Internal Transfer Modal */}
      <InternalTransferModal open={showInternalModal} onClose={() => setShowInternalModal(false)} />
      {/* External Transfer Modal */}
      <ExternalTransferModal open={showExternalModal} onClose={() => setShowExternalModal(false)} />
      {/* Beneficiary Transfer Modal */}
      <BeneficiaryTransferModal open={showBeneficiaryModal} onClose={() => setShowBeneficiaryModal(false)} />
    </div>
  );
};

export default DashboardPage; 