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
import tw from '../utils/tailwind';
import { Pencil } from 'lucide-react-native';
import BottomNavbar from '../components/oBotNav';
import Button from '../components/commons/Button';
import AreaCovered from '../components/AreaCovered';

export default function OProfile() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'personal' | 'area'>('personal');
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Form values
  const [firstName, setFirstName] = useState('Juan');
  const [lastName, setLastName] = useState('Dela Cruz');
  const [areaCovered, setAreaCovered] = useState('Zone 1, District 2');
  const [city, setCity] = useState('Manila');
  const [address, setAddress] = useState('123 Mabini Street, Poblacion');
  const [barangay, setBarangay] = useState('Barangay 123');

  // Original values for change detection
  const [originalValues, setOriginalValues] = useState({
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    areaCovered: 'Zone 1, District 2',
    city: 'Manila',
    address: '123 Mabini Street, Poblacion',
    barangay: 'Barangay 123',
  });

  const hasChanges =
    firstName !== originalValues.firstName ||
    lastName !== originalValues.lastName ||
    areaCovered !== originalValues.areaCovered ||
    city !== originalValues.city ||
    address !== originalValues.address ||
    barangay !== originalValues.barangay;

  const handleSave = () => {
    setOriginalValues({
      firstName,
      lastName,
      areaCovered,
      city,
      address,
      barangay,
    });
    Alert.alert('Success', 'Changes saved successfully!');
  };

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
                User#39239
              </Text>
              <Text style={tw`text-[#2E523A] text-[13px] font-semibold`}>
                email.email@gmail.com
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

              {/* City */}
              <View style={tw`relative`}>
                <View style={tw`absolute -top-3 left-7 bg-white px-2 z-10`}>
                  <Text style={tw`text-[#2E523A] text-base font-semibold`}>
                    City
                  </Text>
                </View>
                <TextInput
                  style={tw`border-2 border-[#6C8770] rounded-[10px] px-4 py-3 bg-[rgba(255,255,255,0.79)] text-[#2E523A]`}
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              {/* House #, Street and Area */}
              <View style={tw`relative`}>
                <View style={tw`absolute -top-3 left-7 bg-white px-2 z-10`}>
                  <Text style={tw`text-[#2E523A] text-base font-semibold`}>
                    House #, Street and Area
                  </Text>
                </View>
                <TextInput
                  style={tw`border-2 border-[#6C8770] rounded-[10px] px-4 py-3 bg-[rgba(255,255,255,0.79)] text-[#2E523A]`}
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  textAlignVertical="top"
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
