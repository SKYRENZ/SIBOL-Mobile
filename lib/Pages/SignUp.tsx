import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import tw from '../utils/tailwind';
import { useResponsiveStyle } from '../utils/responsiveStyles';
import ResponsiveImage from '../components/primitives/ResponsiveImage';
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';

type RootStackParamList = {
  Landing: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Dashboard: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignUp'>;

interface Props {
  navigation: NavigationProp;
}

const HelpCircleIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
    <G clipPath="url(#clip0_2245_2137)">
      <Path
        d="M4.545 4.5C4.66255 4.16583 4.89458 3.88405 5.19998 3.70457C5.50538 3.52508 5.86445 3.45947 6.21359 3.51936C6.56273 3.57924 6.87941 3.76076 7.10754 4.03176C7.33567 4.30277 7.46053 4.64576 7.46 5C7.46 6 5.96 6.5 5.96 6.5M6 8.5H6.005M11 6C11 8.76142 8.76142 11 6 11C3.23858 11 1 8.76142 1 6C1 3.23858 3.23858 1 6 1C8.76142 1 11 3.23858 11 6Z"
        stroke="#88AB8E"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_2245_2137">
        <Rect width={12} height={12} fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);

const UploadIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
    <Path
      d="M5.25 9V2.8875L3.3 4.8375L2.25 3.75L6 0L9.75 3.75L8.7 4.8375L6.75 2.8875V9H5.25ZM1.5 12C1.0875 12 0.734375 11.8531 0.440625 11.5594C0.146875 11.2656 0 10.9125 0 10.5V8.25H1.5V10.5H10.5V8.25H12V10.5C12 10.9125 11.8531 11.2656 11.5594 11.5594C11.2656 11.8531 10.9125 12 10.5 12H1.5Z"
      fill="#2E523A"
    />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.3333 14.5L8 12.3723L8.81667 11.6277L10.3333 13.0106L14.1833 9.5L15 10.2447L10.3333 14.5Z"
      fill="white"
    />
  </Svg>
);

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function SignUp({ navigation }: Props) {
  const [role, setRole] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [barangay, setBarangay] = useState('');
  const [idImage, setIdImage] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showBarangayPicker, setShowBarangayPicker] = useState(false);

  const roles = ['Household', 'Operator'];
  const barangays = [
    'Barangay 171',
    'Barangay 172',
    'Barangay 173',
    'Barangay 174',
    'Barangay 175',
  ];

  const styles = useResponsiveStyle(({ isSm }) => ({
    container: {
      paddingHorizontal: isSm ? 20 : 40,
    },
    heading: {
      fontSize: isSm ? 24 : 28,
    },
    subheading: {
      fontSize: isSm ? 16 : 18,
    },
    input: {
      fontSize: isSm ? 14 : 16,
    },
    label: {
      fontSize: isSm ? 14 : 16,
    },
  }));

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setIdImage(result.assets[0].uri);
    }
  };

  const handleCreateAccount = () => {
    if (!role || !firstName || !lastName || !email || !barangay || !idImage || !acceptedTerms) {
      Alert.alert('Missing Information', 'Please fill in all fields and accept the terms');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    navigation.navigate('Dashboard');
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <ScrollView
          contentContainerStyle={tw`flex-grow`}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[tw`flex-1 py-8`, styles.container]}>
            <Text style={[tw`text-center font-bold text-primary mb-6`, styles.heading]}>
              Sign up
            </Text>

            <View style={tw`items-center mb-6`}>

              <ResponsiveImage
  source={require('../../assets/sibol-green-logo.png')}
  aspectRatio={4}
  maxWidthPercent={60}
/>
            </View>

            <Text style={[tw`text-center font-bold text-primary mb-4`, styles.subheading]}>
              You're creating an account as?
            </Text>

            <View style={tw`gap-4`}>
              <TouchableOpacity
                style={tw`border-2 border-text-gray rounded-[10px] px-4 py-3 bg-white bg-opacity-80`}
                onPress={() => setShowRolePicker(!showRolePicker)}
              >
                <Text style={[tw`text-[#686677]`, styles.input]}>
                  {role || 'Select Role'}
                </Text>
              </TouchableOpacity>

              {showRolePicker && (
                <View style={tw`border border-text-gray rounded-[10px] bg-white`}>
                  {roles.map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={tw`px-4 py-3 border-b border-gray-200`}
                      onPress={() => {
                        setRole(r);
                        setShowRolePicker(false);
                      }}
                    >
                      <Text style={[tw`text-primary`, styles.input]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View>
                <Text style={[tw`text-primary mb-2`, styles.label]}>First Name</Text>
                <TextInput
                  style={[
                    tw`border-2 border-text-gray rounded-[10px] px-4 py-3 bg-white bg-opacity-80 text-[#686677]`,
                    styles.input,
                  ]}
                  placeholder="First Name"
                  placeholderTextColor="#686677"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>

              <View>
                <Text style={[tw`text-primary mb-2`, styles.label]}>Last Name</Text>
                <TextInput
                  style={[
                    tw`border-2 border-text-gray rounded-[10px] px-4 py-3 bg-white bg-opacity-80 text-[#686677]`,
                    styles.input,
                  ]}
                  placeholder="Last Name"
                  placeholderTextColor="#686677"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>

              <View>
                <Text style={[tw`text-primary mb-2`, styles.label]}>Email</Text>
                <TextInput
                  style={[
                    tw`border-2 border-text-gray rounded-[10px] px-4 py-3 bg-white bg-opacity-80 text-[#686677]`,
                    emailError ? tw`border-red-500` : null,
                    styles.input,
                  ]}
                  placeholder="Email"
                  placeholderTextColor="#686677"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (text && !validateEmail(text)) {
                      setEmailError('Please enter a valid email address');
                    } else {
                      setEmailError('');
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {emailError ? (
                  <Text style={tw`text-red-500 text-xs mt-1`}>{emailError}</Text>
                ) : null}
              </View>

              <View>
                <Text style={[tw`text-primary mb-2`, styles.label]}>Barangay</Text>
                <TouchableOpacity
                  style={tw`border-2 border-text-gray rounded-[10px] px-4 py-3 bg-white bg-opacity-80`}
                  onPress={() => setShowBarangayPicker(!showBarangayPicker)}
                >
                  <Text style={[tw`text-[#686677]`, styles.input]}>
                    {barangay || 'Select Barangay'}
                  </Text>
                </TouchableOpacity>

                {showBarangayPicker && (
                  <View style={tw`border border-text-gray rounded-[10px] bg-white mt-2`}>
                    {barangays.map((b) => (
                      <TouchableOpacity
                        key={b}
                        style={tw`px-4 py-3 border-b border-gray-200`}
                        onPress={() => {
                          setBarangay(b);
                          setShowBarangayPicker(false);
                        }}
                      >
                        <Text style={[tw`text-primary`, styles.input]}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={tw`flex-row items-center justify-center gap-2 mt-2`}>
                <View style={tw`flex-1 h-[1px] bg-[#88AB8E] opacity-80`} />
                <Text
                  style={[
                    tw`text-center text-primary opacity-70`,
                    { fontSize: 11, fontWeight: '600' },
                  ]}
                >
                  Please upload a Valid ID for verification
                </Text>
                <HelpCircleIcon />
                <View style={tw`flex-1 h-[1px] bg-[#88AB8E] opacity-80`} />
              </View>

              <View>
                <Text style={[tw`text-primary mb-2`, styles.label]}>Upload an Image</Text>
                <TouchableOpacity
                  style={tw`border-2 border-text-gray rounded-[10px] px-4 py-3 bg-white bg-opacity-80 flex-row items-center justify-between`}
                  onPress={handleImagePick}
                >
                  <Text style={[tw`text-[#686677]`, styles.input]}>
                    {idImage ? 'Image Selected ✓' : 'Select Image'}
                  </Text>
                  <UploadIcon />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={tw`flex-row items-center gap-2 mt-2`}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
              >
                <View
                  style={tw`w-5 h-5 rounded-[5px] ${
                    acceptedTerms ? 'bg-primary' : 'border-2 border-text-gray bg-white'
                  } items-center justify-center`}
                >
                  {acceptedTerms && <CheckIcon />}
                </View>
                <Text style={[tw`text-primary`, { fontSize: 11, fontWeight: '600' }]}>
                  I accept the terms and privacy policy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`bg-primary py-4 rounded-[10px] items-center justify-center mt-4 border-2 border-primary`}
                onPress={handleCreateAccount}
              >
                <Text style={[tw`text-[#FFFDF4] font-bold`, { fontSize: 16 }]}>
                  Create account
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={tw`mt-4`}>
                <Text style={[tw`text-center text-primary`, { fontSize: 16, fontWeight: '600' }]}>
                  Already have an account?{' '}
                  <Text style={tw`underline font-bold`}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
