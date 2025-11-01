import React from 'react';
import Button from '../ui/Button';

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

interface TransactionTableProps {
  transactions: Transaction[];
  onViewDetails: (transaction: Transaction) => void;
  onCancelTransaction: (transactionId: string) => void;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (dateString: string) => string;
  getTransactionIcon: (type: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  getTypeColor: (type: string) => string;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onViewDetails,
  onCancelTransaction,
  formatCurrency,
  formatDate,
  getTransactionIcon,
  getStatusColor,
  getTypeColor
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center" title={transaction.type}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.transactionNumber}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-[180px]" title={transaction.description || 'No description'}>
                        {transaction.description && transaction.description.length > 30
                          ? transaction.description.slice(0, 30) + '...'
                          : (transaction.description || 'No description')}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>{transaction.type}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-sm font-medium text-gray-900">{formatCurrency(transaction.amount, transaction.currency)}</div>
                  {transaction.fee > 0 && (
                    <div className="text-sm text-gray-500">Fee: {formatCurrency(transaction.fee, transaction.currency)}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>{transaction.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">{formatDate(transaction.createdAt)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                  <div className="flex space-x-2">
                    <Button onClick={() => onViewDetails(transaction)} className="text-blue-600 hover:text-blue-900 p-1 rounded" title="View Details">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </Button>
                    {transaction.status === 'PENDING' && (
                      <Button onClick={() => onCancelTransaction(transaction.id)} className="text-red-600 hover:text-red-900 p-1 rounded" title="Cancel Transaction">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable; 