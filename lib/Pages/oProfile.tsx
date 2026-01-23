import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from '../utils/tailwind';
import { Pencil } from 'lucide-react-native';
import BottomNavbar from '../components/oBotNav';
import Button from '../components/commons/Button';
import AreaCovered from '../components/AreaCovered';
import { getMyProfile, updateMyProfile } from '../services/profileService';

export default function OProfile() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'personal' | 'area'>('personal');
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Form values
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [areaCovered, setAreaCovered] = useState('');
  const [contact, setContact] = useState(''); // ✅ Contact #
  const [email, setEmail] = useState('');     // ✅ Email (editable)
  const [barangay, setBarangay] = useState('');
  const [username, setUsername] = useState('');

  // Original values for change detection
  const [originalValues, setOriginalValues] = useState({
    firstName: '',
    lastName: '',
    areaCovered: '',
    contact: '',
    email: '',
    barangay: '',
  });

  const hasChanges =
    firstName !== originalValues.firstName ||
    lastName !== originalValues.lastName ||
    areaCovered !== originalValues.areaCovered ||
    contact !== originalValues.contact ||
    email !== originalValues.email ||
    barangay !== originalValues.barangay;

  const applyProfile = (p: any) => {
    const next = {
      firstName: p?.firstName ?? firstName ?? '',
      lastName: p?.lastName ?? lastName ?? '',
      areaCovered: p?.areaName ?? areaCovered ?? '',
      contact: p?.contact ?? contact ?? '',
      email: p?.email ?? email ?? '',
      barangay: p?.barangayName ?? barangay ?? '',
    };

    setFirstName(next.firstName);
    setLastName(next.lastName);
    setAreaCovered(next.areaCovered);
    setContact(next.contact);
    setEmail(next.email);
    setBarangay(next.barangay);

    if (p?.username !== undefined) setUsername(String(p.username || ''));

    setOriginalValues(next);
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
      const profile = await getMyProfile();
      applyProfile(profile);
    } catch (err) {
      console.warn('[OProfile] loadProfile failed', err);
    }
  }, []);

  // load profile when screen focuses (skip if user has unsaved edits)
  useFocusEffect(
    React.useCallback(() => {
      if (!hasChanges) {
        loadProfile();
      }
    }, [hasChanges, loadProfile])
  );

  // Handle navigation with unsaved changes warning
  const handleNavigationAttempt = (routeName: string) => {
    if (hasChanges) {
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
      // Image selected, can be processed further
      console.log('Image selected:', result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      await updateMyProfile({
        firstName,
        lastName,
        contact,
        email,
      });

      setOriginalValues({
        firstName,
        lastName,
        areaCovered,
        contact,
        email,
        barangay,
      });

      Alert.alert('Success', 'Changes saved successfully!');
    } catch (err: any) {
      if (err?.status === 429) {
        Alert.alert('Too Early', err?.message || 'Please try again later.');
        return;
      }
      Alert.alert('Error', err?.message || 'Failed to save changes.');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (hasChanges) {
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
    }, [hasChanges, navigation])
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
            {/* Profile Picture and Edit Icon */}
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

            {/* Username and Email */}
            <View style={tw`justify-center flex-1`}>
              <Text style={tw`text-[#2E523A] text-xl font-bold mb-2`}>
                {username || '—'}
              </Text>
              <Text style={tw`text-[#2E523A] text-[13px] font-semibold`}>
                {email || '—'}
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
            <View style={tw`gap-4`}>
              {/* First Name */}
              <View style={tw`relative`}>
                <View style={tw`absolute -top-3 left-7 bg-white px-2 z-10`}>
                  <Text style={tw`text-[#2E523A] text-base font-semibold`}>
                    First Name
                  </Text>
                </View>
                <TextInput
                  style={tw`border-2 border-[#6C8770] rounded-[10px] px-4 py-3 bg-[rgba(255,255,255,0.79)] text-[#2E523A]`}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>

              {/* Last Name */}
              <View style={tw`relative`}>
                <View style={tw`absolute -top-3 left-7 bg-white px-2 z-10`}>
                  <Text style={tw`text-[#2E523A] text-base font-semibold`}>
                    Last Name
                  </Text>
                </View>
                <TextInput
                  style={tw`border-2 border-[#6C8770] rounded-[10px] px-4 py-3 bg-[rgba(255,255,255,0.79)] text-[#2E523A]`}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>

              {/* Area Covered (personal) */}
              <View style={tw`relative`}>
                <View style={tw`absolute -top-3 left-7 bg-white px-2 z-10`}>
                  <Text style={tw`text-[#2E523A] text-base font-semibold`}>
                    Area Covered
                  </Text>
                </View>
                <TextInput
                  style={tw`border-2 border-[#6C8770] rounded-[10px] px-4 py-3 bg-[rgba(255,255,255,0.79)] text-[#2E523A]`}
                  value={areaCovered}
                  onChangeText={setAreaCovered}
                />
              </View>

              {/* Contact # */}
              <View style={tw`relative`}>
                <View style={tw`absolute -top-3 left-7 bg-white px-2 z-10`}>
                  <Text style={tw`text-[#2E523A] text-base font-semibold`}>
                    Contact #
                  </Text>
                </View>
                <TextInput
                  style={tw`border-2 border-[#6C8770] rounded-[10px] px-4 py-3 bg-[rgba(255,255,255,0.79)] text-[#2E523A]`}
                  value={contact}
                  onChangeText={setContact}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Email */}
              <View style={tw`relative`}>
                <View style={tw`absolute -top-3 left-7 bg-white px-2 z-10`}>
                  <Text style={tw`text-[#2E523A] text-base font-semibold`}>
                    Email
                  </Text>
                </View>
                <TextInput
                  style={tw`border-2 border-[#6C8770] rounded-[10px] px-4 py-3 bg-[rgba(255,255,255,0.79)] text-[#2E523A]`}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Barangay */}
              <View style={tw`relative mb-0`}>
                <View style={tw`absolute -top-3 left-7 bg-white px-2 z-10`}>
                  <Text style={tw`text-[#2E523A] text-base font-semibold`}>
                    Barangay
                  </Text>
                </View>
                <TextInput
                  style={tw`border-2 border-[#6C8770] rounded-[10px] px-4 py-3 bg-[rgba(255,255,255,0.79)] text-[#2E523A]`}
                  value={barangay}
                  onChangeText={setBarangay}
                />
              </View>

              {/* Save Button */}
              {hasChanges && (
                <View style={tw`items-center mt-1 mb-2`}>
                  <Button
                    title="Save Changes"
                    onPress={handleSave}
                    variant="primary"
                    style={tw`w-[140px] py-2`}
                    textStyle={tw`text-sm`}
                  />
                </View>
              )}
            </View>
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

      <BottomNavbar
        currentPage="Back"
      />
    </SafeAreaView>
  );
}
