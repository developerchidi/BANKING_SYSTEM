import React from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';

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

interface AccountCardProps {
  account: Account;
  onToggleFreeze: (accountId: string, freeze: boolean) => void;
  formatCurrency: (amount: number, currency: string) => string;
  getAccountTypeColor: (type: string) => string;
  getAccountTypeIcon: (type: string) => React.ReactNode;
}

const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onToggleFreeze,
  formatCurrency,
  getAccountTypeColor,
  getAccountTypeIcon
}) => {
  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
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
  );
};

export default AccountCard; 