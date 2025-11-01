import React from 'react';
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

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  filters: TransactionFilters;
  accounts: Array<{ accountId: string; accountName: string }>;
  selectedTransaction: Transaction | null;
  detailDialogOpen: boolean;
  onFilterChange: (field: string, value: any) => void;
  onClearFilters: () => void;
  onViewDetails: (transaction: Transaction) => void;
  onCancelTransaction: (transactionId: string) => void;
  onCloseDetailModal: () => void;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (dateString: string) => string;
  getTransactionIcon: (type: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  getTypeColor: (type: string) => string;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  loading,
  error,
  filters,
  accounts,
  selectedTransaction,
  detailDialogOpen,
  onFilterChange,
  onClearFilters,
  onViewDetails,
  onCancelTransaction,
  onCloseDetailModal,
  formatCurrency,
  formatDate,
  getTransactionIcon,
  getStatusColor,
  getTypeColor
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <TransactionFilters
        filters={filters}
        accounts={accounts}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
      />

      {/* Transactions Table */}
      <TransactionTable
        transactions={transactions}
        onViewDetails={onViewDetails}
        onCancelTransaction={onCancelTransaction}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        getTransactionIcon={getTransactionIcon}
        getStatusColor={getStatusColor}
        getTypeColor={getTypeColor}
      />

      {/* Empty State */}
      {transactions.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No transactions found</h3>
          <p className="text-gray-500">Try adjusting your filters or check back later.</p>
        </div>
      )}

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        open={detailDialogOpen}
        onClose={onCloseDetailModal}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        getStatusColor={getStatusColor}
        getTypeColor={getTypeColor}
      />
    </div>
  );
};

export default TransactionList; 