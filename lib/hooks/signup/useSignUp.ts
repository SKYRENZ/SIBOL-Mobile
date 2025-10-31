import { useState, useEffect, useCallback } from 'react';
import { register } from '../../services/authService';
import { fetchBarangays } from '../../services/apiClient';

export const useSignUp = () => {
  const [role, setRoleState] = useState<string>('');
  const [firstName, setFirstNameState] = useState<string>('');
  const [lastName, setLastNameState] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [barangay, setBarangayState] = useState<string>('');
  const [barangays, setBarangays] = useState<{ id: number; name: string }[]>([]);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [isSSO, setIsSSO] = useState(false);

  // sanitize name input
  const nameFilter = (input: string) => input.replace(/[^A-Za-z\s.'-]/g, '');
  const nameRegex = /^[A-Za-z\s.'-]+$/;
  const setFirstName = (v: string) => setFirstNameState(nameFilter(v));
  const setLastName = (v: string) => setLastNameState(nameFilter(v));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchBarangays();
        console.log('[useSignUp] fetchBarangays response', res);
        if (!cancelled && res?.barangays) setBarangays(res.barangays);
      } catch (err) {
        console.warn('Failed to load barangays', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const validateForm = () => {
    const newErrors: { [k: string]: string } = {};
    if (!role) newErrors.role = 'Role is required';
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    else if (!nameRegex.test(firstName.trim())) newErrors.firstName = 'Invalid first name';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    else if (!nameRegex.test(lastName.trim())) newErrors.lastName = 'Invalid last name';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email';
    if (!barangay || isNaN(Number(barangay)) || Number(barangay) <= 0) newErrors.barangay = 'Select a barangay';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // returns server response if success, throws on error
  const handleSignUp = useCallback(async () => {
    setServerError(null);
    if (!validateForm()) throw new Error('Validation failed');

    setLoading(true);
    try {
      // map role label to id when appropriate — backend expects number for Roles/roleId
      const roleId = Number(role) || (role === 'Household' ? 2 : role === 'Operator' ? 3 : 0);

      const payload = {
        firstName,
        lastName,
        barangayId: Number(barangay),
        email,
        roleId,
        isSSO,
        client: 'mobile', // inform backend this is a mobile signup -> it will use 'code' flow
      };

      const data = await register(payload);
      if (!data || data.success === false) {
        const errMsg = data?.message || data?.error || 'Registration failed';
        if (data?.email) setPendingEmail(data.email);
        throw new Error(errMsg);
      }

      return data;
    } finally {
      setLoading(false);
    }
  }, [role, firstName, lastName, barangay, email, isSSO]);

  return {
    role,
    setRole: (v: string) => setRoleState(v),
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    barangay,
    setBarangay: (v: string) => setBarangayState(v),
    barangays,
    errors,
    loading,
    serverError,
    pendingEmail,
    isSSO,
    setIsSSO,
    handleSignUp,
  } as const;
};