import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from '../utils/tailwind';
import { useResponsiveStyle } from '../utils/responsiveStyles';
import ResponsiveImage from '../components/primitives/ResponsiveImage';
import Svg, { Path } from 'react-native-svg';

type RootStackParamList = {
  Landing: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Dashboard: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignIn'>;

interface Props {
  navigation: NavigationProp;
}

const GoogleIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
    <Path
      d="M25.4398 11.715H24.5V11.6666H14V16.3333H20.5935C19.6315 19.0498 17.0468 20.9999 14 20.9999C10.1343 20.9999 7.00004 17.8657 7.00004 13.9999C7.00004 10.1342 10.1343 6.99992 14 6.99992C15.7845 6.99992 17.4079 7.67309 18.644 8.77267L21.9439 5.47275C19.8602 3.53084 17.073 2.33325 14 2.33325C7.55712 2.33325 2.33337 7.557 2.33337 13.9999C2.33337 20.4428 7.55712 25.6666 14 25.6666C20.443 25.6666 25.6667 20.4428 25.6667 13.9999C25.6667 13.2177 25.5862 12.4541 25.4398 11.715Z"
      fill="#FFC107"
    />
    <Path
      d="M3.67847 8.56967L7.51155 11.3808C8.54872 8.81292 11.0606 6.99992 14 6.99992C15.7844 6.99992 17.4078 7.67308 18.6439 8.77267L21.9438 5.47275C19.8601 3.53084 17.073 2.33325 14 2.33325C9.5188 2.33325 5.63263 4.86317 3.67847 8.56967Z"
      fill="#FF3D00"
    />
    <Path
      d="M14 25.6666C17.0135 25.6666 19.7517 24.5133 21.8219 22.6379L18.2111 19.5824C17.0004 20.5031 15.521 21.0011 14 20.9999C10.9655 20.9999 8.38894 19.065 7.41827 16.3647L3.61377 19.296C5.5446 23.0742 9.46577 25.6666 14 25.6666Z"
      fill="#4CAF50"
    />
    <Path
      d="M25.4398 11.7152H24.5V11.6667H14V16.3334H20.5934C20.1333 17.6263 19.3045 18.7561 18.2093 19.5832L18.2111 19.582L21.8219 22.6375C21.5664 22.8697 25.6667 19.8334 25.6667 14.0001C25.6667 13.2178 25.5862 12.4542 25.4398 11.7152Z"
      fill="#1976D2"
    />
  </Svg>
);

const EyeOffIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4.53033 3.46967C4.23744 3.17678 3.76256 3.17678 3.46967 3.46967C3.17678 3.76256 3.17678 4.23744 3.46967 4.53033L4.53033 3.46967ZM19.4697 20.5303C19.7626 20.8232 20.2374 20.8232 20.5303 20.5303C20.8232 20.2374 20.8232 19.7626 20.5303 19.4697L19.4697 20.5303ZM14.5002 14.795C14.8088 14.5187 14.8351 14.0446 14.5589 13.7359C14.2826 13.4273 13.8085 13.401 13.4998 13.6773L14.5002 14.795ZM10.3227 10.5002C10.599 10.1915 10.5727 9.71739 10.2641 9.44115C9.95543 9.1649 9.48129 9.19117 9.20504 9.49981L10.3227 10.5002ZM19.1153 15.0421C18.8029 15.314 18.7701 15.7878 19.0421 16.1002C19.3141 16.4126 19.7878 16.4453 20.1002 16.1734L19.1153 15.0421ZM9.18831 4.69699C8.79307 4.82092 8.57313 5.24179 8.69705 5.63703C8.82098 6.03227 9.24185 6.25221 9.63709 6.12829L9.18831 4.69699ZM6.90354 7.43556C7.25269 7.21269 7.35505 6.74898 7.13218 6.39984C6.90931 6.0507 6.4456 5.94833 6.09646 6.1712L6.90354 7.43556ZM17.5515 18.0471C17.9064 17.8335 18.021 17.3727 17.8075 17.0177C17.5939 16.6628 17.1331 16.5482 16.7782 16.7618L17.5515 18.0471ZM3.46967 4.53033L19.4697 20.5303L20.5303 19.4697L4.53033 3.46967L3.46967 4.53033ZM8.25 12C8.25 14.0711 9.92893 15.75 12 15.75V14.25C10.7574 14.25 9.75 13.2426 9.75 12H8.25ZM12 15.75C12.96 15.75 13.8372 15.3883 14.5002 14.795L13.4998 13.6773C13.1012 14.034 12.5767 14.25 12 14.25V15.75ZM9.20504 9.49981C8.61169 10.1628 8.25 11.04 8.25 12H9.75C9.75 11.4233 9.96602 10.8988 10.3227 10.5002L9.20504 9.49981ZM2.32608 14.6636C4.2977 16.738 7.84898 19.75 12 19.75V18.25C8.51999 18.25 5.35328 15.6713 3.41334 13.6302L2.32608 14.6636ZM21.6739 9.33641C19.7023 7.26198 16.151 4.25 12 4.25V5.75C15.48 5.75 18.6467 8.32869 20.5867 10.3698L21.6739 9.33641ZM21.6739 14.6636C23.1087 13.154 23.1087 10.846 21.6739 9.33641L20.5867 10.3698C21.4711 11.3004 21.4711 12.6996 20.5867 13.6302L21.6739 14.6636ZM3.41334 13.6302C2.52889 12.6996 2.52889 11.3004 3.41334 10.3698L2.32608 9.33641C0.891307 10.846 0.891306 13.154 2.32608 14.6636L3.41334 13.6302ZM20.1002 16.1734C20.6921 15.6581 21.2202 15.1409 21.6739 14.6636L20.5867 13.6302C20.1602 14.0789 19.6662 14.5624 19.1153 15.0421L20.1002 16.1734ZM12 4.25C11.0225 4.25 10.0801 4.41736 9.18831 4.69699L9.63709 6.12829C10.4042 5.88776 11.1948 5.75 12 5.75V4.25ZM6.09646 6.1712C4.57051 7.14527 3.28015 8.33259 2.32608 9.33641L3.41334 10.3698C4.31512 9.42098 5.51237 8.3236 6.90354 7.43556L6.09646 6.1712ZM12 19.75C14.0476 19.75 15.9403 19.0165 17.5515 18.0471L16.7782 16.7618C15.3131 17.6433 13.6886 18.25 12 18.25V19.75Z"
      fill="#49475A"
    />
  </Svg>
);

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function SignIn({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (text && !validateEmail(text)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const styles = useResponsiveStyle(({ isSm }) => ({
    container: {
      paddingHorizontal: isSm ? 20 : 40,
    },
    heading: {
      fontSize: isSm ? 20 : 24,
    },
    input: {
      fontSize: isSm ? 14 : 16,
    },
    label: {
      fontSize: isSm ? 14 : 16,
    },
  }));

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
          <View style={[tw`flex-1 justify-center py-8`, styles.container]}>
            <View style={tw`items-center mb-8`}>
              <ResponsiveImage
                source={require('../../assets/sibol-green-logo.png')}
                aspectRatio={2}
                maxWidthPercent={60}
              />
            </View>

            <View style={tw`gap-8`}>
              <Text style={[tw`text-center font-semibold text-[#100F14]`, styles.heading]}>
                Sign In
              </Text>

              <TouchableOpacity
                style={tw`flex-row items-center justify-center gap-4 py-4.5 px-5 border border-[#CBCAD7] rounded-[10px]`}
              >
                <Text style={[tw`text-[#19181F]`, styles.input]}>Sign In with Google</Text>
                <GoogleIcon />
              </TouchableOpacity>

              <View style={tw`flex-row items-center gap-5`}>
                <View style={tw`flex-1 h-[1.5px] bg-[#CBCAD7] opacity-80`} />
                <Text style={[tw`text-[#686677]`, styles.input]}>Or</Text>
                <View style={tw`flex-1 h-[1.5px] bg-[#CBCAD7] opacity-80`} />
              </View>

              <View style={tw`gap-5`}>
                <View style={tw`gap-2`}>
                  <Text style={[tw`text-[#9794AA]`, styles.label]}>Username</Text>
                  <TextInput
                    style={[
                      tw`border border-[#CBCAD7] rounded-md px-5 py-4.5 text-[#686677]`,
                      emailError ? tw`border-red-500` : null,
                      styles.input,
                    ]}
                    placeholder="Enter your email address"
                    placeholderTextColor="#686677"
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {emailError ? (
                    <Text style={tw`text-red-500 text-xs mt-1`}>{emailError}</Text>
                  ) : null}
                </View>

                <View style={tw`gap-2`}>
                  <Text style={[tw`text-[#9794AA]`, styles.label]}>Password</Text>
                  <View style={tw`relative`}>
                    <TextInput
                      style={[
                        tw`border border-[#CBCAD7] rounded-md px-5 py-4.5 pr-12 text-[#686677]`,
                        styles.input,
                      ]}
                      placeholder="Enter your password"
                      placeholderTextColor="#686677"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={tw`absolute right-5 top-0 h-full justify-center`}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <EyeOffIcon />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={tw`self-end`}>
                  <Text style={[tw`text-[#686677]`, styles.label]}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <View style={tw`gap-5 mt-4`}>
                <TouchableOpacity
                  style={tw`bg-primary py-4.5 rounded-[40px] items-center justify-center`}
                  onPress={() => {
                    if (!validateEmail(email)) {
                      setEmailError('Please enter a valid email address');
                      return;
                    }
                    navigation.navigate('Dashboard');
                  }}
                >
                  <Text style={[tw`text-white font-medium`, { fontSize: 20 }]}>Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                  <Text style={[tw`text-center`, styles.input]}>
                    <Text style={tw`text-[#49475A]`}>Don't have an account? </Text>
                    <Text style={tw`text-primary font-bold underline`}>Sign Up</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
