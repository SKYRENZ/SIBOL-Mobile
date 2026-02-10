import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import tw from '../utils/tailwind';
import { Eye, EyeOff } from 'lucide-react-native';
import { updateMyProfile } from '../services/profileService';
import Snackbar from './commons/Snackbar'; // ✅ add

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (newUsername: string) => void;
  requireChange?: boolean;
  onSubmit?: (payload: { newUsername: string; password: string; confirmPassword: string }) => void | Promise<void>;
  currentUsername?: string;
  onNotify?: (message: string, type?: 'error' | 'success' | 'info') => void;
};

export default function ChangeUsernameModal({
  visible,
  onClose,
  onSuccess,
  requireChange = false,
  onSubmit,
  currentUsername,
  onNotify,
}: Props) {
  const [newUsername, setNewUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [kavKey, setKavKey] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const [snack, setSnack] = useState<{ visible: boolean; message: string; type?: 'error' | 'success' | 'info' }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showModalSnack = (message: string, type: 'error' | 'success' | 'info' = 'info') =>
    setSnack({ visible: true, message, type });

  useEffect(() => {
    if (!visible) {
      setNewUsername('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirm(false);
      setLoading(false);
      setSnack({ visible: false, message: '', type: 'info' }); // ✅ reset
    }

    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      if (Platform.OS === 'android') setTimeout(() => setKavKey((k) => k + 1), 220);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const trimmedNew = newUsername.trim();
  const trimmedCurrent = String(currentUsername ?? '').trim();

  // ✅ Only disable until every field has input (like ChangePassword)
  const allFilled =
    trimmedNew.length > 0 &&
    password.trim().length > 0 &&
    confirmPassword.trim().length > 0;

  const canSubmit = !loading && allFilled;

  const handleSubmit = async () => {
    if (!allFilled) return;

    // ✅ validations -> modal snackbar
    if (trimmedCurrent && trimmedNew.toLowerCase() === trimmedCurrent.toLowerCase()) {
      return showModalSnack('No changes detected. Please enter a different username.', 'error');
    }
    if (password !== confirmPassword) {
      return showModalSnack('Passwords do not match.', 'error');
    }

    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit({ newUsername: trimmedNew, password, confirmPassword });
      } else {
        await updateMyProfile({ username: trimmedNew });
      }

      onSuccess?.(trimmedNew);

      // ✅ success -> page snackbar (preferred)
      if (onNotify) onNotify('Username updated successfully.', 'success');
      else showModalSnack('Username updated successfully.', 'success');

      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 300);
    } catch (err: any) {
      // ✅ API errors -> modal snackbar (NOT page)
      showModalSnack(err?.message ?? 'Failed to update username', 'error');
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!requireChange) onClose();
      }}
    >
      <TouchableWithoutFeedback onPress={() => { if (!requireChange) onClose(); }}>
        <View style={tw`flex-1 bg-black/35 justify-center items-center p-4`}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              key={kavKey}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
              style={tw`flex-1 w-full`}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  tw`px-0 py-4`,
                  {
                    flexGrow: 1,
                    justifyContent: keyboardVisible ? 'flex-end' : 'center',
                    paddingBottom: keyboardVisible ? 350 : 0,
                  },
                ]}
              >
                <View style={tw`w-full max-w-md bg-white rounded-lg overflow-hidden self-center`}>
                  <View
                    style={[
                      tw`px-4 py-3 border-b`,
                      { backgroundColor: '#2E523A', borderBottomColor: 'rgba(255,255,255,0.15)' },
                    ]}
                  >
                    <Text style={tw`text-lg font-semibold text-white`}>Change Username</Text>
                  </View>

                  <View style={tw`p-4`}>
                    {/* ✅ removed inline success/error messages */}

                    <Text style={tw`text-sm text-gray-700 mb-1`}>New Username</Text>
                    <View style={tw`mb-3`}>
                      <TextInput
                        value={newUsername}
                        onChangeText={setNewUsername}
                        placeholder="Enter new username"
                        style={tw`border border-gray-300 rounded-md px-3 py-2`}
                        editable={!loading}
                        autoCapitalize="none"
                      />
                    </View>

                    <Text style={tw`text-sm text-gray-700 mb-1`}>Password</Text>
                    <View style={tw`relative mb-3`}>
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        placeholder="Enter password"
                        style={tw`border border-gray-300 rounded-md px-3 py-2`}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={tw`absolute right-2 top-2`}
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff size={18} color="#6C757D" /> : <Eye size={18} color="#6C757D" />}
                      </TouchableOpacity>
                    </View>

                    <Text style={tw`text-sm text-gray-700 mb-1`}>Confirm Password</Text>
                    <View style={tw`relative mb-3`}>
                      <TextInput
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirm}
                        placeholder="Confirm password"
                        style={tw`border border-gray-300 rounded-md px-3 py-2`}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirm(!showConfirm)}
                        style={tw`absolute right-2 top-2`}
                        disabled={loading}
                      >
                        {showConfirm ? <EyeOff size={18} color="#6C757D" /> : <Eye size={18} color="#6C757D" />}
                      </TouchableOpacity>
                    </View>

                    <View style={tw`flex-row justify-end gap-2`}>
                      {!requireChange && (
                        <TouchableOpacity onPress={onClose} disabled={loading} style={tw`px-4 py-2 rounded-md bg-gray-100`}>
                          <Text>Cancel</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={!canSubmit}
                        style={[
                          tw`px-4 py-2 rounded-md`,
                          !canSubmit ? tw`bg-gray-300` : tw`bg-[#2E523A]`,
                        ]}
                      >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={tw`text-white`}>Save</Text>}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>

      {/* ✅ Modal snackbar (errors/validation; success only if no onNotify) */}
      <Snackbar
        visible={snack.visible}
        message={snack.message}
        type={snack.type}
        onDismiss={() => setSnack((s) => ({ ...s, visible: false }))}
        bottomOffset={90}
      />
    </Modal>
  );
}