import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from '../utils/tailwind';
import { useResponsiveStyle } from '../utils/responsiveStyles';
import ResponsiveImage from '../components/primitives/ResponsiveImage';
import Svg, { Path } from 'react-native-svg';
import { Eye, EyeOff } from 'lucide-react-native';
import { login as apiLogin } from '../services/authService';
import { startGoogleSignIn } from '../services/googleauthService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/commons/Button';
import apiClient from '../services/apiClient';
import Snackbar from '../components/commons/Snackbar';
import { useSignIn } from '../hooks/signin/useSignIn';

type RootStackParamList = {
  Landing: undefined;
  SignIn: undefined;
  // allow passing prefilled signup fields when coming from SSO
  SignUp: { email?: string; firstName?: string; lastName?: string } | undefined;
  Dashboard: undefined;
  ODashboard: undefined; // operator (matches App.tsx)
  HDashboard: undefined; // household (matches App.tsx)
  // admin pending page accepts optional email
  AdminPending: { email?: string } | undefined;
  ForgotPassword: undefined; // ADD THIS
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

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUsername = (username: string) => {
  // treat anything with "@" as an email (reject) and require non-empty
  return username.trim().length > 0 && !username.includes('@');
};

export default function SignIn({ navigation }: Props) {
  const {
    username, setUsername,
    password, setPassword,
    showPassword, setShowPassword,
    usernameError, passwordError,
    usernameTouched, passwordTouched,
    setUsernameTouched, setPasswordTouched,
    setUsernameError, setPasswordError, // <-- add these
    loading, setLoading, // <-- add setLoading here
    snackbar, setSnackbar,
    handleUsernameBlur, handlePasswordBlur,
    handleSignIn,
  } = useSignIn(navigation);

  const handleGoogleSignIn = async () => {
    if (loading) return; // ✅
    try {
      setLoading(true);
      console.log('[SignIn] Starting Google sign-in...');
      
      const result = await startGoogleSignIn();

      if (result.status === 'success' && result.token) {
        await AsyncStorage.setItem('token', result.token);
        await AsyncStorage.setItem('user', JSON.stringify(result.user));

        if (result.user.role === 'admin') {
          navigation.replace('HDashboard');
        } else if (result.user.role === 'operator') {
          navigation.replace('ODashboard');
        } else {
          navigation.replace('HDashboard');
        }
      } else if (result.status === 'pending') {
        navigation.navigate('AdminPending', { email: result.email });
      } else if (result.status === 'signup') {
        navigation.navigate('SignUp', {
          email: result.email,
          firstName: result.firstName || '',
          lastName: result.lastName || '',
        });
      }
    } catch (error: any) {
      setSnackbar({
        visible: true,
        message: error?.message || 'Google sign-in failed',
        type: 'error',
      });
    } finally {
      setLoading(false);
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
        <KeyboardAwareScrollView
          enableOnAndroid
          extraScrollHeight={Platform.OS === 'ios' ? 20 : 120}
          keyboardOpeningTime={0}
          contentContainerStyle={tw`flex-grow`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[tw`flex-1 justify-center py-8`, styles.container]}>
            <View style={tw`items-center mb-8`}>
               <ResponsiveImage
                  source={require('../../assets/sibol-green-logo.png')}
                  aspectRatio={4}
                  maxWidthPercent={60}
                />
            </View>

            <View style={tw`gap-8`}>
              <Text style={[tw`text-center font-semibold text-[#100F14]`, styles.heading]}>
                Sign In
              </Text>

              <TouchableOpacity
                style={[
                  tw`flex-row items-center justify-center gap-4 py-4.5 px-5 border border-[#CBCAD7] rounded-[10px]`,
                  loading ? tw`opacity-50` : null, // ✅ visual cue
                ]}
                onPress={handleGoogleSignIn}
                disabled={loading} // ✅
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
                      ((usernameError || (!username.trim() && usernameTouched)) ? tw`border-red-500` : null),
                      styles.input,
                    ]}
                    placeholder="Enter your username"
                    placeholderTextColor="#686677"
                    value={username}
                    editable={!loading}                 // ✅ disable editing
                    selectTextOnFocus={!loading}        // ✅ prevents focus selection while disabled
                    onChangeText={text => {
                      if (loading) return;              // ✅ extra safety
                      setUsername(text);
                      if (text && !validateUsername(text)) {
                        setUsernameError('Please enter a valid username');
                      } else {
                        setUsernameError('');
                      }
                    }}
                    autoCapitalize="none"
                    onBlur={handleUsernameBlur}
                  />
                  {(usernameError || (!username.trim() && usernameTouched)) ? (
                    <Text style={tw`text-red-500 text-xs mt-1`}>
                      {usernameError || 'Username is required'}
                    </Text>
                  ) : null}
                </View>

                <View style={tw`gap-2`}>
                  <Text style={[tw`text-[#9794AA]`, styles.label]}>Password</Text>
                  <View style={tw`relative`}>
                    <TextInput
                      style={[
                        tw`border border-[#CBCAD7] rounded-md px-5 py-4.5 pr-12 text-[#686677]`,
                        ((passwordError || (!password && passwordTouched)) ? tw`border-red-500` : null),
                        styles.input,
                      ]}
                      placeholder="Enter your password"
                      placeholderTextColor="#686677"
                      value={password}
                      editable={!loading}                 // ✅ disable editing
                      selectTextOnFocus={!loading}        // ✅ prevents focus selection while disabled
                      onChangeText={text => {
                        if (loading) return;              // ✅ extra safety
                        setPassword(text);
                        if (!text || text.length === 0) {
                          setPasswordError('Password is required');
                        } else {
                          setPasswordError('');
                        }
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      onBlur={handlePasswordBlur}
                    />
                    <TouchableOpacity
                      style={[
                        tw`absolute right-4 top-1/2 -mt-3`,
                        loading ? tw`opacity-50` : null,
                      ]}
                      onPress={() => {
                        if (loading) return;
                        setShowPassword(!showPassword);
                      }}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff size={22} color="#49475A" />
                      ) : (
                        <Eye size={22} color="#49475A" />
                      )}
                    </TouchableOpacity>
                  </View>
                  {(passwordError || (!password && passwordTouched)) ? (
                    <Text style={tw`text-red-500 text-xs mt-1`}>
                      {passwordError || 'Password is required'}
                    </Text>
                  ) : null}
                </View>

                <TouchableOpacity 
                  style={tw`self-end`}
                  onPress={() => { if (!loading) navigation.navigate('ForgotPassword'); }}
                  disabled={loading}
                >
                  <Text style={[tw`text-[#686677]`, styles.label]}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <View style={tw`gap-5 mt-4`}>
                <Button
                  title={loading ? 'Signing in…' : 'Sign In'}
                  loading={loading}
                  textStyle={{ fontSize: 20 }}
                  onPress={() => { if (!loading) handleSignIn(); }}
                />

                <TouchableOpacity
                  onPress={() => { if (!loading) navigation.navigate('SignUp'); }}
                  disabled={loading}
                  style={loading ? tw`opacity-50` : null}
                >
                  <Text style={[tw`text-center`, styles.input]}>
                    <Text style={tw`text-[#49475A]`}>Don't have an account? </Text>
                    <Text style={tw`text-primary font-bold underline`}>Sign Up</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={() => setSnackbar(s => ({ ...s, visible: false }))}
      />
    </SafeAreaView>
  );
}
