import React from 'react';
import Modal from '../ui/Modal';

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

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
  getTypeColor: (type: string) => string;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  open,
  onClose,
  formatCurrency,
  formatDate,
  getStatusColor,
  getTypeColor
}) => {
  if (!transaction) return null;

  return (
    <Modal open={open} onClose={onClose} title="Transaction Details" className="max-w-2xl">
      <div className="space-y-6">
        {/* Transaction Header */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{transaction.transactionNumber}</h3>
              <p className="text-sm text-gray-600">{transaction.description || 'No description'}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(transaction.amount, transaction.currency)}
              </div>
              {transaction.fee > 0 && (
                <div className="text-sm text-gray-500">
                  Fee: {formatCurrency(transaction.fee, transaction.currency)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Transaction Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                    {transaction.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium text-gray-900">{transaction.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium text-gray-900">{formatDate(transaction.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Account Information</h4>
              <div className="space-y-3">
                {transaction.senderAccount && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">From Account:</div>
                    <div className="font-medium text-gray-900">{transaction.senderAccount.accountName}</div>
                    <div className="text-sm text-gray-500">{transaction.senderAccount.accountNumber}</div>
                  </div>
                )}
                {transaction.receiverAccount && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">To Account:</div>
                    <div className="font-medium text-gray-900">{transaction.receiverAccount.accountName}</div>
                    <div className="text-sm text-gray-500">{transaction.receiverAccount.accountNumber}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(transaction.amount + transaction.fee, transaction.currency)}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TransactionDetailModal; 