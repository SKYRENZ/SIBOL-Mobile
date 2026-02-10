import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import tw from '../../utils/tailwind';
import Button from '../commons/Button';
// ❌ remove: import Snackbar from '../commons/Snackbar';
import ChangePasswordModal from '../ChangePasswordModal';
import ChangeUsernameModal from '../ChangeUsernameModal';

export type OProfileEditData = {
  username: string;
  firstName: string;
  lastName: string;
  contact: string;
  email: string;
  barangay: string;
  areaCovered: string;
};

type FormProps = {
  initialData: OProfileEditData;
  onSave: (data: OProfileEditData) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
  success?: string | null;
  onEditingChange?: (editing: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;

  onUsernameSubmit?: (newUsername: string, currentPassword: string) => void | Promise<void>;
  onUsernameUpdated?: (newUsername: string) => void;

  usernameLastUpdated?: string | null;
  passwordLastUpdated?: string | null;
  profileLastUpdated?: string | null;
  onNotify?: (message: string, type?: 'error' | 'success' | 'info') => void;

  onPasswordChanged?: () => void;
};

const USERNAME_DAYS_RESTRICTION = 15;
const PASSWORD_DAYS_RESTRICTION = 15;
const PROFILEINFO_DAYS_RESTRICTION = 15;

function remainingDays(lastUpdated: string | null | undefined, restrictionDays: number) {
  if (!lastUpdated) return { allowed: true, days: 0 };
  const last = new Date(lastUpdated);
  if (Number.isNaN(last.getTime())) return { allowed: true, days: 0 };

  const retryAt = new Date(last.getTime() + restrictionDays * 24 * 60 * 60 * 1000);
  const diff = retryAt.getTime() - Date.now();
  if (diff <= 0) return { allowed: true, days: 0 };

  return { allowed: false, days: Math.ceil(diff / (24 * 60 * 60 * 1000)) };
}

export function OProfileEditForm({
  initialData,
  onSave,
  loading = false,
  error,
  success,
  onEditingChange,
  onDirtyChange,
  onUsernameSubmit,
  onUsernameUpdated,
  usernameLastUpdated,
  passwordLastUpdated,
  profileLastUpdated,
  onNotify,
  onPasswordChanged,
}: FormProps) {
  const [username, setUsername] = useState(initialData.username ?? '');

  const [isChangeUsernameOpen, setIsChangeUsernameOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState(initialData.firstName ?? '');
  const [lastName, setLastName] = useState(initialData.lastName ?? '');
  const [contact, setContact] = useState(initialData.contact ?? '');
  const [email, setEmail] = useState(initialData.email ?? '');
  const [barangay, setBarangay] = useState(initialData.barangay ?? '');
  const [areaCovered, setAreaCovered] = useState(initialData.areaCovered ?? '');

  const hasChanges = useMemo(() => {
    return (
      username !== (initialData.username ?? '') ||
      firstName !== (initialData.firstName ?? '') ||
      lastName !== (initialData.lastName ?? '') ||
      contact !== (initialData.contact ?? '') ||
      email !== (initialData.email ?? '') ||
      barangay !== (initialData.barangay ?? '') ||
      areaCovered !== (initialData.areaCovered ?? '')
    );
  }, [username, firstName, lastName, contact, email, barangay, areaCovered, initialData]);

  useEffect(() => {
    onDirtyChange?.(Boolean(hasChanges && editingProfile));
  }, [hasChanges, editingProfile, onDirtyChange]);

  useEffect(() => {
    if (editingProfile) return;
    setUsername(initialData.username ?? '');
    setFirstName(initialData.firstName ?? '');
    setLastName(initialData.lastName ?? '');
    setContact(initialData.contact ?? '');
    setEmail(initialData.email ?? '');
    setBarangay(initialData.barangay ?? '');
    setAreaCovered(initialData.areaCovered ?? '');
  }, [initialData, editingProfile]);

  const resetToInitial = () => {
    setUsername(initialData.username ?? '');
    setFirstName(initialData.firstName ?? '');
    setLastName(initialData.lastName ?? '');
    setContact(initialData.contact ?? '');
    setEmail(initialData.email ?? '');
    setBarangay(initialData.barangay ?? '');
    setAreaCovered(initialData.areaCovered ?? '');
  };

  const lockOtherButtons = editingProfile || loading;

  const profileRestriction = remainingDays(profileLastUpdated, PROFILEINFO_DAYS_RESTRICTION);
  const canStartProfileEdit = profileRestriction.allowed;

  const handleToggleEditProfile = () => {
    if (loading) return;

    if (!editingProfile && !canStartProfileEdit) {
      onNotify?.(`You can update your profile again in ${profileRestriction.days} day(s).`, 'error');
      return;
    }

    if (!editingProfile) {
      setIsChangePasswordOpen(false);
      setIsChangeUsernameOpen(false);
      setEditingProfile(true);
      onEditingChange?.(true);
      return;
    }

    resetToInitial();
    setEditingProfile(false);
    onEditingChange?.(false);
    onDirtyChange?.(false);
  };

  const handleSubmit = async () => {
    if (!hasChanges || loading) return;
    await onSave({ username, firstName, lastName, contact, email, barangay, areaCovered });
    setEditingProfile(false);
    onEditingChange?.(false);
    onDirtyChange?.(false);
  };

  const fieldBox = (
    label: string,
    value: string,
    onChangeText: (t: string) => void,
    opts?: { editable?: boolean; keyboardType?: any; autoCapitalize?: any }
  ) => (
    <View style={tw`relative`}>
      <View style={tw`absolute -top-3 left-7 bg-white px-2 z-10`}>
        <Text style={tw`text-[#2E523A] text-base font-semibold`}>{label}</Text>
      </View>
      <TextInput
        style={tw`border-2 border-[#6C8770] rounded-[10px] px-4 py-3 bg-[rgba(255,255,255,0.79)] text-[#2E523A]`}
        value={value}
        onChangeText={onChangeText}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#9E9E9E"
        editable={Boolean(opts?.editable)}
        keyboardType={opts?.keyboardType}
        autoCapitalize={opts?.autoCapitalize}
      />
    </View>
  );

  const tryOpenUsername = () => {
    const r = remainingDays(usernameLastUpdated, USERNAME_DAYS_RESTRICTION);
    if (!r.allowed) {
      onNotify?.(`You can change your username again in ${r.days} day(s).`, 'error');
      return;
    }
    setIsChangeUsernameOpen(true);
  };

  const tryOpenPassword = () => {
    const r = remainingDays(passwordLastUpdated, PASSWORD_DAYS_RESTRICTION);
    if (!r.allowed) {
      onNotify?.(`You can change your password again in ${r.days} day(s).`, 'error');
      return;
    }
    setIsChangePasswordOpen(true);
  };

  return (
    <View style={tw`gap-4`}>
      {/* Section 1 */}
      <View style={tw`bg-white rounded-2xl px-5 py-5 border border-gray-100`}>
        <View style={tw`gap-2`}>
          <View style={tw`relative`}>
            <View style={tw`absolute -top-3 left-7 bg-white px-2 z-10`}>
              <Text style={tw`text-[#2E523A] text-base font-semibold`}>Username</Text>
            </View>
            <TextInput
              style={tw`border-2 border-[#6C8770] rounded-[10px] px-4 py-3 bg-[rgba(255,255,255,0.79)] text-[#2E523A]`}
              value={username}
              editable={false}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={lockOtherButtons}
            onPress={tryOpenUsername} // ✅ changed
            style={tw.style(
              `px-4 py-3 rounded-xl border border-[#6C8770] bg-white`,
              lockOtherButtons && 'opacity-50'
            )}
          >
            <Text style={tw`text-[#2E523A] font-semibold text-center`}>Change Username</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={lockOtherButtons}
            onPress={tryOpenPassword} // ✅ changed
            style={tw.style(`px-4 py-3 rounded-xl bg-[#2E523A]`, lockOtherButtons && 'opacity-50')}
          >
            <Text style={tw`text-white font-semibold text-center`}>Change Password</Text>
          </TouchableOpacity>

          {editingProfile ? (
            <Text style={tw`text-[#6C8770] text-xs`}>
              Profile editing is active. Finish editing (Save/Cancel) to use Change Username/Password.
            </Text>
          ) : null}
        </View>
      </View>

      {/* Section 2 */}
      <View style={tw`bg-white rounded-2xl px-5 py-5 border border-gray-100`}>
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <Text style={tw`text-[#2E523A] text-base font-bold`}>Profile Details</Text>

          <TouchableOpacity
            onPress={handleToggleEditProfile}
            disabled={loading || (!editingProfile && !canStartProfileEdit)}
            activeOpacity={0.8}
            style={tw.style(
              `px-3 py-2 rounded-xl border border-[#6C8770] bg-white`,
              (loading || (!editingProfile && !canStartProfileEdit)) && 'opacity-50'
            )}
          >
            <Text style={tw`text-[#2E523A] font-semibold text-sm`}>
              {editingProfile ? 'Cancel' : 'Edit Profile'}
            </Text>
          </TouchableOpacity>
        </View>

        {!editingProfile && !canStartProfileEdit ? (
          <Text style={tw`text-[#6C8770] text-xs mb-4`}>
            You can update your profile again in {profileRestriction.days} day(s).
          </Text>
        ) : null}

        {error ? <Text style={tw`text-red-500 mb-2`}>{error}</Text> : null}

        <View style={tw`gap-5`}>
          {fieldBox('First Name', firstName, setFirstName, { editable: editingProfile && !loading })}
          {fieldBox('Last Name', lastName, setLastName, { editable: editingProfile && !loading })}
          {fieldBox('Contact #', contact, setContact, { editable: editingProfile && !loading, keyboardType: 'phone-pad' })}
          {fieldBox('Email', email, setEmail, { editable: editingProfile && !loading, keyboardType: 'email-address', autoCapitalize: 'none' })}
          {fieldBox('Barangay', barangay, setBarangay, { editable: editingProfile && !loading })}
          {fieldBox('Area Covered', areaCovered, setAreaCovered, { editable: editingProfile && !loading })}
        </View>

        {editingProfile ? (
          <View style={tw`items-center mt-7`}>
            <Button
              title={loading ? 'Saving…' : 'Save Changes'}
              onPress={handleSubmit}
              variant="primary"
              style={tw`w-[180px] py-2`}
              textStyle={tw`text-sm`}
              disabled={loading || !hasChanges}
            />
          </View>
        ) : null}
      </View>

      <ChangeUsernameModal
        visible={isChangeUsernameOpen}
        onClose={() => setIsChangeUsernameOpen(false)}
        currentUsername={username}
        onNotify={onNotify}
        onSuccess={(u) => {
          setUsername(u);
          onUsernameUpdated?.(u);
        }}
        onSubmit={async ({ newUsername, password, confirmPassword }) => {
          if (password !== confirmPassword) throw new Error('Passwords do not match.');
          if (!onUsernameSubmit) throw new Error('Username change handler not provided');
          await onUsernameSubmit(newUsername, password);
        }}
      />

      <ChangePasswordModal
        visible={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onNotify={onNotify}
        onSuccess={() => {
          // ✅ update restriction immediately (no reload needed)
          onPasswordChanged?.();
        }}
      />
    </View>
  );
}

export default OProfileEditForm;