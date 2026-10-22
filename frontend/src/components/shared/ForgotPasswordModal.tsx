import React, { useState, useEffect } from 'react';
import { Mail, KeyRound, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/FormFields';
import { authService } from '../../services/authService';
import { useToast } from '../../hooks/useToast';

export interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccess?: (newPassword: string, email: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState<string>(initialEmail);
  const [code, setCode] = useState<string>('');
  const [serverCode, setServerCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || '');
      setStep(1);
      setCode('');
      setServerCode('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialEmail]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.requestPasswordReset(trimmedEmail);
      if (res.code) {
        setServerCode(res.code);
        setCode(res.code); // Pre-fill for user convenience
      }
      setSuccessMsg(res.message || 'Verification code has been dispatched.');
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must contain at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter both passwords.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.resetPassword({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        new_password: newPassword,
      });

      showToast('success', 'Password Reset Successful', res.message || 'You can now sign in with your new password.');
      if (onSuccess) {
        onSuccess(newPassword, email.trim().toLowerCase());
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Password Recovery" size="md">
      <div className="space-y-5">
        {/* Step indicator header */}
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
          <span className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                step === 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              1
            </span>
            Enter Email
          </span>
          <span className="w-8 h-px bg-slate-800" />
          <span className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                step === 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              2
            </span>
            Verify Code & Set Password
          </span>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-2.5 text-red-300 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* STEP 1: Request code */}
        {step === 1 && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your account email address below. We will send you an authentic 6-digit verification code to
              securely reset your password.
            </p>

            <Input
              label="Registered Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. 21eg102b21@anurag.edu.in"
              required
              leftIcon={<Mail className="w-4 h-4 text-emerald-400" />}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send Verification Code
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: Verify code & set new password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Code Sent to {email}</span>
                </div>
                {serverCode && (
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-emerald-500/30 flex items-center justify-between">
                    <span className="text-[11px] text-slate-300">
                      Your Verification Code: <strong className="font-mono text-emerald-400 text-sm tracking-wider">{serverCode}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCode(serverCode)}
                      className="text-[10px] text-emerald-400 underline hover:text-emerald-300 font-semibold"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}
              </div>
            )}

            <Input
              label="6-Digit Verification Code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 482910"
              maxLength={10}
              required
              leftIcon={<KeyRound className="w-4 h-4 text-emerald-400" />}
            />

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new secure password (e.g. Chinni04)"
                  required
                  minLength={6}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  minLength={6}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isLoading}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Reset Password
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
