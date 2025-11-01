import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import TransferForm from './TransferForm';

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

interface TransferFormContainerProps {
  transferType?: 'internal' | 'external' | 'beneficiary';
  onClose?: () => void;
}

const TransferFormContainer: React.FC<TransferFormContainerProps> = ({ transferType, onClose }) => {
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
    toAccountNumber: '',
    amount: '',
    description: '',
    transferType: 'internal',
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
  const [transferDetails, setTransferDetails] = useState<any>(null);
  const [transferReceipt, setTransferReceipt] = useState<any>(null);

  const steps = ['Transfer Details', 'Review & Confirm', 'OTP Verification', 'Receipt'];

  const isTypeLocked = !!transferType;

  // Business Logic Functions
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

  const checkExternalAccount = async (accountNumber: string) => {
    if (formData.transferType === 'external' && accountNumber.length > 0) {
      setCheckingAccount(true);
      setExternalAccountName(null);
      setError(null);
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`http://192.168.31.39:3001/api/banking/accounts/lookup?accountNumber=${accountNumber}`, {
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

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const handleNext = () => {
    if (validateForm()) {
      // Prepare transfer details for confirmation
      const fromAccount = accounts.find(acc => acc.accountId === formData.fromAccountId);
      const toAccount = formData.transferType === 'internal' 
        ? accounts.find(acc => acc.accountId === formData.toAccountId)
        : null;
      
      const amount = parseFloat(formData.amount);
      const fee = 2.00; // Fixed fee, same as backend
      const totalAmount = amount + fee;

      setTransferDetails({
        fromAccount,
        toAccount,
        toAccountNumber: formData.toAccountNumber,
        externalAccountName,
        amount,
        fee,
        totalAmount,
        description: formData.description,
        transferType: formData.transferType,
      });

      setActiveStep(1);
    }
  };

  const handleTransfer = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://192.168.31.39:3001/api/banking/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromAccountId: formData.fromAccountId,
          toAccountId: formData.transferType === 'internal' ? formData.toAccountId : undefined,
          toAccountNumber: formData.transferType === 'external' ? formData.toAccountNumber : undefined,
          amount: parseFloat(formData.amount),
          description: formData.description,
          transferType: formData.transferType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const tx = data.data?.transaction;
        if (data.data && data.data.requiresOtp) {
          setPendingTransactionId(data.data.transactionId);
          setOtpSent(true);
          setActiveStep(2);
        } else if (tx) {
          setTransferReceipt({
            transactionId: tx.id || tx.transactionId,
            transactionNumber: tx.transactionNumber,
            status: tx.status,
            amount: tx.amount,
            fee: tx.fee,
            totalAmount: typeof tx.totalAmount === 'number' ? tx.totalAmount : (tx.amount && tx.fee ? tx.amount + tx.fee : undefined),
            fromAccount: tx.fromAccount || tx.senderAccount || {},
            toAccount: tx.toAccount || tx.receiverAccount || {},
            toAccountName: tx.toAccountName,
            toAccountNumber: tx.toAccountNumber,
            description: tx.description,
            transferType: tx.transferType || tx.category || tx.type,
            timestamp: tx.timestamp || tx.processedAt || tx.updatedAt || tx.createdAt,
          });
          setActiveStep(3);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Transfer failed');
      }
    } catch (err) {
      setError('An error occurred during transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://192.168.31.39:3001/api/banking/transfer/resend-otp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionId: pendingTransactionId }),
      });

      if (response.ok) {
        setSuccess('OTP resent successfully');
      } else {
        setError('Failed to resend OTP');
      }
    } catch (err) {
      setError('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // OTP Verification handler
  const handleVerifyOtp = async () => {
    if (!otpCode || !pendingTransactionId) {
      setError('Missing OTP or transaction ID');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
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
      if (response.ok) {
        const data = await response.json();
        const tx = data.data?.transaction;
        if (tx) {
          setTransferReceipt({
            transactionId: tx.id || tx.transactionId,
            transactionNumber: tx.transactionNumber,
            status: tx.status,
            amount: tx.amount,
            fee: tx.fee,
            totalAmount: typeof tx.totalAmount === 'number' ? tx.totalAmount : (tx.amount && tx.fee ? tx.amount + tx.fee : undefined),
            fromAccount: tx.fromAccount || tx.senderAccount || {},
            toAccount: tx.toAccount || tx.receiverAccount || {},
            toAccountName: tx.toAccountName,
            toAccountNumber: tx.toAccountNumber,
            description: tx.description,
            transferType: tx.transferType || tx.category || tx.type,
            timestamp: tx.timestamp || tx.processedAt || tx.updatedAt || tx.createdAt,
          });
          setActiveStep(3);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'OTP verification failed');
      }
    } catch (err) {
      setError('An error occurred during OTP verification');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setFormData({
      fromAccountId: accounts.length > 0 ? accounts[0].accountId : '',
      toAccountId: '',
      toAccountNumber: '',
      amount: '',
      description: '',
      transferType: transferType || 'internal',
    });
    setError(null);
    setSuccess(null);
    setOtpCode('');
    setTransferDetails(null);
    setTransferReceipt(null);
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Effects
  useEffect(() => {
    fetchAccounts();
    fetchBeneficiaries();
  }, []);

  useEffect(() => {
    if (transferType) {
      setFormData(prev => ({ ...prev, transferType }));
    }
  }, [transferType]);

  useEffect(() => {
    checkExternalAccount(formData.toAccountNumber);
  }, [formData.toAccountNumber, formData.transferType]);

  // Pass all data and handlers to the presentational component
  return (
    <TransferForm
      activeStep={activeStep}
      loading={loading}
      error={error}
      success={success}
      formData={formData}
      otpCode={otpCode}
      accounts={accounts}
      beneficiaries={beneficiaries}
      externalAccountName={externalAccountName}
      checkingAccount={checkingAccount}
      transferDetails={transferDetails}
      transferReceipt={transferReceipt}
      steps={steps}
      isTypeLocked={isTypeLocked}
      onInputChange={handleInputChange}
      onNext={handleNext}
      onTransfer={handleTransfer}
      onResendOtp={handleResendOtp}
      onReset={handleReset}
      onGoHome={handleGoHome}
      onOtpChange={setOtpCode}
      formatCurrency={formatCurrency}
      formatDate={formatDate}
      onClose={onClose}
      onVerifyOtp={handleVerifyOtp}
    />
  );
};

export default TransferFormContainer; 