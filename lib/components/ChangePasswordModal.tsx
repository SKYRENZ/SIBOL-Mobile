import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import tw from '../utils/tailwind';
import { Eye, EyeOff, Check, X } from 'lucide-react-native';
import { changePassword as apiChangePassword } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  visible: boolean;
  onClose: () => void;
  requireChange?: boolean; // if true, cannot dismiss until success
};

export default function ChangePasswordModal({ visible, onClose, requireChange = false }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setLoading(false);
      setError(null);
      setSuccess(null);
    }
  }, [visible]);

  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSymbol = /[\W_]/.test(newPassword);
  const hasLength = newPassword.length >= 8;

  const requirements = useMemo(
    () => [
      { ok: hasLength, label: 'At least 8 characters' },
      { ok: hasUpper, label: 'At least 1 uppercase letter' },
      { ok: hasLower, label: 'At least 1 lowercase letter' },
      { ok: hasNumber, label: 'At least 1 number' },
      { ok: hasSymbol, label: 'At least 1 symbol' },
    ],
    [hasLength, hasUpper, hasLower, hasNumber, hasSymbol]
  );

  const score = requirements.filter((r) => r.ok).length;
  const strengthLabel =
    score <= 1 ? 'Very weak' : score === 2 ? 'Weak' : score === 3 ? 'Medium' : score === 4 ? 'Strong' : 'Very strong';
  const strengthColors = ['#ef4444', '#f43f5e', '#f59e0b', '#34d399', '#059669'];
  const strengthColor = strengthColors[Math.max(0, Math.min(4, score - 1))] ?? '#ef4444';

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const passwordValid = hasUpper && hasLower && hasNumber && hasSymbol && hasLength;

  const handleSubmit = async () => {
    setError(null);
    if (!currentPassword) return setError('Current password is required');
    if (!passwordValid) return setError('Password does not meet requirements');
    if (!passwordsMatch) return setError('Passwords do not match');

    setLoading(true);
    try {
      await apiChangePassword(currentPassword, newPassword);
      // mark success and clear first-login flag in storage
      try {
        const raw = await AsyncStorage.getItem('user');
        if (raw) {
          const u = JSON.parse(raw);
          u.IsFirstLogin = 0;
          await AsyncStorage.setItem('user', JSON.stringify(u));
        }
      } catch {}
      setSuccess('Password changed successfully');
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to change password');
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!requireChange) onClose(); }}>
      <View style={tw`flex-1 bg-black bg-opacity-40 justify-center items-center px-4`}>
        {/* Card should be white */}
        <View style={tw`w-full max-w-md bg-white rounded-lg overflow-hidden`}>
          {/* Header only should be green */}
          <View style={[tw`px-4 py-3 border-b`, { backgroundColor: '#2E523A', borderBottomColor: 'rgba(255,255,255,0.15)' }]}>
            <Text style={tw`text-lg font-semibold text-white`}>Change Password</Text>
          </View>

          <ScrollView contentContainerStyle={tw`p-4`}>
            {success ? (
              <View style={tw`mb-3`}>
                <Text style={tw`text-green-600`}>{success}</Text>
              </View>
            ) : null}

            {error ? <Text style={tw`text-red-500 mb-2`}>{error}</Text> : null}

            <Text style={tw`text-sm text-gray-700 mb-1`}>Current Password</Text>
            <View style={tw`relative mb-3`}>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrent}
                placeholder="Enter current password"
                style={tw`border border-gray-300 rounded-md px-3 py-2`}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={tw`absolute right-2 top-2`}>
                {showCurrent ? <EyeOff size={18} color="#6C757D" /> : <Eye size={18} color="#6C757D" />}
              </TouchableOpacity>
            </View>

            <Text style={tw`text-sm text-gray-700 mb-1`}>New Password</Text>
            <View style={tw`relative mb-3`}>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                placeholder="New password"
                style={tw`border border-gray-300 rounded-md px-3 py-2`}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)} style={tw`absolute right-2 top-2`}>
                {showNew ? <EyeOff size={18} color="#6C757D" /> : <Eye size={18} color="#6C757D" />}
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
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={tw`absolute right-2 top-2`}>
                {showConfirm ? <EyeOff size={18} color="#6C757D" /> : <Eye size={18} color="#6C757D" />}
              </TouchableOpacity>
            </View>

            {/* Strength bar */}
            <View style={tw`mb-3`}>
              <View style={tw`flex-row items-center gap-2 mb-2`}>
                <View style={tw`flex-1 h-2 rounded-full bg-gray-200 overflow-hidden flex-row`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <View
                      key={i}
                      style={{
                        flex: 1,
                        marginRight: i < 4 ? 4 : 0,
                        backgroundColor: i < score ? strengthColor : '#E5E7EB',
                        height: 8,
                        borderRadius: 4,
                      }}
                    />
                  ))}
                </View>
                <Text style={tw`text-xs font-medium text-gray-700 ml-2`}>{strengthLabel}</Text>
              </View>

              {/* Requirements list (matches frontend) */}
              <View>
                {requirements.map((r, idx) => (
                  <View key={idx} style={tw`flex-row items-center mb-1`}>
                    {r.ok ? <Check size={14} color="#10B981" /> : <X size={14} color="#ef4444" />}
                    <Text style={[tw`ml-2 text-sm`, r.ok ? tw`text-gray-800` : tw`text-gray-500`]}>{r.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Match indicator */}
            {confirmPassword.length > 0 && (
              <View style={tw`flex-row items-center mb-3`}>
                {passwordsMatch ? <Check size={16} color="#10B981" /> : <X size={16} color="#ef4444" />}
                <Text style={tw`ml-2 text-sm`}>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</Text>
              </View>
            )}

            <View style={tw`flex-row justify-end gap-2`}>
              {!requireChange && (
                <TouchableOpacity onPress={onClose} disabled={loading} style={tw`px-4 py-2 rounded-md bg-gray-100`}>
                  <Text>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading || !passwordValid || !passwordsMatch || !currentPassword}
                style={[
                  tw`px-4 py-2 rounded-md`,
                  (loading || !passwordValid || !passwordsMatch || !currentPassword) ? tw`bg-gray-300` : tw`bg-[#2E523A]`,
                ]}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={tw`text-white`}>Change Password</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}