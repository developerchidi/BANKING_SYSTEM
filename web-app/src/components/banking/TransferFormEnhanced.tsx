import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

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

interface TransferReceipt {
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

const TransferFormEnhanced: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    toAccountNumber: '', // for external
    amount: '',
    description: '',
    transferType: 'internal', // internal, external, beneficiary
  });

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  // Data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [externalAccountName, setExternalAccountName] = useState<string | null>(null);
  const [checkingAccount, setCheckingAccount] = useState(false);

  // Confirmation dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [transferDetails, setTransferDetails] = useState<any>(null);
  const [transferReceipt, setTransferReceipt] = useState<TransferReceipt | null>(null);

  const steps = ['Transfer Details', 'Review & Confirm', 'OTP Verification', 'Receipt'];

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://192.168.31.39:3001/api/banking/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAccounts(data.data.accounts);
        if (data.data.accounts.length > 0) {
          setFormData(prev => ({ ...prev, fromAccountId: data.data.accounts[0].accountId }));
        }
      }
    } catch (err) {
      setError('Failed to fetch accounts');
    }
  };

  const fetchBeneficiaries = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://192.168.31.39:3001/api/banking/beneficiaries', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBeneficiaries(data.data.beneficiaries);
      }
    } catch (err) {
      console.error('Failed to fetch beneficiaries:', err);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchBeneficiaries();
  }, []);

  // Check external account name when toAccountNumber changes
  useEffect(() => {
    const checkAccount = async () => {
      if (formData.transferType === 'external' && formData.toAccountNumber.length > 0) {
        setCheckingAccount(true);
        setExternalAccountName(null);
        setError(null);
        try {
          const token = localStorage.getItem('accessToken');
          const res = await fetch(`http://192.168.31.39:3001/api/banking/accounts/lookup?accountNumber=${formData.toAccountNumber}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (res.ok) {
            const data = await res.json();
            setExternalAccountName(data.data.account.accountName);
          } else {
            setExternalAccountName(null);
            setError('Account not found');
          }
        } catch (err) {
          setExternalAccountName(null);
          setError('Error looking up account');
        } finally {
          setCheckingAccount(false);
        }
      } else {
        setExternalAccountName(null);
      }
    };
    checkAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.toAccountNumber, formData.transferType]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const validateForm = () => {
    if (!formData.fromAccountId) {
      setError('Please select a source account');
      return false;
    }
    if (formData.transferType === 'internal' && !formData.toAccountId) {
      setError('Please select a destination account');
      return false;
    }
    if (formData.transferType === 'external' && !formData.toAccountNumber) {
      setError('Please enter a destination account number');
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    if (formData.transferType === 'internal' && formData.fromAccountId === formData.toAccountId) {
      setError('Source and destination accounts cannot be the same');
      return false;
    }
    return true;
  };

  const calculateFee = useCallback((amount: number, transferType: string) => {
    // Đồng bộ với BE: tất cả transfer đều có fee
    switch (transferType) {
      case 'internal':
      case 'external':
      case 'beneficiary':
        return amount > 1000 ? 5.00 : 2.00;
      default:
        return 0;
    }
  }, []);

  const handleNext = () => {
    if (activeStep === 0) {
      if (!validateForm()) return;
      
      const amount = parseFloat(formData.amount);
      const fee = calculateFee(amount, formData.transferType);
      const totalAmount = amount + fee;
      
      const fromAccount = accounts.find(acc => acc.accountId === formData.fromAccountId);
      const toAccount = accounts.find(acc => acc.accountId === formData.toAccountId);
      let toAccountName = '';
      if (formData.transferType === 'external') {
        toAccountName = externalAccountName || formData.toAccountNumber;
      } else if (formData.transferType === 'internal') {
        toAccountName = toAccount?.accountName || '';
      }
      if (fromAccount && totalAmount > fromAccount.availableBalance) {
        setError(`Insufficient funds. Available: ${fromAccount.availableBalance}, Required: ${totalAmount}`);
        return;
      }
      setTransferDetails({
        fromAccount,
        toAccount,
        toAccountName,
        amount,
        fee,
        totalAmount,
        description: formData.description,
        transferType: formData.transferType,
        toAccountNumber: formData.toAccountNumber,
        externalAccountName,
      });
      setConfirmDialogOpen(true);
    }
  };

  const handleTransfer = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Step 1: Create pending transfer and send OTP
      if (activeStep === 1) {
        const payload: any = {
          fromAccountId: formData.fromAccountId,
          amount: formData.amount,
          description: formData.description,
          transferType: formData.transferType,
        };
        if (formData.transferType === 'internal' || formData.transferType === 'beneficiary') {
          payload.toAccountId = formData.toAccountId;
        }
        if (formData.transferType === 'external') {
          payload.toAccountNumber = formData.toAccountNumber;
        }
        
        const response = await fetch('http://192.168.31.39:3001/api/banking/transfer', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        const data = await response.json();
        if (!response.ok) {
          setError(data.message || 'Transfer failed');
          setLoading(false);
          return;
        }
        
        // TEMPORARY: Transfer completed immediately (no OTP required)
        if (data.data.requiresOtp === false) {
          // Create receipt directly
          const receipt: TransferReceipt = {
            transactionId: data.data.transactionId,
            transactionNumber: data.data.transactionNumber,
            fromAccount: transferDetails.fromAccount,
            toAccount: transferDetails.toAccount,
            toAccountName: transferDetails.toAccountName,
            toAccountNumber: transferDetails.toAccountNumber,
            amount: data.data.amount,
            fee: data.data.fee,
            totalAmount: data.data.amount + data.data.fee,
            description: transferDetails.description,
            transferType: transferDetails.transferType,
            timestamp: new Date().toISOString(),
            status: 'Completed'
          };
          
          setTransferReceipt(receipt);
          setSuccess('Transfer completed successfully!');
          setActiveStep(3); // Skip OTP step, go directly to receipt
          setConfirmDialogOpen(false);
          setLoading(false);
          return;
        }
        
        // Store pending transaction ID and move to OTP step (for future OTP implementation)
        setPendingTransactionId(data.data.transactionId);
        setOtpSent(true);
        setActiveStep(2);
        setConfirmDialogOpen(false);
        setLoading(false);
        return;
      }
      
      // Step 2: Verify OTP and complete transfer
      if (activeStep === 2) {
        if (!pendingTransactionId || !otpCode) {
          setError('Please enter OTP code');
          setLoading(false);
          return;
        }
        
        const response = await fetch('http://192.168.31.39:3001/api/banking/transfer/verify-otp', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactionId: pendingTransactionId,
            otpCode: otpCode,
          }),
        });
        
        const data = await response.json();
        if (!response.ok) {
          setError(data.message || 'OTP verification failed');
          setLoading(false);
          return;
        }
        
        // Create receipt
        const receipt: TransferReceipt = {
          transactionId: data.data.id || pendingTransactionId,
          transactionNumber: data.data.transactionNumber,
          fromAccount: transferDetails.fromAccount,
          toAccount: transferDetails.toAccount,
          toAccountName: transferDetails.toAccountName,
          toAccountNumber: transferDetails.toAccountNumber,
          amount: transferDetails.amount,
          fee: transferDetails.fee,
          totalAmount: transferDetails.totalAmount,
          description: transferDetails.description,
          transferType: transferDetails.transferType,
          timestamp: new Date().toISOString(),
          status: 'Completed'
        };
        
        setTransferReceipt(receipt);
        setSuccess('Transfer completed successfully!');
        setActiveStep(3);
        setLoading(false);
        return;
      }
      
    } catch (err) {
      setError('Transfer failed');
      setLoading(false);
    }
  }, [activeStep, formData.fromAccountId, formData.amount, formData.description, formData.transferType, transferDetails, pendingTransactionId, otpCode]);

  const handleReset = () => {
    setActiveStep(0);
    setError(null);
    setSuccess(null);
    setTransferReceipt(null);
    setOtpCode('');
    setPendingTransactionId(null);
    setOtpSent(false);
    setFormData({
      fromAccountId: accounts.length > 0 ? accounts[0].accountId : '',
      toAccountId: '',
      toAccountNumber: '',
      amount: '',
      description: '',
      transferType: 'internal',
    });
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleResendOtp = async () => {
    if (!pendingTransactionId) return;
    
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://192.168.31.39:3001/api/banking/transfer/resend-otp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: pendingTransactionId,
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to resend OTP');
        setLoading(false);
        return;
      }
      
      setSuccess('OTP resent successfully. Please check your email.');
      setLoading(false);
    } catch (err) {
      setError('Failed to resend OTP');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your transfer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Money Transfer</h2>
        <p className="text-gray-600">Transfer money between your accounts or to other accounts</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                index <= activeStep 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-500'
              }`}>
                {index < activeStep ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                index <= activeStep ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  index < activeStep ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
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

      {/* Success Alert */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Transfer Form */}
      {activeStep === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-8">
            {/* Transfer Type Selection */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">Transfer Type</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => handleInputChange('transferType', 'internal')}
                  className={`p-6 border-2 rounded-xl text-left transition-all duration-200 hover:shadow-md ${
                    formData.transferType === 'internal'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      formData.transferType === 'internal' ? 'bg-blue-500' : 'bg-gray-200'
                    }`}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">Internal Transfer</h3>
                      <p className="text-gray-600">Between your accounts</p>
                      <p className="text-sm text-orange-600 font-medium">Small fee applies</p>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleInputChange('transferType', 'external')}
                  className={`p-6 border-2 rounded-xl text-left transition-all duration-200 hover:shadow-md ${
                    formData.transferType === 'external'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      formData.transferType === 'external' ? 'bg-blue-500' : 'bg-gray-200'
                    }`}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">External Transfer</h3>
                      <p className="text-gray-600">To another user's account</p>
                      <p className="text-sm text-orange-600 font-medium">Small fee applies</p>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleInputChange('transferType', 'beneficiary')}
                  className={`p-6 border-2 rounded-xl text-left transition-all duration-200 hover:shadow-md ${
                    formData.transferType === 'beneficiary'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      formData.transferType === 'beneficiary' ? 'bg-blue-500' : 'bg-gray-200'
                    }`}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">Beneficiary</h3>
                      <p className="text-gray-600">To saved beneficiaries</p>
                      <p className="text-sm text-orange-600 font-medium">Small fee applies</p>
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* From Account */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">From Account</label>
                <select
                  value={formData.fromAccountId}
                  onChange={(e) => handleInputChange('fromAccountId', e.target.value)}
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
                    onChange={(e) => handleInputChange('toAccountId', e.target.value)}
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
                    onChange={(e) => handleInputChange('toAccountId', e.target.value)}
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
                      onChange={(e) => handleInputChange('toAccountNumber', e.target.value)}
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
                    onChange={(e) => handleInputChange('amount', e.target.value)}
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
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter transfer description"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Transfer Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleNext}
                disabled={
                  !formData.fromAccountId || 
                  !formData.amount || 
                  (formData.transferType === 'internal' && !formData.toAccountId) ||
                  (formData.transferType === 'external' && !formData.toAccountNumber) ||
                  (formData.transferType === 'beneficiary' && !formData.toAccountId)
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg flex items-center space-x-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span className="font-semibold">Continue</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Modal open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} title="Xác nhận chuyển khoản">
        {transferDetails && (
          <div className="p-8">
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
                onClick={() => setConfirmDialogOpen(false)}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleTransfer}
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
        )}
      </Modal>

      {/* Step 3: Receipt */}
      {activeStep === 2 && transferReceipt && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Transfer Successful!</h3>
            <p className="text-gray-600">Your money transfer has been completed successfully</p>
          </div>

          {/* Receipt */}
          <div className="bg-gray-50 rounded-xl p-8 mb-8">
            <div className="text-center mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Transaction Receipt</h4>
              <p className="text-sm text-gray-500">Transaction Number: {transferReceipt.transactionNumber}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">Transfer Details</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">From Account:</span>
                      <span className="font-medium text-gray-900">{transferReceipt.fromAccount.accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Number:</span>
                      <span className="font-medium text-gray-900">{transferReceipt.fromAccount.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transfer Type:</span>
                      <span className="font-medium text-gray-900 capitalize">{transferReceipt.transferType}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">Recipient Details</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recipient:</span>
                      <span className="font-medium text-gray-900">
                        {transferReceipt.toAccountName || transferReceipt.toAccount?.accountName || 'External Account'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Number:</span>
                      <span className="font-medium text-gray-900">
                        {transferReceipt.toAccountNumber || transferReceipt.toAccount?.accountNumber}
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
                        {formatCurrency(transferReceipt.amount, transferReceipt.fromAccount.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fee:</span>
                      <span className="text-gray-900">
                        {formatCurrency(transferReceipt.fee, transferReceipt.fromAccount.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-semibold text-gray-900">Total:</span>
                      <span className="font-bold text-lg text-gray-900">
                        {formatCurrency(transferReceipt.totalAmount, transferReceipt.fromAccount.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">Transaction Info</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date & Time:</span>
                      <span className="font-medium text-gray-900">{formatDate(transferReceipt.timestamp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-green-600">{transferReceipt.status}</span>
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Button
              onClick={handleReset}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors font-semibold hover:shadow-lg transform hover:scale-105"
            >
              Make Another Transfer
            </Button>
            <Button
              onClick={handleGoHome}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg transition-colors font-semibold hover:shadow-lg transform hover:scale-105"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferFormEnhanced; 