import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import TransactionList from './TransactionList';
import TransactionFilters from './TransactionFilters';
import TransactionTable from './TransactionTable';
import TransactionDetailModal from './TransactionDetailModal';

interface Transaction {
  id: string;
  transactionNumber: string;
  type: string;
  category: string;
  amount: number;
  fee: number;
  currency: string;
  description: string | null;
  status: string;
  createdAt: string;
  senderAccount?: {
    accountNumber: string;
    accountName: string;
  };
  receiverAccount?: {
    accountNumber: string;
    accountName: string;
  };
}

interface TransactionFilters {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  type?: string;
  status?: string;
  accountId?: string;
}

const TransactionListContainer: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });
  const [accounts, setAccounts] = useState<Array<{ accountId: string; accountName: string }>>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Business Logic Functions
  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://192.168.31.39:3001/api/banking/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAccounts(data.data.accounts.map((acc: any) => ({
          accountId: acc.accountId,
          accountName: acc.accountName,
        })));
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`http://192.168.31.39:3001/api/banking/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.data.transactions);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const cancelTransaction = async (transactionId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://192.168.31.39:3001/api/banking/transactions/${transactionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'User requested cancellation',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel transaction');
      }

      // Refresh transactions
      fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel transaction');
    }
  };

  const handleFilterChange = (field: keyof TransactionFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
    });
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailDialogOpen(false);
    setSelectedTransaction(null);
  };

  // Utility Functions
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'TRANSFER':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'DEPOSIT':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'WITHDRAWAL':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      case 'PAYMENT':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TRANSFER':
        return 'bg-blue-100 text-blue-800';
      case 'DEPOSIT':
        return 'bg-green-100 text-green-800';
      case 'WITHDRAWAL':
        return 'bg-orange-100 text-orange-800';
      case 'PAYMENT':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Effects
  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  // Pass all data and handlers to the presentational component
  return (
    <TransactionList
      transactions={transactions}
      loading={loading}
      error={error}
      filters={filters}
      accounts={accounts}
      selectedTransaction={selectedTransaction}
      detailDialogOpen={detailDialogOpen}
      onFilterChange={handleFilterChange}
      onClearFilters={clearFilters}
      onViewDetails={handleViewDetails}
      onCancelTransaction={cancelTransaction}
      onCloseDetailModal={handleCloseDetailModal}
      formatCurrency={formatCurrency}
      formatDate={formatDate}
      getTransactionIcon={getTransactionIcon}
      getStatusColor={getStatusColor}
      getTypeColor={getTypeColor}
    />
  );
};

export default TransactionListContainer; 