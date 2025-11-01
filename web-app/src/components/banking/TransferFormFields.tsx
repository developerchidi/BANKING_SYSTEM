import React from 'react';
import Input from '../ui/Input';

interface Account {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  balance: number;
  availableBalance: number;
  currency: string;
}

interface Beneficiary {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
}

interface TransferFormFieldsProps {
  formData: {
    fromAccountId: string;
    toAccountId: string;
    toAccountNumber: string;
    amount: string;
    description: string;
    transferType: string;
  };
  accounts: Account[];
  beneficiaries: Beneficiary[];
  externalAccountName: string | null;
  checkingAccount: boolean;
  error: string | null;
  onInputChange: (field: string, value: string) => void;
  formatCurrency: (amount: number, currency: string) => string;
}

const TransferFormFields: React.FC<TransferFormFieldsProps> = ({
  formData,
  accounts,
  beneficiaries,
  externalAccountName,
  checkingAccount,
  error,
  onInputChange,
  formatCurrency
}) => {
  return (
    <div className="space-y-8">
      {/* From Account */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">From Account</label>
          <select
            value={formData.fromAccountId}
            onChange={(e) => onInputChange('fromAccountId', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Select account</option>
            {accounts.map((account) => (
              <option key={account.accountId} value={account.accountId}>
                {account.accountName} - {account.accountNumber} ({formatCurrency(account.availableBalance, account.currency)})
              </option>
            ))}
          </select>
        </div>

        {/* To Account */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">To Account</label>
          {formData.transferType === 'internal' ? (
            <select
              value={formData.toAccountId}
              onChange={(e) => onInputChange('toAccountId', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Select account</option>
              {accounts
                .filter(account => account.accountId !== formData.fromAccountId)
                .map((account) => (
                  <option key={account.accountId} value={account.accountId}>
                    {account.accountName} - {account.accountNumber}
                  </option>
                ))}
            </select>
          ) : formData.transferType === 'beneficiary' ? (
            <select
              value={formData.toAccountId}
              onChange={(e) => onInputChange('toAccountId', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Select beneficiary</option>
              {beneficiaries.map((beneficiary) => (
                <option key={beneficiary.id} value={beneficiary.id}>
                  {beneficiary.name} - {beneficiary.accountNumber}
                </option>
              ))}
            </select>
          ) : (
            <div>
              <Input
                type="text"
                value={formData.toAccountNumber}
                onChange={(e) => onInputChange('toAccountNumber', e.target.value)}
                placeholder="Enter recipient's account number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {checkingAccount && (
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Checking account...
                </div>
              )}
              {externalAccountName && !checkingAccount && (
                <div className="flex items-center text-sm text-green-600 mt-2">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Recipient: {externalAccountName}
                </div>
              )}
              {error && formData.transferType === 'external' && !checkingAccount && !externalAccountName && (
                <div className="flex items-center text-sm text-red-600 mt-2">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Amount and Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-gray-500 text-lg">$</span>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => onInputChange('amount', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Description (Optional)</label>
          <Input
            type="text"
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            placeholder="Enter transfer description"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );
};

export default TransferFormFields; 