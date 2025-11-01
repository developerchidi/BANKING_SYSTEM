import React from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface CreateAccountData {
  accountType: string;
  accountName: string;
  currency: string;
  dailyLimit?: number;
  monthlyLimit?: number;
}

interface CreateAccountModalProps {
  open: boolean;
  onClose: () => void;
  createForm: CreateAccountData;
  onFormChange: (field: keyof CreateAccountData, value: string | number) => void;
  onCreateAccount: () => void;
  creating: boolean;
}

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  open,
  onClose,
  createForm,
  onFormChange,
  onCreateAccount,
  creating
}) => {
  const accountTypes = [
    { value: 'SAVINGS', label: 'Savings Account' },
    { value: 'CHECKING', label: 'Checking Account' },
    { value: 'FIXED_DEPOSIT', label: 'Fixed Deposit' },
  ];

  const currencies = [
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'JPY', label: 'Japanese Yen (¥)' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Tạo tài khoản mới">
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
            <select
              value={createForm.accountType}
              onChange={(e) => onFormChange('accountType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {accountTypes.map((type) => (
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
              {currencies.map((currency) => (
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
          <Button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={onCreateAccount}
            disabled={creating || !createForm.accountName}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create Account'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateAccountModal; 