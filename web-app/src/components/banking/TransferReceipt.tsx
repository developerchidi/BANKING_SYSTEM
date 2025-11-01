import React from 'react';
import Button from '../ui/Button';

interface Account {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  balance: number;
  availableBalance: number;
  currency: string;
}

interface TransferReceiptData {
  transactionId: string;
  transactionNumber: string;
  fromAccount: Account;
  toAccount?: Account;
  toAccountName?: string;
  toAccountNumber?: string;
  amount: number;
  fee: number;
  totalAmount: number;
  description: string;
  transferType: string;
  timestamp: string;
  status: string;
}

interface TransferReceiptProps {
  transferReceipt: TransferReceiptData;
  onMakeAnotherTransfer: () => void;
  onGoToDashboard: () => void;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (dateString: string) => string;
}

const TransferReceipt: React.FC<TransferReceiptProps> = ({
  transferReceipt,
  onMakeAnotherTransfer,
  onGoToDashboard,
  formatCurrency,
  formatDate
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="bg-gray-50 rounded-xl p-8 mb-8">
        <div className="text-center mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Transaction Receipt</h4>
          <p className="text-sm text-gray-500">Transaction ID: {transferReceipt.transactionId || 'N/A'}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Transfer Details</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">From Account:</span>
                  <span className="font-medium text-gray-900">{transferReceipt.fromAccount?.accountName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Number:</span>
                  <span className="font-medium text-gray-900">{transferReceipt.fromAccount?.accountNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transfer Type:</span>
                  <span className="font-medium text-gray-900 capitalize">{transferReceipt.transferType || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Recipient Details</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipient:</span>
                  <span className="font-medium text-gray-900">
                    {transferReceipt.toAccountName || transferReceipt.toAccount?.accountName || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Number:</span>
                  <span className="font-medium text-gray-900">
                    {transferReceipt.toAccountNumber || transferReceipt.toAccount?.accountNumber || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Transaction Summary</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-gray-900">
                    {typeof transferReceipt.amount === 'number' && transferReceipt.fromAccount?.currency ? formatCurrency(transferReceipt.amount, transferReceipt.fromAccount.currency) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee:</span>
                  <span className="text-gray-900">
                    {typeof transferReceipt.fee === 'number' && transferReceipt.fromAccount?.currency ? formatCurrency(transferReceipt.fee, transferReceipt.fromAccount.currency) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="font-bold text-lg text-gray-900">
                    {typeof transferReceipt.totalAmount === 'number' && transferReceipt.fromAccount?.currency ? formatCurrency(transferReceipt.totalAmount, transferReceipt.fromAccount.currency) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Transaction Info</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="font-medium text-gray-900">{transferReceipt.timestamp ? formatDate(transferReceipt.timestamp) : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">{transferReceipt.status || 'N/A'}</span>
                </div>
                {transferReceipt.description && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Description:</span>
                    <span className="font-medium text-gray-900">{transferReceipt.description}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
        <Button 
          onClick={onMakeAnotherTransfer} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors font-semibold hover:shadow-lg transform hover:scale-105"
        >
          Make Another Transfer
        </Button>
        <Button
          onClick={onGoToDashboard}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg transition-colors font-semibold hover:shadow-lg transform hover:scale-105"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default TransferReceipt; 