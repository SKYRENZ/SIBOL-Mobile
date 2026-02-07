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

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (newUsername: string) => void;
  requireChange?: boolean; // if true, cannot dismiss until success

  // ✅ NEW: allow parent to handle saving + refreshing
  onSubmit?: (payload: {
    newUsername: string;
    password: string;
    confirmPassword: string;
  }) => void | Promise<void>;
};

export default function ChangeUsernameModal({
  visible,
  onClose,
  onSuccess,
  requireChange = false,
  onSubmit,
}: Props) {
  const [newUsername, setNewUsername] = useState('');
  const [password, setPassword] = useState(''); // UI-only
  const [confirmPassword, setConfirmPassword] = useState(''); // UI-only
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [kavKey, setKavKey] = useState(0); // ✅ add
  const [keyboardVisible, setKeyboardVisible] = useState(false); // ✅ add

  useEffect(() => {
    if (!visible) {
      setNewUsername('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirm(false);
      setLoading(false);
      setError(null);
      setSuccess(null);
    }

    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      if (Platform.OS === 'android') {
        setTimeout(() => setKavKey((k) => k + 1), 220);
      }
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // ✅ Per request: NO client-side validations.
      if (onSubmit) {
        await onSubmit({ newUsername, password, confirmPassword });
      } else {
        // fallback (kept for backward-compat)
        await updateMyProfile({ username: newUsername });
      }

      setSuccess('Username updated successfully');
      onSuccess?.(newUsername);

      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update username');
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
      {/* Overlay: tap outside closes */}
      <TouchableWithoutFeedback onPress={() => { if (!requireChange) onClose(); }}>
        <View style={tw`flex-1 bg-black/35 justify-center items-center p-4`}>
          {/* Same as RequestForm/AdditiveInput: inner TouchableWithoutFeedback prevents closing */}
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              key={kavKey}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              // ✅ offset usually won't help much on Android; keep it small/zero
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
                    // ✅ IMPORTANT: this reduces the gap on Android
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
                    {success ? (
                      <View style={tw`mb-3`}>
                        <Text style={tw`text-green-600`}>{success}</Text>
                      </View>
                    ) : null}

                    {error ? <Text style={tw`text-red-500 mb-2`}>{error}</Text> : null}

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
                        <TouchableOpacity
                          onPress={onClose}
                          disabled={loading}
                          style={tw`px-4 py-2 rounded-md bg-gray-100`}
                        >
                          <Text>Cancel</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={loading}
                        style={[tw`px-4 py-2 rounded-md`, loading ? tw`bg-gray-300` : tw`bg-[#2E523A]`]}
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
    </Modal>
  );
}