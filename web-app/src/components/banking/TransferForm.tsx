import React from 'react';
import Button from '../ui/Button';
import TransferStepper from './TransferStepper';
import TransferTypeSelector from './TransferTypeSelector';
import TransferFormFields from './TransferFormFields';
import TransferConfirmation from './TransferConfirmation';
import TransferOtpVerification from './TransferOtpVerification';
import TransferReceipt from './TransferReceipt';

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

interface TransferFormProps {
  activeStep: number;
  loading: boolean;
  error: string | null;
  success: string | null;
  formData: {
    fromAccountId: string;
    toAccountId: string;
    toAccountNumber: string;
    amount: string;
    description: string;
    transferType: string;
  };
  otpCode: string;
  accounts: Account[];
  beneficiaries: Beneficiary[];
  externalAccountName: string | null;
  checkingAccount: boolean;
  transferDetails: any;
  transferReceipt: TransferReceiptData | null;
  steps: string[];
  isTypeLocked: boolean;
  onInputChange: (field: string, value: string) => void;
  onNext: () => void;
  onTransfer: () => void;
  onResendOtp: () => void;
  onReset: () => void;
  onGoHome: () => void;
  onOtpChange: (code: string) => void;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (dateString: string) => string;
  onClose?: () => void;
  onVerifyOtp: () => void;
}

const TransferForm: React.FC<TransferFormProps> = ({
  activeStep,
  loading,
  error,
  success,
  formData,
  otpCode,
  accounts,
  beneficiaries,
  externalAccountName,
  checkingAccount,
  transferDetails,
  transferReceipt,
  steps,
  isTypeLocked,
  onInputChange,
  onNext,
  onTransfer,
  onResendOtp,
  onReset,
  onGoHome,
  onOtpChange,
  formatCurrency,
  formatDate,
  onClose,
  onVerifyOtp
}) => {
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
      {/* Header & Stepper chỉ hiển thị khi không dùng modal */}
      {!isTypeLocked && (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Money Transfer</h2>
            <p className="text-gray-600">Transfer money between your accounts or to other accounts</p>
          </div>
          <TransferStepper steps={steps} activeStep={activeStep} />
        </>
      )}

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

      {/* Step 1: Transfer Form */}
      {activeStep === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <TransferTypeSelector
            transferType={formData.transferType}
            isTypeLocked={isTypeLocked}
            onTypeChange={(type) => onInputChange('transferType', type)}
          />
          <TransferFormFields
            formData={formData}
            accounts={accounts}
            beneficiaries={beneficiaries}
            externalAccountName={externalAccountName}
            checkingAccount={checkingAccount}
            error={error}
            onInputChange={onInputChange}
            formatCurrency={formatCurrency}
          />
          {/* Transfer Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={onNext}
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
      )}

      {/* Step 2: Xác nhận chuyển khoản */}
      {activeStep === 1 && transferDetails && (
        <TransferConfirmation
          transferDetails={transferDetails}
          loading={loading}
          onConfirm={onTransfer}
          onCancel={onReset}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Step 3: OTP Verification */}
      {activeStep === 2 && (
        <TransferOtpVerification
          otpCode={otpCode}
          loading={loading}
          success={success}
          onOtpChange={onOtpChange}
          onResendOtp={onResendOtp}
          onVerify={onVerifyOtp}
          onCancel={onReset}
        />
      )}

      {/* Step 4: Receipt */}
      {activeStep === 3 && transferReceipt && (
        <TransferReceipt
          transferReceipt={transferReceipt}
          onMakeAnotherTransfer={onReset}
          onGoToDashboard={() => {
            onGoHome();
            if (typeof onClose === 'function') onClose();
          }}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};

export default TransferForm; 