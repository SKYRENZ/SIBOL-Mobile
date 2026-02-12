import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
  Image,
  Alert,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import tw from '../utils/tailwind';
import BottomNavbar from '../components/hBotNav';
import Snackbar from '../components/commons/Snackbar'; // ✅ keep this (now exists)
import { Edit, Award, Pencil } from 'lucide-react-native';
import { getMyProfile, getMyPoints, updateMyProfile, uploadMyProfileImage } from '../services/profileService';
import HProfileContributions from '../components/hProfile/hProfileContributions';
import { HProfileEditForm, type HProfileEditData } from '../components/hProfile/hProfileEdit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Added types to fix implicit any / unknown names
type TabType = 'contributions' | 'profile';

type UserDataState = {
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  address?: string;
  contact?: string | null;
  email?: string;
  barangay?: string | null;
  totalContributions: number;
  points: number;
  contributions: any[];
};

type HProfileRouteParams = {
  updatedData?: Partial<{
    username: string;
    firstName: string;
    lastName: string;
    contact: string;
    email: string;
    barangay: string;
  }>;
};

// ✅ Add this (or import your real mock data)
const MOCK_CONTRIBUTIONS: any[] = [];

const formatTooEarly = (payload: any, fallback = 'You can’t update yet.') => {
  const kind = String(payload?.kind || '').toUpperCase();
  const when = payload?.retryAt ? new Date(payload.retryAt).toLocaleString() : null;
  const label =
    kind === 'USERNAME' ? 'username' :
    kind === 'PASSWORD' ? 'password' :
    kind === 'PROFILE' ? 'profile' : 'profile';
  return when ? `You can update your ${label} again after: ${when}` : (payload?.message ?? fallback);
};

export default function HProfile() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ HProfile: HProfileRouteParams }, 'HProfile'>>();

  const [activeTab, setActiveTab] = useState<TabType>('contributions');
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Profile tab save state
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<string | null>(null);

  const [userData, setUserData] = useState<UserDataState>({
    username: '—',
    firstName: undefined,
    lastName: undefined,
    address: '—',
    contact: undefined,
    email: '—',
    barangay: undefined,
    totalContributions: 0,
    points: 0,
    contributions: MOCK_CONTRIBUTIONS,
  });

  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false); // ✅ add

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const loadFromBackend = useCallback(async () => {
    try {
      setLoadError(null);

      const [profile, points] = await Promise.all([getMyProfile(), getMyPoints()]);

      setProfileImageUrl(profile.imagePath ?? null);

      setUsernameLastUpdated(profile.usernameLastUpdated ?? null);
      setPasswordLastUpdated(profile.passwordLastUpdated ?? null);
      setProfileLastUpdated(profile.profileLastUpdated ?? null); // ✅ add

      setUserData((prev: UserDataState) => ({
        ...prev,
        username: profile.username || prev.username,
        firstName: profile.firstName ?? prev.firstName,
        lastName: profile.lastName ?? prev.lastName,
        contact: profile.contact ?? prev.contact,
        email: profile.email || prev.email,
        address: profile.fullAddress || profile.areaName || prev.address,
        barangay: profile.barangayName ?? prev.barangay,
        points: Number(points.points ?? 0),
        totalContributions: Number(points.totalContributions ?? 0),
      }));
    } catch (e: any) {
      setLoadError(e?.message ?? 'Failed to load profile');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        setLoading(true);
        try {
          await loadFromBackend();
        } finally {
          if (mounted) setLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [loadFromBackend])
  );

  // keep compatibility if some code still navigates back with updatedData
  useEffect(() => {
    const updated = route.params?.updatedData;
    if (updated) {
      setUserData((prev: UserDataState) => ({
        ...prev,
        username: updated.username ?? prev.username,
        firstName: updated.firstName ?? prev.firstName,
        lastName: updated.lastName ?? prev.lastName,
        contact: updated.contact ?? prev.contact,
        email: updated.email ?? prev.email,
        barangay: updated.barangay ?? prev.barangay,
      }));
      navigation.setParams?.({ updatedData: undefined } as never);
    }
  }, [route.params?.updatedData, navigation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadFromBackend();
    } finally {
      setRefreshing(false);
    }
  };

  const [profileEditing, setProfileEditing] = useState(false); // ✅ add

  const showSnack = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setSnackbar({ visible: true, message, type });
  };

  const handleChangeUsername = async (newUsername: string, currentPassword: string) => {
    await updateMyProfile({ username: newUsername, currentPassword });
    setUserData((prev: UserDataState) => ({ ...prev, username: newUsername }));
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
      console.debug('[hProfile] failed to persist username update', err);
    }
  };

  const handleSaveProfile = async (data: HProfileEditData) => {
    setProfileSaveError(null);
    setProfileSaveSuccess(null);
    setSavingProfile(true);

    try {
      // Backend supports: username/firstName/lastName/contact/email/password/area
      // It does NOT support barangay updates (keep barangay UI local-only for now)
      await updateMyProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        contact: data.contact,
        email: data.email,
      });

      setProfileSaveSuccess('Profile updated successfully.');
      await loadFromBackend();
      showSnack('Profile updated successfully.', 'success');
    } catch (e: any) {
      if (e?.status === 429) {
        showSnack(formatTooEarly(e?.payload, e?.message), 'error');
      } else {
        setProfileSaveError(e?.message ?? 'Failed to update profile');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleImagePicker = async () => {
    try {
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
        console.debug('[hProfile] failed to persist profile image', err);
      }

      // ✅ Snackbar on success
      showSnack('Profile photo updated.', 'success');
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const renderHeader = () => (
    <Animated.View
      style={[
        tw`bg-[#2E523A] pt-[60px] pb-[30px] px-6 rounded-bl-[24px] rounded-br-[24px]`,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
      ]}
    >
      <View style={tw`flex-row items-center`}>
        <View style={tw`mr-[18px]`}>
          <View style={tw`relative`}>
            <View style={tw`w-[118px] h-[107px] rounded-[15px] border-2 border-green-300 bg-white overflow-hidden`}>
              <Image
                source={profileImageUrl ? { uri: profileImageUrl } : require('../../assets/profile.png')}
                style={tw`w-full h-full`}
                resizeMode="cover"
              />
            </View>

            {/* ✅ NEW: clickable overlay for the whole image */}
            <Pressable
              onPress={handleImagePicker}
              disabled={uploadingAvatar || profileEditing}
              style={[tw`absolute inset-0`, { zIndex: 10 }]}
            />

            {/* Pencil stays clickable too */}
            <TouchableOpacity
              style={[tw`absolute -right-2 -bottom-2 w-[29px] h-[29px] items-center justify-center`, { zIndex: 20 }]}
              onPress={handleImagePicker}
              disabled={uploadingAvatar || profileEditing}
              activeOpacity={0.8}
            >
              <Pencil color="#26cf5f" size={24} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={tw`flex-1`}>
          <Text style={[tw`text-white text-[24px] mb-1`, { fontFamily: 'Inter-Bold', letterSpacing: 0.3 }]}>
            {userData.username}
          </Text>

          <Text style={[tw`text-white/90 text-[13px] mb-3`, { fontFamily: 'Inter-SemiBold' }]}>
            {userData.email || '—'}
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleImagePicker}
            disabled={uploadingAvatar || profileEditing}
            style={tw.style(
              `self-start px-[14px] py-2 rounded-xl bg-white border border-white/60`,
              (uploadingAvatar || profileEditing) && 'opacity-60'
            )}
          >
            <Text style={[tw`text-[#2E523A] text-[12px]`, { fontFamily: 'Inter-SemiBold' }]}>
              {uploadingAvatar ? 'Uploading…' : 'Change Photo'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loadError ? (
        <View style={tw`mt-2`}>
          <Text style={tw`text-white/90 text-[12px]`}>{loadError}</Text>
        </View>
      ) : null}
    </Animated.View>
  );

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={tw`px-5 py-5 items-center`}>
          <ActivityIndicator />
          <Text style={tw`mt-2 text-[#6C8770]`}>Loading profile…</Text>
        </View>
      );
    }

    if (activeTab === 'profile') {
      return (
        <View style={tw`px-4 pt-2`}>
          <HProfileEditForm
            initialData={{
              username: userData.username,
              firstName: userData.firstName ?? '',
              lastName: userData.lastName ?? '',
              contact: userData.contact ?? '',
              email: userData.email ?? '',
              barangay: userData.barangay ?? '',
            }}
            loading={savingProfile}
            error={profileSaveError}
            success={profileSaveSuccess}
            onSave={handleSaveProfile}
            onEditingChange={setProfileEditing}
            onUsernameSubmit={handleChangeUsername}
            onUsernameUpdated={(u) => setUserData((p) => ({ ...p, username: u }))}
            onNotify={(msg, type = 'info') => showSnack(msg, type)}
            usernameLastUpdated={usernameLastUpdated}
            passwordLastUpdated={passwordLastUpdated}
            profileLastUpdated={profileLastUpdated} // ✅ add
            onPasswordChanged={() => setPasswordLastUpdated(new Date().toISOString())}
          />
        </View>
      );
    }

    return (
      <HProfileContributions
        fadeAnim={fadeAnim}
        points={userData.points}
        totalContributions={userData.totalContributions}
        currentUsername={userData.username}
      />
    );
  };

  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
    type?: 'error' | 'success' | 'info';
  }>({ visible: false, message: '', type: 'info' });

  const [usernameLastUpdated, setUsernameLastUpdated] = useState<string | null>(null);
  const [passwordLastUpdated, setPasswordLastUpdated] = useState<string | null>(null);
  const [profileLastUpdated, setProfileLastUpdated] = useState<string | null>(null); // ✅ add

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAF8]`}>
      {/* Keyboard behavior affects content only, NOT bottom nav */}
      <KeyboardAvoidingView style={tw`flex-1`} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <KeyboardAwareScrollView
          enableOnAndroid
          extraScrollHeight={Platform.OS === 'ios' ? 20 : 120}
          keyboardOpeningTime={0}
          contentContainerStyle={tw`pb-[160px]`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderHeader()}

          {/* Tabs */}
          <Animated.View
            style={[
              tw`flex-row bg-white py-3 border-b border-[#E8E8E8] mx-4 mt-[-12px] rounded-xl px-2`,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
              },
            ]}
            pointerEvents={profileEditing ? 'none' : 'auto'}
          >
            <TouchableOpacity
              style={tw.style(
                `flex-1 items-center py-[10px] flex-row justify-center rounded-lg mx-1`,
                activeTab === 'contributions' && 'bg-[rgba(46,82,58,0.1)]'
              )}
              onPress={() => setActiveTab('contributions')}
              activeOpacity={0.7}
              disabled={profileEditing}
            >
              <Award
                size={20}
                color={activeTab === 'contributions' ? '#2E523A' : '#9E9E9E'}
                fill={activeTab === 'contributions' ? '#2E523A' : 'none'}
              />
              <Text
                style={[
                  tw`ml-1.5 text-[14px] text-[#6C8770]`,
                  { fontFamily: 'Inter-SemiBold', letterSpacing: 0.2 },
                  activeTab === 'contributions' && tw`text-[#2E523A]`,
                ]}
              >
                Contributions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw.style(
                `flex-1 items-center py-[10px] flex-row justify-center rounded-lg mx-1`,
                activeTab === 'profile' && 'bg-[rgba(46,82,58,0.1)]'
              )}
              onPress={() => setActiveTab('profile')}
              activeOpacity={0.7}
              disabled={profileEditing}
            >
              <Edit size={20} color={activeTab === 'profile' ? '#2E523A' : '#9E9E9E'} />
              <Text
                style={[
                  tw`ml-1.5 text-[14px] text-[#6C8770]`,
                  { fontFamily: 'Inter-SemiBold', letterSpacing: 0.2 },
                  activeTab === 'profile' && tw`text-[#2E523A]`,
                ]}
              >
                Profile
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Content */}
          <View style={tw`flex-1 p-4 pt-2 mb-20`}>{renderTabContent()}</View>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>

      {/* ✅ ADD THIS: snackbar mounted on page */}
      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
        // If your SnackBar overlays the bottom nav, bump it up
        duration={3000}
        bottomOffset={110} // ✅ above BottomNavbar
      />

      {/* Bottom nav stays fixed */}
      <View style={tw`absolute bottom-0 left-0 right-0`} pointerEvents={profileEditing ? 'none' : 'auto'}>
        <BottomNavbar currentPage="Back" onRefresh={handleRefresh} />
        {refreshing ? (
          <View style={tw`absolute right-3 bottom-[72px]`}>
            <ActivityIndicator />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
