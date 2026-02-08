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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from '../utils/tailwind';
import { Pencil } from 'lucide-react-native';
import BottomNavbar from '../components/oBotNav';
import AreaCovered from '../components/AreaCovered';
import Button from '../components/commons/Button'; // ✅ FIX: add missing import
import { getMyProfile, updateMyProfile } from '../services/profileService';
import { OProfileEditForm, type OProfileEditData } from '../components/oProfile/oProfileEdit';

export default function OProfile() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'personal' | 'area'>('personal');
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // ✅ form state (used for header + initialData)
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

  // ✅ for unsaved-changes warning
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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      console.log('Image selected:', result.assets[0].uri);
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
                <View style={tw`w-[118px] h-[107px] rounded-[15px] border border-black bg-white overflow-hidden`}>
                  <Image
                    source={require('../../assets/profile.png')}
                    style={tw`w-full h-full`}
                    resizeMode="cover"
                  />
                </View>
                <TouchableOpacity
                  style={tw`absolute -right-2 -bottom-2 w-[29px] h-[29px] items-center justify-center`}
                  onPress={handleImagePicker}
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
            </View>
          </View>

          {/* Tabs */}
          <View style={tw`flex-row mb-8`}>
            <TouchableOpacity
              onPress={() => setActiveTab('personal')}
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
              onSave={async (data) => {
                setFormLoading(true);
                setFormError(null);
                setFormSuccess(null);
                try {
                  // NOTE: backend currently updates firstName/lastName/contact/email (+ username/password elsewhere)
                  await updateMyProfile({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    contact: data.contact,
                    email: data.email,
                  });

                  // Update UI locally (Area Covered + Barangay are kept for display)
                  setProfile((prev) => ({ ...prev, ...data }));
                  setFormSuccess('Changes saved successfully.');
                } catch (err: any) {
                  if (err?.status === 429) {
                    const msg = err?.message || 'Please try again later.';
                    setFormError(msg);
                    Alert.alert('Too Early', msg);
                  } else {
                    const msg = err?.message || 'Failed to save changes.';
                    setFormError(msg);
                    Alert.alert('Error', msg);
                  }
                } finally {
                  setFormLoading(false);
                }
              }}
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

      <BottomNavbar currentPage="Back" />
    </SafeAreaView>
  );
}
