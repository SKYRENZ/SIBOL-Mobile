import { useState, useEffect, useCallback } from 'react';
import { post } from '../../services/apiClient';

type Step = 'email' | 'verify' | 'reset' | 'done';

export function useForgotPassword(initialEmail = '') {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const COOLDOWN_SECONDS = 60;
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  useEffect(() => {
    if (!resendAvailableAt) {
      setResendCooldown(0);
      return;
    }
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000));
      setResendCooldown(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        setResendAvailableAt(null);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [resendAvailableAt]);

  const emailValid = !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const codeValid = /^\d{6}$/.test(code);
  const passwordValid = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}/.test(newPassword);

  const resetState = useCallback(() => {
    setStep('email');
    setEmail('');
    setCode('');
    setNewPassword('');
    setError(null);
    setInfo(null);
    setLoading(false);
    setResendAvailableAt(null);
    setResendCooldown(0);
  }, []);

  const sendResetRequest = useCallback(async () => {
    setError(null);
    // prevent resending while cooldown active
    if (resendAvailableAt && Date.now() < resendAvailableAt) {
      return setError(`Please wait ${Math.ceil((resendAvailableAt - Date.now()) / 1000)}s before resending.`);
    }
    if (!emailValid) return setError('Please enter a valid email.');
    setLoading(true);
    try {
      const data = await post('/api/auth/forgot-password', { email });
      setInfo(data?.debugCode ? `Debug code: ${data.debugCode}` : 'Reset code sent. Check your email.');
      // start cooldown
      setResendAvailableAt(Date.now() + COOLDOWN_SECONDS * 1000);
      setResendCooldown(COOLDOWN_SECONDS);
      setStep('verify');
      return data;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to request reset');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [email, emailValid, resendAvailableAt]);

  const verifyResetCode = useCallback(async () => {
    setError(null);
    if (!codeValid) return setError('Code must be a 6-digit number.');
    setLoading(true);
    try {
      const data = await post('/api/auth/verify-reset-code', { email, code });
      setInfo('Code verified. Enter your new password.');
      setStep('reset');
      return data;
    } catch (err: any) {
      setError(err?.message ?? 'Invalid code');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [email, code, codeValid]);

  const submitNewPassword = useCallback(async () => {
    setError(null);
    if (!passwordValid) return setError('Password must be at least 8 chars and include upper, lower, number, and symbol.');
    setLoading(true);
    try {
      const data = await post('/api/auth/reset-password', { email, code, newPassword });
      setInfo('Password reset successfully. You can now sign in with your new password.');
      setStep('done');
      return data;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to reset password');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [email, code, newPassword, passwordValid]);

  return {
    step,
    setStep,
    email,
    setEmail,
    code,
    setCode,
    newPassword,
    setNewPassword,
    loading,
    error,
    info,
    resendCooldown,
    canResend: resendCooldown === 0,
    emailValid,
    codeValid,
    passwordValid,
    sendResetRequest,
    verifyResetCode,
    submitNewPassword,
    resetState,
  } as const;
}