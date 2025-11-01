import React from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Modal from '../ui/Modal';

interface Account {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  balance: number;
  availableBalance: number;
  currency: string;
  isActive: boolean;
  isFrozen: boolean;
}

interface CreateAccountData {
  accountType: string;
  accountName: string;
  currency: string;
  dailyLimit?: number;
  monthlyLimit?: number;
}

interface AccountListProps {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  createDialogOpen: boolean;
  createForm: CreateAccountData;
  creating: boolean;
  onToggleFreeze: (accountId: string, freeze: boolean) => void;
  onCreateAccount: () => void;
  onFormChange: (field: keyof CreateAccountData, value: string | number) => void;
  onCreateDialogToggle: (open: boolean) => void;
  formatCurrency: (amount: number, currency: string) => string;
  getAccountTypeColor: (type: string) => string;
  getAccountTypeIcon: (type: string) => React.ReactNode;
}

const AccountList: React.FC<AccountListProps> = ({
  accounts,
  loading,
  error,
  createDialogOpen,
  createForm,
  creating,
  onToggleFreeze,
  onCreateAccount,
  onFormChange,
  onCreateDialogToggle,
  formatCurrency,
  getAccountTypeColor,
  getAccountTypeIcon
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
      {/* Header */}
      {/* <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Accounts</h2>
          <p className="text-gray-600">Manage your banking accounts</p>
        </div>
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>New Account</span>
        </button>
      </div> */}

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

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <Card key={account.accountId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  {getAccountTypeIcon(account.accountType)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{account.accountName}</h3>
                  <p className="text-sm text-gray-500">{account.accountNumber}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => onToggleFreeze(account.accountId, !account.isFrozen)}
                  className={`p-2 rounded-lg transition-colors ${
                    account.isFrozen 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={account.isFrozen ? 'Unfreeze Account' : 'Freeze Account'}
                >
                  {account.isFrozen ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccountTypeColor(account.accountType)}`}>
                  {account.accountType.replace('_', ' ')}
                </span>
                {account.isFrozen && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    FROZEN
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Balance:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(account.balance, account.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Available:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(account.availableBalance, account.currency)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${account.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {account.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {accounts.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts yet</h3>
          <p className="text-gray-600 mb-6">Create your first account to get started</p>
          <button
            onClick={() => onCreateDialogToggle(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Create Account
          </button>
        </div>
      )}

      {/* Create Account Dialog */}
      <Modal open={createDialogOpen} onClose={() => onCreateDialogToggle(false)} title="Tạo tài khoản mới">
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <select
                value={createForm.accountType}
                onChange={(e) => onFormChange('accountType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[
                  { value: 'SAVINGS', label: 'Savings Account' },
                  { value: 'CHECKING', label: 'Checking Account' },
                  { value: 'FIXED_DEPOSIT', label: 'Fixed Deposit' },
                ].map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
              <Input
                type="text"
                value={createForm.accountName}
                onChange={(e) => onFormChange('accountName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter account name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={createForm.currency}
                onChange={(e) => onFormChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[
                  { value: 'USD', label: 'US Dollar ($)' },
                  { value: 'EUR', label: 'Euro (€)' },
                  { value: 'GBP', label: 'British Pound (£)' },
                  { value: 'JPY', label: 'Japanese Yen (¥)' },
                ].map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Daily Limit</label>
                              <Input
                type="number"
                value={createForm.dailyLimit}
                onChange={(e) => onFormChange('dailyLimit', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Limit</label>
                              <Input
                type="number"
                value={createForm.monthlyLimit}
                onChange={(e) => onFormChange('monthlyLimit', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => onCreateDialogToggle(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onCreateAccount}
              disabled={creating || !createForm.accountName}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AccountList; 