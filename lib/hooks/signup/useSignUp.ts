import { useEffect, useState } from 'react';
import { fetchBarangays } from '../../services/apiClient';
import { registerWithAttachment } from '../../services/authService';

const ROLES = {
  Operator: 3,
  Household: 4,
} as const;

export function useSignUp() {
  const [role, setRole] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [barangay, setBarangay] = useState<string>('');
  const [barangays, setBarangays] = useState<{ id: number; name: string }[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string>('');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const [isSSO, setIsSSO] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetchBarangays();
      if (cancelled) return;
      setBarangays(Array.isArray(res) ? res : []);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const validateForm = () => {
    const next: Record<string, string> = {};

    if (!role) next.role = 'Role is required';
    if (role && !(role in ROLES)) next.role = 'Only Household and Operator can sign up on mobile';

    if (!firstName.trim()) next.firstName = 'First name is required';
    if (!lastName.trim()) next.lastName = 'Last name is required';

    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email';

    if (!barangay.trim()) next.barangay = 'Barangay is required';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  async function handleSignUp(attachmentUri: string) {
    setLoading(true);
    setServerError('');
    setPendingEmail(null);

    try {
      if (!validateForm()) {
        throw new Error('Please fix the form errors.');
      }
      if (!attachmentUri) {
        setErrors(prev => ({ ...prev, attachment: 'Valid ID image is required' }));
        throw new Error('Valid ID image is required.');
      }

      const roleId = (ROLES as any)[role] as number;

      const data = await registerWithAttachment({
        firstName,
        lastName,
        email,
        barangayId: barangay,
        roleId,
        isSSO,
        attachmentUri,
      });

      return data;
    } catch (err: any) {
      const msg = err?.payload?.error || err?.payload?.message || err?.message || 'Registration failed';
      setServerError(msg);
      if (err?.payload?.email) setPendingEmail(err.payload.email);
      if (err?.payload?.pendingEmail) setPendingEmail(err.payload.pendingEmail);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    role,
    setRole,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    barangay,
    setBarangay,
    barangays,
    errors,
    loading,
    serverError,
    pendingEmail,
    handleSignUp,
    isSSO,
    setIsSSO,
  } as const;
}