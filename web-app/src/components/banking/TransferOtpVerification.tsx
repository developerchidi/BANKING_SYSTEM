import React from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface TransferOtpVerificationProps {
  otpCode: string;
  loading: boolean;
  success: string | null;
  onOtpChange: (code: string) => void;
  onResendOtp: () => void;
  onVerify: () => void;
  onCancel: () => void;
}

const TransferOtpVerification: React.FC<TransferOtpVerificationProps> = ({
  otpCode,
  loading,
  success,
  onOtpChange,
  onResendOtp,
  onVerify,
  onCancel
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
          <h3 className="text-xl font-bold text-gray-900">Enter OTP</h3>
          <p className="text-gray-600">Please enter the OTP sent to your email</p>
        </div>
      </div>

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

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">OTP Code</label>
          <Input
            type="text"
            value={otpCode}
            onChange={(e) => onOtpChange(e.target.value)}
            placeholder="Enter 6-digit OTP code"
            maxLength={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-center text-lg font-mono tracking-widest"
          />
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Didn't receive the OTP? 
            <button
              onClick={onResendOtp}
              disabled={loading}
              className="ml-1 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resend OTP
            </button>
          </p>
          <p className="text-xs text-gray-500">
            OTP will expire in 10 minutes
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-8">
        <Button
          onClick={onCancel}
          className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
        >
          Cancel
        </Button>
        <Button
          onClick={onVerify}
          disabled={loading || !otpCode}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Verifying...</span>
            </div>
          ) : (
            'Verify & Complete Transfer'
          )}
        </Button>
      </div>
    </div>
  );
};

export default TransferOtpVerification; 