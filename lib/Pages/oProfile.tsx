import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Modal,
  Alert,
  Pressable,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from '../utils/tailwind';
import { Pencil } from 'lucide-react-native';
import BottomNavbar from '../components/oBotNav';
import AreaCovered from '../components/AreaCovered';
import Button from '../components/commons/Button';
import Snackbar from '../components/commons/Snackbar';
import OProfileEditForm, { OProfileEditData } from '../components/oProfile/oProfileEdit';
import { getMyProfile, updateMyProfile, uploadMyProfileImage } from '../services/profileService';

const formatTooEarly = (payload: any, fallback = 'You can’t update yet.') => {
  const kind = String(payload?.kind || '').toUpperCase();
  const when = payload?.retryAt ? new Date(payload.retryAt).toLocaleString() : null;
  const label =
    kind === 'USERNAME' ? 'username' :
    kind === 'PASSWORD' ? 'password' :
    kind === 'PROFILE' ? 'profile' : 'profile';
  return when ? `You can update your ${label} again after: ${when}` : (payload?.message ?? fallback);
};

export default function OProfile() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'personal' | 'area'>('personal');
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const [profileEditing, setProfileEditing] = useState(false);

  const [usernameLastUpdated, setUsernameLastUpdated] = useState<string | null>(null);
  const [passwordLastUpdated, setPasswordLastUpdated] = useState<string | null>(null);
  const [profileLastUpdated, setProfileLastUpdated] = useState<string | null>(null);

  const [profile, setProfile] = useState<OProfileEditData>({
    username: '',
    firstName: '',
    lastName: '',
    contact: '',
    email: '',
    barangay: '',
    areaCovered: '',
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [isDirty, setIsDirty] = useState(false);

  const applyProfile = (p: any) => {
    const next: OProfileEditData = {
      username: String(p?.username ?? profile.username ?? ''),
      firstName: String(p?.firstName ?? profile.firstName ?? ''),
      lastName: String(p?.lastName ?? profile.lastName ?? ''),
      contact: String(p?.contact ?? profile.contact ?? ''),
      email: String(p?.email ?? profile.email ?? ''),
      barangay: String(p?.barangayName ?? p?.barangay ?? profile.barangay ?? ''),
      areaCovered: String(p?.areaName ?? p?.areaCovered ?? profile.areaCovered ?? ''),
    };

    setProfile(next);
  };

  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false); // ✅ add

  const loadProfile = React.useCallback(async () => {
    try {
      // 1) quick local fill from saved user
      const rawUser = await AsyncStorage.getItem('user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        applyProfile({
          firstName: u?.FirstName ?? u?.firstName,
          lastName: u?.LastName ?? u?.lastName,
          username: u?.Username ?? u?.username,
          email: u?.Email ?? u?.email,
        });
      }

      // 2) backend source of truth
      const p = await getMyProfile();
      applyProfile(p);

      setProfileImageUrl((p as any)?.imagePath ?? null);

      setUsernameLastUpdated((p as any)?.usernameLastUpdated ?? null);
      setPasswordLastUpdated((p as any)?.passwordLastUpdated ?? null);
      setProfileLastUpdated((p as any)?.profileLastUpdated ?? null); // ✅ add
    } catch (err) {
      console.warn('[OProfile] loadProfile failed', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.username, profile.firstName, profile.lastName, profile.contact, profile.email, profile.barangay, profile.areaCovered]);

  // load profile when screen focuses (skip if user has unsaved edits)
  useFocusEffect(
    React.useCallback(() => {
      if (!isDirty) {
        loadProfile();
      }
    }, [isDirty, loadProfile])
  );

  // Handle navigation with unsaved changes warning
  const handleNavigationAttempt = (routeName: string) => {
    if (isDirty) {
      setShowNavigationModal(true);
      setPendingNavigation(routeName ?? null);
    } else {
      navigation.navigate(routeName as never);
    }
  };

  const confirmNavigation = () => {
    setShowNavigationModal(false);
    if (pendingNavigation) {
      navigation.navigate(pendingNavigation as never);
    }
  };

  const cancelNavigation = () => {
    setShowNavigationModal(false);
    setPendingNavigation(null);
  };

  const handleImagePicker = async () => {
    try {
      // ✅ match hProfile behavior
      if (uploadingAvatar || profileEditing) return;

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Please allow photo library access to change your profile photo.');
        return;
      }

      const imagesOnly =
        (ImagePicker as any).MediaType?.Images ??
        (ImagePicker as any).MediaTypeOptions?.Images;

      const result = await ImagePicker.launchImageLibraryAsync({
        ...(imagesOnly ? { mediaTypes: imagesOnly } : {}),
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      const mimeType =
        (asset as any).mimeType ||
        (asset.uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');

      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(String(mimeType).toLowerCase())) {
        Alert.alert('Invalid file', 'Only JPEG/PNG images are allowed.');
        return;
      }

      setUploadingAvatar(true);
      const uploaded = await uploadMyProfileImage({
        uri: asset.uri,
        mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType,
        name: (asset as any).fileName,
      });

      setProfileImageUrl(uploaded.imagePath);

      // Persist profile image to stored user so menus pick it up immediately
      try {
        const raw = await AsyncStorage.getItem('user');
        if (raw) {
          const user = JSON.parse(raw);
          const img = uploaded.imagePath;
          user.Profile_image_path = img;
          user.ProfileImage = img;
          user.Image_path = img;
          user.imagePath = img;
          user.image_path = img;
          user.profile_image_path = img;
          await AsyncStorage.setItem('user', JSON.stringify(user));
        }
      } catch (err) {
        console.debug('[oProfile] failed to persist profile image', err);
      }

      // ✅ make restriction apply immediately (no reload needed)
      setProfileLastUpdated(new Date().toISOString());

      // ✅ Snackbar instead of Alert on success
      showSnack('Profile photo updated.', 'success');
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // block back navigation if dirty
  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (isDirty) {
          e.preventDefault();
          setShowNavigationModal(true);
          const routeName =
            typeof e.data.action?.payload === 'object' &&
            e.data.action?.payload !== null &&
            'name' in e.data.action.payload
              ? (e.data.action.payload as { name?: string }).name
              : null;
          setPendingNavigation(routeName ?? null);
        }
      });

      return unsubscribe;
    }, [isDirty, navigation])
  );

  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
    type?: 'error' | 'success' | 'info';
  }>({ visible: false, message: '', type: 'info' });

  const showSnack = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setSnackbar({ visible: true, message, type });
  };

  const handleChangeUsername = async (newUsername: string, currentPassword: string) => {
    await updateMyProfile({ username: newUsername, currentPassword });
    setProfile((p) => ({ ...p, username: newUsername }));
    setUsernameLastUpdated(new Date().toISOString());

    // Persist the username into AsyncStorage so global menus/readers pick it up immediately
    try {
      const raw = await AsyncStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        user.Username = newUsername;
        user.username = newUsername;
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }
    } catch (err) {
      console.debug('[oProfile] failed to persist username update', err);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#AFC8AD]`}>
      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={tw`px-8 pt-12 pb-6`}>
          <Text style={tw`text-[#2E523A] text-2xl font-extrabold text-left`}>
            My Profile - Operator
          </Text>
        </View>

        <View style={tw`bg-white rounded-t-[50px] px-7 pt-8 pb-32 min-h-[700px] mt-5`}>
          {/* Profile Picture, Username and Email Row */}
          <View style={tw`flex-row mb-8`}>
            <View style={tw`mr-6`}>
              <View style={tw`relative`}>
                <View style={tw`w-[118px] h-[107px] rounded-[15px] border-2 border-green-800 bg-white overflow-hidden`}>
                  <Image
                    source={profileImageUrl ? { uri: profileImageUrl } : require('../../assets/profile.png')}
                    style={tw`w-full h-full`}
                    resizeMode="cover"
                  />
                </View>

                {/* ✅ NEW: clickable overlay for the whole image */}
                <Pressable
                  onPress={handleImagePicker}
                  disabled={uploadingAvatar || profileEditing} // ✅ add
                  style={[tw`absolute inset-0`, { zIndex: 10 }]}
                />

                {/* Pencil stays clickable too */}
                <TouchableOpacity
                  style={[tw`absolute -right-2 -bottom-2 w-[29px] h-[29px] items-center justify-center`, { zIndex: 20 }]}
                  onPress={handleImagePicker}
                  disabled={uploadingAvatar || profileEditing} // ✅ add
                  activeOpacity={0.8}
                >
                  <Pencil color="#2E523A" size={24} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={tw`justify-center flex-1`}>
              <Text style={tw`text-[#2E523A] text-xl font-bold mb-2`}>
                {profile.username || '—'}
              </Text>
              <Text style={tw`text-[#2E523A] text-[13px] font-semibold`}>
                {profile.email || '—'}
              </Text>

              {/* ✅ NEW: Change Photo button under username+email */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleImagePicker}
                disabled={uploadingAvatar || profileEditing} // ✅ add
                style={tw.style(
                  `mt-3 self-start px-4 py-2 rounded-xl border border-[#6C8770] bg-white`,
                  uploadingAvatar && 'opacity-50'
                )}
              >
                <Text style={tw`text-[#2E523A] font-semibold text-[12px]`}>
                  {uploadingAvatar ? 'Uploading…' : 'Change Photo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tabs */}
          <View style={tw`flex-row mb-8`}>
            <TouchableOpacity
              onPress={() => setActiveTab('personal')}
              disabled={profileEditing} // ✅ add
              style={[
                tw`rounded-[15px] px-6 py-2 mr-3`,
                activeTab === 'personal'
                  ? tw`bg-[#6C8770]`
                  : tw`border border-[#6C8770] bg-transparent`
              ]}
            >
              <Text
                style={[
                  tw`text-[13px] font-semibold`,
                  activeTab === 'personal'
                    ? tw`text-[#FFFDF4]`
                    : tw`text-[#6C8770]`
                ]}
              >
                Personal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('area')}
              disabled={profileEditing} // ✅ add
              style={[
                tw`rounded-[15px] px-6 py-2`,
                activeTab === 'area'
                  ? tw`bg-[#6C8770]`
                  : tw`border border-[#6C8770] bg-transparent`
              ]}
            >
              <Text
                style={[
                  tw`text-[13px] font-semibold`,
                  activeTab === 'area'
                    ? tw`text-[#FFFDF4]`
                    : tw`text-[#6C8770]`
                ]}
              >
                Area Covered
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content for Tabs */}
          {activeTab === 'personal' ? (
            <OProfileEditForm
              initialData={profile}
              loading={formLoading}
              error={formError}
              success={formSuccess}
              onDirtyChange={setIsDirty}
              onEditingChange={setProfileEditing} // ✅ add (parity with hProfile)
              onSave={async (data) => {
                setFormLoading(true);
                setFormError(null);
                setFormSuccess(null);
                try {
                  await updateMyProfile({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    contact: data.contact,
                    email: data.email,
                  });

                  setProfile((prev) => ({ ...prev, ...data }));
                  setFormSuccess('Changes saved successfully.');

                  // ✅ Snackbar on success
                  showSnack('Profile updated successfully.', 'success');

                  // ✅ make restriction apply immediately (no reload needed)
                  setProfileLastUpdated(new Date().toISOString());
                } catch (err: any) {
                  if (err?.status === 429) {
                    const kind = String(err?.payload?.kind || '').toUpperCase();

                    // ✅ only show inline error in Profile Details when it's PROFILE restriction
                    if (kind === 'PROFILE') {
                      setFormError(formatTooEarly(err?.payload, err?.message));
                    } else {
                      showSnack(formatTooEarly(err?.payload, err?.message), 'error');
                    }
                  } else {
                    const msg = err?.message || 'Failed to save changes.';
                    setFormError(msg);
                    Alert.alert('Error', msg);
                  }
                } finally {
                  setFormLoading(false);
                }
              }}
              onUsernameSubmit={handleChangeUsername}
              onUsernameUpdated={(u) => setProfile((p) => ({ ...p, username: u }))}
              usernameLastUpdated={usernameLastUpdated}
              passwordLastUpdated={passwordLastUpdated}
              profileLastUpdated={profileLastUpdated} // ✅ add
              onNotify={showSnack}
              onPasswordChanged={() => setPasswordLastUpdated(new Date().toISOString())}
            />
          ) : (
            <AreaCovered />
          )}
        </View>
      </ScrollView>

      {/* Navigation Warning Modal */}
      <Modal
        visible={showNavigationModal}
        transparent
        animationType="fade"
        onRequestClose={cancelNavigation}
      >
        <View style={tw`flex-1 bg-[rgba(0,0,0,0.4)] justify-center items-center`}>
          <View style={tw`bg-white rounded-[20px] p-6 mx-8 w-[90%]`}>
            <Text style={tw`text-[#2E523A] text-lg font-bold mb-4 text-center`}>
              Unsaved Changes
            </Text>
            <Text style={tw`text-[#6C8770] text-sm text-center mb-6`}>
              Changes have not been saved. Are you sure you want to exit this page?
            </Text>
            <View style={tw`flex-row gap-3`}>
              <Button
                title="Cancel"
                onPress={cancelNavigation}
                variant="outline"
                style={tw`flex-1`}
              />
              <Button
                title="Leave"
                onPress={confirmNavigation}
                variant="primary"
                style={tw`flex-1`}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ Snackbar mounted on page */}
      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
        bottomOffset={110} // ✅ above your BottomNavbar
      />

      <BottomNavbar currentPage="Back" />
    </SafeAreaView>
  );
}
