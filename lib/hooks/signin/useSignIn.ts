import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin } from '../../services/authService';
import apiClient from '../../services/apiClient';

export function useSignIn(navigation: any) {
  const ROLE_OPERATOR = 3;
  const ROLE_HOUSEHOLD = 4;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'error' as 'error' | 'success' | 'info',
  });

  const isEmail = (value: string) => value.includes('@');
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateUsername = (value: string) => {
    const v = value.trim();
    if (!v) return false;
    if (isEmail(v)) return validateEmail(v);
    return true; // non-empty username
  };

  const handleUsernameChange = (text: string) => {
    if (loading) return; // ✅ block edits while signing in
    setUsername(text);

    if (text && !validateUsername(text)) {
      setUsernameError('Please enter a valid email or username');
    } else {
      setUsernameError('');
    }
  };

  const handlePasswordChange = (text: string) => {
    if (loading) return; // ✅ block edits while signing in
    setPassword(text);
    if (!text || text.length === 0) {
      setPasswordError('Password is required');
    } else {
      setPasswordError('');
    }
  };

  const handleUsernameBlur = () => {
    setUsernameTouched(true);
    if (!username.trim()) {
      setUsernameError('Username is required');
    }
  };

  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    if (!password || password.length === 0) {
      setPasswordError('Password is required');
    }
  };

  const handleSignIn = async () => {
    if (loading) return; // ✅ prevent double submit / loops

    let hasError = false;
    if (!validateUsername(username)) {
      setUsernameError('Please enter a valid email or username');
      hasError = true;
    }
    if (!password || password.length === 0) {
      setPasswordError('Password is required');
      hasError = true;
    }
    if (hasError) return;

    try {
      setLoading(true);
      (apiClient.defaults.headers as any)['x-client-type'] = 'mobile';
      const data = await apiLogin(username.trim(), password);
      const token = data?.token ?? data?.accessToken;
      const user = data?.user ?? (data as any);

      if (!token && !user) {
        setSnackbar({
          visible: true,
          message: 'Invalid email/username or password',
          type: 'error',
        });
        return;
      }

      const roleVal = Number(user?.Roles ?? user?.roleId ?? user?.role ?? user?.roles);
      let dest = 'HDashboard';
      if (roleVal === ROLE_OPERATOR) dest = 'ODashboard';

      navigation.navigate(dest);
    } catch (err: any) {
      const platformMsg = 'Your account does not have access to this platform.';
      if (
        err?.response?.status === 403 ||
        err?.message === 'Platform not allowed' ||
        err?.payload?.message === 'Platform not allowed' ||
        err?.message === platformMsg ||
        err?.payload?.message === platformMsg
      ) {
        setSnackbar({ visible: true, message: platformMsg, type: 'error' });
      } else {
        setSnackbar({
          visible: true,
          message: 'Wrong email/username or password',
          type: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    username,
    setUsername: handleUsernameChange,
    password,
    setPassword: handlePasswordChange,
    showPassword,
    setShowPassword,
    usernameError,
    passwordError,
    usernameTouched,
    passwordTouched,
    setUsernameTouched,
    setPasswordTouched,
    setUsernameError,
    setPasswordError,
    loading,
    setLoading,
    snackbar,
    setSnackbar,
    handleUsernameBlur,
    handlePasswordBlur,
    handleSignIn,
  };
}