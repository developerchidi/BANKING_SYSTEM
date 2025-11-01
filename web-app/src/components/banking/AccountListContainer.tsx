import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AccountList from './AccountList';

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

const AccountListContainer: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAccountData>({
    accountType: 'SAVINGS',
    accountName: '',
    currency: 'USD',
    dailyLimit: 1000,
    monthlyLimit: 10000,
  });
  const [creating, setCreating] = useState(false);

  // Business Logic Functions
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://192.168.31.39:3001/api/banking/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }

      const data = await response.json();
      setAccounts(data.data.accounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async () => {
    try {
      setCreating(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://192.168.31.39:3001/api/banking/accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create account');
      }

      const data = await response.json();
      setAccounts([...accounts, data.data.account]);
      setCreateDialogOpen(false);
      setCreateForm({
        accountType: 'SAVINGS',
        accountName: '',
        currency: 'USD',
        dailyLimit: 1000,
        monthlyLimit: 10000,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setCreating(false);
    }
  };

  const toggleAccountFreeze = async (accountId: string, freeze: boolean) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://192.168.31.39:3001/api/banking/accounts/${accountId}/freeze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          freeze,
          reason: freeze ? 'User requested freeze' : 'User requested unfreeze',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update account status');
      }

      // Update local state
      setAccounts(accounts.map(account => 
        account.accountId === accountId 
          ? { ...account, isFrozen: freeze }
          : account
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account status');
    }
  };

  const handleFormChange = (field: keyof CreateAccountData, value: string | number) => {
    setCreateForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateDialogToggle = (open: boolean) => {
    setCreateDialogOpen(open);
    if (!open) {
      setCreateForm({
        accountType: 'SAVINGS',
        accountName: '',
        currency: 'USD',
        dailyLimit: 1000,
        monthlyLimit: 10000,
      });
    }
  };

  // Utility Functions
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'SAVINGS':
        return 'bg-green-100 text-green-800';
      case 'CHECKING':
        return 'bg-blue-100 text-blue-800';
      case 'FIXED_DEPOSIT':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'SAVINGS':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'CHECKING':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'FIXED_DEPOSIT':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
    }
  };

  // Effects
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Pass all data and handlers to the presentational component
  return (
    <AccountList
      accounts={accounts}
      loading={loading}
      error={error}
      createDialogOpen={createDialogOpen}
      createForm={createForm}
      creating={creating}
      onToggleFreeze={toggleAccountFreeze}
      onCreateAccount={createAccount}
      onFormChange={handleFormChange}
      onCreateDialogToggle={handleCreateDialogToggle}
      formatCurrency={formatCurrency}
      getAccountTypeColor={getAccountTypeColor}
      getAccountTypeIcon={getAccountTypeIcon}
    />
  );
};

export default AccountListContainer; 