import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Pencil } from 'lucide-react-native';
import tw from '../utils/tailwind';
import Button from '../components/commons/Button';

type HProfileEditRouteParams = {
  initialData?: {
    username?: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    areaCovered?: string;
    contact?: string;
    email?: string;
    barangay?: string;
  };
};

export default function HProfileEdit() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ HProfileEdit: HProfileEditRouteParams }, 'HProfileEdit'>>();

  const initialUsername = route.params?.initialData?.username ?? '';
  const initialFirstName = route.params?.initialData?.firstName ?? '';
  const initialLastName = route.params?.initialData?.lastName ?? '';
  const initialAddress = route.params?.initialData?.address ?? '';
  const initialAreaCovered = route.params?.initialData?.areaCovered ?? '';
  const initialContact = route.params?.initialData?.contact ?? '';
  const initialEmail = route.params?.initialData?.email ?? '';
  const initialBarangay = route.params?.initialData?.barangay ?? '';

  const [username, setUsername] = useState(initialUsername);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [address, setAddress] = useState(initialAddress);
  const [areaCovered, setAreaCovered] = useState(initialAreaCovered);
  const [contact, setContact] = useState(initialContact);
  const [email, setEmail] = useState(initialEmail);
  const [barangay, setBarangay] = useState(initialBarangay);

  const hasChanges =
    username !== initialUsername ||
    firstName !== initialFirstName ||
    lastName !== initialLastName ||
    address !== initialAddress ||
    areaCovered !== initialAreaCovered ||
    contact !== initialContact ||
    email !== initialEmail ||
    barangay !== initialBarangay;

  const handleSave = () => {
    if (!hasChanges) {
      navigation.goBack();
      return;
    }

    navigation.navigate({
      name: 'HProfile',
      params: {
        updatedData: {
          username,
          firstName,
          lastName,
          address,
          areaCovered,
          contact,
          email,
          barangay,
        },
      },
      merge: true,
    } as never);

    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#2E523A]`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-24`}
        keyboardShouldPersistTaps="handled"
      >
        <View style={tw`px-8 pt-12 pb-6`}>
          <Text style={tw`text-[#FFFDF4] text-2xl font-extrabold text-left`}>
            Edit Profile - Household
          </Text>
        </View>

        <View style={tw`bg-white rounded-t-[50px] px-7 pt-8 pb-24 min-h-[600px] mt-5`}>
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
                  activeOpacity={0.7}
                  onPress={handleCancel}
                >
                  <Pencil color="#2E523A" size={24} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={tw`justify-center flex-1`}>
              <Text style={tw`text-[#2E523A] text-xl font-bold mb-2`}>
                {username || '—'}
              </Text>
              <Text style={tw`text-[#2E523A] text-[13px] font-semibold`}>
                {email || '—'}
              </Text>
            </View>
          </View>

          <View style={tw`gap-5`}>
            <View style={tw`relative`}>
              <View style={tw`absolute -top-3 left-7 bg-white px-2 z-10`}>
                <Text style={tw`text-[#2E523A] text-base font-semibold`}>
                  Username
                </Text>
              </View>
              <TextInput
                style={tw`border-2 border-[#6C8770] rounded-[10px] px-4 py-3 bg-[rgba(255,255,255,0.79)] text-[#2E523A]`}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor="#9E9E9E"
                autoCapitalize="none"
              />
            </View>

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
                placeholder="Enter first name"
                placeholderTextColor="#9E9E9E"
              />
            </View>

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
                placeholder="Enter last name"
                placeholderTextColor="#9E9E9E"
              />
            </View>

            <View style={tw`relative`}>
              <View style={tw`absolute -top-3 left-7 bg-white px-2 z-10`}>
                <Text style={tw`text-[#2E523A] text-base font-semibold`}>
                  Address
                </Text>
              </View>
              <TextInput
                style={[
                  tw`border-2 border-[#6C8770] rounded-[10px] px-4 py-3 bg-[rgba(255,255,255,0.79)] text-[#2E523A]`,
                  { minHeight: 120, textAlignVertical: 'top' },
                ]}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter address"
                placeholderTextColor="#9E9E9E"
                multiline
              />
            </View>

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
                placeholder="Enter area covered"
                placeholderTextColor="#9E9E9E"
              />
            </View>

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
                placeholder="Enter contact number"
                placeholderTextColor="#9E9E9E"
                keyboardType="phone-pad"
              />
            </View>

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
                placeholder="Enter email"
                placeholderTextColor="#9E9E9E"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={tw`relative`}>
              <View style={tw`absolute -top-3 left-7 bg-white px-2 z-10`}>
                <Text style={tw`text-[#2E523A] text-base font-semibold`}>
                  Barangay
                </Text>
              </View>
              <TextInput
                style={tw`border-2 border-[#6C8770] rounded-[10px] px-4 py-3 bg-[rgba(255,255,255,0.79)] text-[#2E523A]`}
                value={barangay}
                onChangeText={setBarangay}
                placeholder="Enter barangay"
                placeholderTextColor="#9E9E9E"
              />
            </View>
          </View>

          {hasChanges && (
            <View style={tw`items-center mt-8`}>
              <Button
                title="Save Changes"
                onPress={handleSave}
                variant="primary"
                style={tw`w-[160px] py-2`}
                textStyle={tw`text-sm`}
              />
            </View>
          )}

          <TouchableOpacity onPress={handleCancel} style={tw`mt-6 self-center`} activeOpacity={0.7}>
            <Text style={tw`text-[#6C8770] text-sm font-semibold`}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
