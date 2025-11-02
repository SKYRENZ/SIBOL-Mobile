import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from '../utils/tailwind';
import { useResponsiveStyle } from '../utils/responsiveStyles';
import ResponsiveImage from '../components/primitives/ResponsiveImage';
import { useForgotPassword } from '../hooks/signup/useForgotPassword';
import OTPInput from '../components/OTPInput';
import Svg, { Path } from 'react-native-svg';

type RootStackParamList = {
  SignIn: undefined;
  ForgotPassword: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

interface Props {
  navigation: NavigationProp;
}

// Eye icons
const EyeIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5C8.24 5 5.04 7.27 3.65 10.5C5.04 13.73 8.24 16 12 16C15.76 16 18.96 13.73 20.35 10.5C18.96 7.27 15.76 5 12 5ZM12 14C10.34 14 9 12.66 9 11C9 9.34 10.34 8 12 8C13.66 8 15 9.34 15 11C15 12.66 13.66 14 12 14Z"
      fill="#686677"
    />
  </Svg>
);

const EyeOffIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 7C14.76 7 17.06 8.81 17.82 11.25L19.73 11.25C18.91 7.77 15.76 5 12 5C11.37 5 10.74 5.08 10.14 5.23L11.48 6.57C11.65 6.52 11.82 6.5 12 7ZM2.71 3.16C2.32 3.55 2.32 4.18 2.71 4.57L4.68 6.54C3.06 7.83 1.77 9.53 1 11.5C2.73 15.89 7 19 12 19C13.52 19 14.97 18.7 16.31 18.18L19.03 20.9C19.42 21.29 20.05 21.29 20.44 20.9C20.83 20.51 20.83 19.88 20.44 19.49L4.13 3.16C3.74 2.77 3.11 2.77 2.71 3.16ZM12 17C9.24 17 6.94 15.19 6.18 12.75L8.41 14.98C9.09 16.16 10.45 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 12.36 9.07 12.7 9.2 13.01L12.01 15.82C12.32 15.93 12.65 16 13 16C14.66 16 16 14.66 16 13C16 11.34 14.66 10 13 10Z"
      fill="#686677"
    />
  </Svg>
);

// Check/X icons
const CheckIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
      fill="#10B981"
    />
  </Svg>
);

const XIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
      fill="#EF4444"
    />
  </Svg>
);

export default function ForgotPassword({ navigation }: Props) {
  const {
    step,
    email,
    setEmail,
    code,
    setCode,
    newPassword,
    setNewPassword,
    loading,
    error,
    info,
    resendCooldown,
    canResend,
    emailValid,
    codeValid,
    passwordValid,
    sendResetRequest,
    verifyResetCode,
    submitNewPassword,
    resetState,
  } = useForgotPassword();

  // Local state for confirm password
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
    description: {
      fontSize: isSm ? 13 : 15,
    },
  }));

  const handleSubmit = async () => {
    try {
      if (step === 'email') {
        await sendResetRequest();
      } else if (step === 'verify') {
        await verifyResetCode();
      } else if (step === 'reset') {
        // Validate passwords match
        if (newPassword !== confirmPassword) {
          Alert.alert('Error', 'Passwords do not match');
          return;
        }
        await submitNewPassword();
      }
    } catch (err: any) {
      console.error('[ForgotPassword] Error:', err);
    }
  };

  const handleDone = () => {
    resetState();
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirm(false);
    navigation.navigate('SignIn');
  };

  // Password strength calculation
  const hasUpper = /[A-Z]/.test(newPassword || '');
  const hasLower = /[a-z]/.test(newPassword || '');
  const hasNumber = /\d/.test(newPassword || '');
  const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(newPassword || '');
  const hasLength = (newPassword || '').length >= 8;
  const score = [hasUpper, hasLower, hasNumber, hasSymbol, hasLength].filter(Boolean).length;

  const strengthLabel = 
    score <= 1 ? 'Very weak' : 
    score === 2 ? 'Weak' : 
    score === 3 ? 'Medium' : 
    score === 4 ? 'Strong' : 
    'Very strong';

  const strengthColor = 
    score <= 1 ? '#EF4444' : 
    score === 2 ? '#F87171' : 
    score === 3 ? '#FBBF24' : 
    score === 4 ? '#34D399' : 
    '#10B981';

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
            {/* Logo */}
            <View style={tw`items-center mb-8`}>
              <ResponsiveImage
                source={require('../../assets/sibol-green-logo.png')}
                aspectRatio={4}
                maxWidthPercent={60}
              />
            </View>

            <View style={tw`gap-6`}>
              {/* Heading */}
              <View style={tw`gap-2`}>
                <Text style={[tw`text-center font-semibold text-[#100F14]`, styles.heading]}>
                  {step === 'email' && 'Forgot Password?'}
                  {step === 'verify' && 'Verify Code'}
                  {step === 'reset' && 'Reset Password'}
                  {step === 'done' && 'Password Reset Successful'}
                </Text>
                <Text style={[tw`text-center text-[#686677]`, styles.description]}>
                  {step === 'email' && 'Enter your email address and we\'ll send you a verification code.'}
                  {step === 'verify' && 'Enter the 6-digit code sent to your email.'}
                  {step === 'reset' && 'Enter your new password.'}
                  {step === 'done'}
                </Text>
              </View>

              {/* Error Message */}
              {error && (
                <View style={tw`bg-red-50 border border-red-200 rounded-md p-4`}>
                  <Text style={tw`text-red-700 text-center`}>{error}</Text>
                </View>
              )}

              {/* Info Message */}
              {info && (
                <View style={tw`bg-green-50 border border-green-200 rounded-md p-4`}>
                  <Text style={tw`text-green-700 text-center`}>{info}</Text>
                </View>
              )}

              {/* Step 1: Email Input */}
              {step === 'email' && (
                <View style={tw`gap-2`}>
                  <Text style={[tw`text-[#9794AA]`, styles.label]}>Email</Text>
                  <TextInput
                    style={[
                      tw`border border-[#CBCAD7] rounded-md px-5 py-4.5 text-[#686677]`,
                      !emailValid && email ? tw`border-red-500` : null,
                      styles.input,
                    ]}
                    placeholder="Enter your email"
                    placeholderTextColor="#686677"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                  />
                </View>
              )}

              {/* Step 2: OTP Code Input */}
              {step === 'verify' && (
                <View style={tw`gap-4`}>
                  <Text style={[tw`text-[#9794AA] text-center`, styles.label]}>
                    Verification Code
                  </Text>
                  
                  <OTPInput
                    length={6}
                    value={code}
                    onChange={setCode}
                    disabled={loading}
                    error={!codeValid && code.length === 6}
                  />

                  {/* Resend Code */}
                  <TouchableOpacity
                    onPress={sendResetRequest}
                    disabled={!canResend || loading}
                    style={tw`self-center mt-2`}
                  >
                    <Text style={[
                      tw`text-primary font-medium`,
                      (!canResend || loading) && tw`opacity-50`,
                      styles.label
                    ]}>
                      {canResend ? 'Resend Code' : `Resend in ${resendCooldown}s`}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 3: New Password Input - UPDATED */}
              {step === 'reset' && (
                <View style={tw`gap-4`}>
                  {/* New Password */}
                  <View style={tw`gap-2`}>
                    <Text style={[tw`text-[#9794AA]`, styles.label]}>New Password</Text>
                    <View style={tw`relative`}>
                      <TextInput
                        style={[
                          tw`border border-[#CBCAD7] rounded-md px-5 py-4.5 pr-12 text-[#686677]`,
                          styles.input,
                        ]}
                        placeholder="Enter new password"
                        placeholderTextColor="#686677"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        editable={!loading}
                      />
                      <TouchableOpacity
                        style={tw`absolute right-5 top-0 h-full justify-center`}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Confirm Password */}
                  <View style={tw`gap-2`}>
                    <Text style={[tw`text-[#9794AA]`, styles.label]}>Confirm Password</Text>
                    <View style={tw`relative`}>
                      <TextInput
                        style={[
                          tw`border border-[#CBCAD7] rounded-md px-5 py-4.5 pr-12 text-[#686677]`,
                          styles.input,
                        ]}
                        placeholder="Confirm new password"
                        placeholderTextColor="#686677"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirm}
                        autoCapitalize="none"
                        editable={!loading}
                      />
                      <TouchableOpacity
                        style={tw`absolute right-5 top-0 h-full justify-center`}
                        onPress={() => setShowConfirm(!showConfirm)}
                      >
                        {showConfirm ? <EyeIcon /> : <EyeOffIcon />}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Password Match Indicator */}
                  {confirmPassword.length > 0 && (
                    <View style={tw`flex-row items-center gap-2`}>
                      {newPassword === confirmPassword ? <CheckIcon /> : <XIcon />}
                      <Text style={tw`text-sm ${newPassword === confirmPassword ? 'text-green-700' : 'text-red-700'}`}>
                        {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                      </Text>
                    </View>
                  )}

                  {/* Password Strength Bar */}
                  <View style={tw`gap-2`}>
                    <View style={tw`flex-row items-center gap-2`}>
                      <View style={tw`flex-1 h-2 rounded-full bg-gray-200 flex-row gap-1 overflow-hidden`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <View
                            key={i}
                            style={[
                              tw`flex-1`,
                              { backgroundColor: i < score ? strengthColor : '#E5E7EB' }
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={[tw`text-xs font-medium text-gray-700`, { fontSize: 12 }]}>
                        {strengthLabel}
                      </Text>
                    </View>

                    {/* Password Requirements */}
                    <View style={tw`gap-1`}>
                      <View style={tw`flex-row items-center gap-2`}>
                        {hasLength ? <CheckIcon /> : <XIcon />}
                        <Text style={tw`text-xs ${hasLength ? 'text-gray-800' : 'text-gray-500'}`}>
                          At least 8 characters
                        </Text>
                      </View>
                      <View style={tw`flex-row items-center gap-2`}>
                        {hasUpper ? <CheckIcon /> : <XIcon />}
                        <Text style={tw`text-xs ${hasUpper ? 'text-gray-800' : 'text-gray-500'}`}>
                          At least 1 uppercase letter
                        </Text>
                      </View>
                      <View style={tw`flex-row items-center gap-2`}>
                        {hasLower ? <CheckIcon /> : <XIcon />}
                        <Text style={tw`text-xs ${hasLower ? 'text-gray-800' : 'text-gray-500'}`}>
                          At least 1 lowercase letter
                        </Text>
                      </View>
                      <View style={tw`flex-row items-center gap-2`}>
                        {hasNumber ? <CheckIcon /> : <XIcon />}
                        <Text style={tw`text-xs ${hasNumber ? 'text-gray-800' : 'text-gray-500'}`}>
                          At least 1 number
                        </Text>
                      </View>
                      <View style={tw`flex-row items-center gap-2`}>
                        {hasSymbol ? <CheckIcon /> : <XIcon />}
                        <Text style={tw`text-xs ${hasSymbol ? 'text-gray-800' : 'text-gray-500'}`}>
                          At least 1 symbol
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Submit Button */}
              {step !== 'done' && (
                <TouchableOpacity
                  style={[
                    tw`bg-primary py-4.5 rounded-[40px] items-center justify-center mt-4`,
                    loading ? tw`opacity-50` : null,
                  ]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  <Text style={[tw`text-white font-medium`, { fontSize: 20 }]}>
                    {loading && 'Processing...'}
                    {!loading && step === 'email' && 'Send Code'}
                    {!loading && step === 'verify' && 'Verify Code'}
                    {!loading && step === 'reset' && 'Reset Password'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Done Button */}
              {step === 'done' && (
                <TouchableOpacity
                  style={tw`bg-primary py-4.5 rounded-[40px] items-center justify-center mt-4`}
                  onPress={handleDone}
                >
                  <Text style={[tw`text-white font-medium`, { fontSize: 20 }]}>
                    Back to Sign In
                  </Text>
                </TouchableOpacity>
              )}

              {/* Back to Sign In (except on done step) */}
              {step !== 'done' && (
                <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                  <Text style={[tw`text-center text-primary font-medium`, styles.input]}>
                    Back to Sign In
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}