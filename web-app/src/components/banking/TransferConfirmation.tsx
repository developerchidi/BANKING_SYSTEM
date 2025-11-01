import React from 'react';
import Button from '../ui/Button';

interface TransferConfirmationProps {
  transferDetails: any;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  formatCurrency: (amount: number, currency: string) => string;
}

const TransferConfirmation: React.FC<TransferConfirmationProps> = ({
  transferDetails,
  loading,
  onConfirm,
  onCancel,
  formatCurrency
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Confirm Transfer</h3>
          <p className="text-gray-600">Please review the details below</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-gray-600 font-medium">From:</span>
                <p className="font-semibold text-gray-900">{transferDetails.fromAccount?.accountName}</p>
                <p className="text-gray-500">{transferDetails.fromAccount?.accountNumber}</p>
              </div>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-gray-600 font-medium">To:</span>
                {transferDetails.transferType === 'external' ? (
                  <>
                    <p className="font-semibold text-gray-900">{transferDetails.externalAccountName || transferDetails.toAccountNumber}</p>
                    <p className="text-gray-500">{transferDetails.toAccountNumber}</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-900">{transferDetails.toAccount?.accountName}</p>
                    <p className="text-gray-500">{transferDetails.toAccount?.accountNumber}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold text-gray-900 text-lg">
                {formatCurrency(transferDetails.amount, transferDetails.fromAccount?.currency || 'USD')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Fee:</span>
              <span className="text-gray-900">
                {formatCurrency(transferDetails.fee, transferDetails.fromAccount?.currency || 'USD')}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="font-semibold text-gray-900 text-lg">Total:</span>
              <span className="font-bold text-xl text-gray-900">
                {formatCurrency(transferDetails.totalAmount, transferDetails.fromAccount?.currency || 'USD')}
              </span>
            </div>
          </div>
        </div>

        {transferDetails.description && (
          <div className="bg-blue-50 rounded-lg p-4">
            <span className="text-gray-600 font-medium">Description:</span>
            <p className="text-gray-900 mt-1">{transferDetails.description}</p>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4 mt-8">
        <Button
          onClick={onCancel}
          className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            </div>
          ) : (
            'Confirm Transfer'
          )}
        </Button>
      </div>
    </div>
  );
};

export default TransferConfirmation; 