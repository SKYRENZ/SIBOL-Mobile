import { useState, useEffect, useCallback } from 'react';
import { get, post } from '../../services/apiClient';

export const useEmailVerification = (initialEmail = '') => {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

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

  const verifyByToken = useCallback(async (token: string) => {
    if (!token) throw new Error('Token required');
    setStatus('loading');
    try {
      const data = await get(`/api/auth/verify-email/${token}`);
      if (data?.success) {
        setStatus('success');
        setMessage(data.message || 'Email verified');
        setEmail(data.email || email);
      } else {
        setStatus('error');
        setMessage(data?.error || 'Verification failed');
      }
      return data;
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message ?? 'Network error');
      throw err;
    }
  }, [email]);

  const sendVerificationCode = useCallback(async (targetEmail?: string) => {
    const e = targetEmail ?? email;
    if (!e) throw new Error('Email required to send verification code');
    setIsResending(true);
    try {
      const data = await post('/api/auth/send-verification-code', { email: e });
      // start cooldown
      setResendAvailableAt(Date.now() + COOLDOWN_SECONDS * 1000);
      setResendCooldown(COOLDOWN_SECONDS);
      return data;
    } finally {
      setIsResending(false);
    }
  }, [email]);

  const verifyCode = useCallback(async (code: string, targetEmail?: string) => {
    const e = targetEmail ?? email;
    if (!e) throw new Error('Email required to verify code');
    if (!/^\d{6}$/.test(code)) throw new Error('Code must be 6 digits');
    setStatus('loading');
    try {
      const data = await post('/api/auth/verify-email-code', { email: e, code });
      if (data?.success) {
        setStatus('success');
        setMessage(data.message || 'Verified');
      } else {
        setStatus('error');
        setMessage(data?.error || 'Verification failed');
      }
      return data;
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message ?? 'Network error');
      throw err;
    }
  }, [email]);

  return {
    email,
    setEmail,
    status,
    message,
    isResending,
    resendCooldown,
    canResend: resendCooldown === 0,
    verifyByToken,
    sendVerificationCode,
    verifyCode,
  } as const;
};