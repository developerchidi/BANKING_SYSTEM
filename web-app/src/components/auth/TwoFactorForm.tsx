import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';

interface TwoFactorFormProps {
  userId: string;
  email: string;
  onSuccess: (tokens: any) => void;
  onBack: () => void;
}

export const TwoFactorForm: React.FC<TwoFactorFormProps> = ({
  userId,
  email,
  onSuccess,
  onBack
}) => {
  console.log('🔐 TwoFactorForm: Rendering with props:', { userId, email });
  
  const navigate = useNavigate();
  const { completeTwoFactorLogin, sendTwoFactorCode } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  const hasInitialized = useRef(false); // Use ref to track initialization

  useEffect(() => {
    console.log('🔐 TwoFactorForm: Component mounted, checking if already initialized');
    // Send 2FA code on component mount only once, even with StrictMode
    if (!hasInitialized.current) {
      console.log('🔐 TwoFactorForm: First time mounting, sending 2FA code');
      hasInitialized.current = true;
      handleSendCode();
    } else {
      console.log('🔐 TwoFactorForm: Already initialized, skipping 2FA code send');
    }
  }, []); // Empty dependency array

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleSendCode = async () => {
    if (codeSent) {
      console.log('🔐 TwoFactorForm: Code already sent, skipping...');
      return;
    }
    
    console.log('🔐 TwoFactorForm: handleSendCode called for user:', userId);
    setResendLoading(true);
    setError(null);
    
    try {
      console.log('🔐 TwoFactorForm: Calling sendTwoFactorCode...');
      await sendTwoFactorCode(userId);
      console.log('🔐 TwoFactorForm: 2FA code sent successfully');
      setCodeSent(true);
      setTimeLeft(60); // 60 seconds cooldown
    } catch (err) {
      console.error('❌ TwoFactorForm: Failed to send 2FA code:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to send 2FA code');
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await completeTwoFactorLogin(userId, fullCode);
      onSuccess(result.tokens);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to verify 2FA code');
      }
      // Clear code on error
      setCode(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left: Brand & Info */}
          <div className="hidden lg:block text-white">
            <div className="space-y-8">
              {/* Logo & Brand */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-wider">BANKING SYSTEM</h2>
                    <p className="text-white/70 text-sm">Secure • Fast • Reliable</p>
                  </div>
                </div>
              </div>

              {/* Welcome Text */}
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Two-Factor
                  <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Authentication
                  </span>
                </h1>
                <p className="text-xl text-white/80 leading-relaxed max-w-md">
                  Enter the 6-digit code sent to your email to complete your secure login.
                </p>
              </div>

              {/* Security Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Enhanced Security</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-white/80">Protect against unauthorized access</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-white/80">Secure your banking transactions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-white/80">Peace of mind with every login</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: 2FA Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center justify-center mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white">BANKING SYSTEM</h2>
                </div>
              </div>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Enter 2FA Code</h2>
                <p className="text-white/70">We've sent a code to {email}</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-200 font-medium flex items-center backdrop-blur-sm">
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 2FA Code Input */}
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-4 text-center">
                    Enter the 6-digit code
                  </label>
                  <div className="flex justify-center space-x-3">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        id={`code-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-12 text-center text-xl font-bold bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                        placeholder="•"
                      />
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || code.join('').length !== 6}
                  className="w-full flex justify-center py-4 px-6 border border-transparent rounded-2xl shadow-lg text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </div>
                  ) : (
                    'Verify Code'
                  )}
                </Button>

                <div className="text-center space-y-4">
                  <p className="text-white/70 text-sm">
                    Didn't receive the code?
                  </p>
                  <Button
                    type="button"
                    onClick={handleSendCode}
                    disabled={resendLoading || timeLeft > 0}
                    className="text-purple-300 hover:text-purple-200 font-medium transition-colors disabled:opacity-50"
                  >
                    {resendLoading ? 'Sending...' : timeLeft > 0 ? `Resend in ${formatTime(timeLeft)}` : 'Resend code'}
                  </Button>
                </div>
              </form>

              <div className="mt-8 text-center">
                <Button
                  onClick={onBack}
                  className="text-white/70 hover:text-white font-medium transition-colors"
                >
                  ← Back to login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 