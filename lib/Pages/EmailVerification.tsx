import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import tw from '../utils/tailwind';
import { useResponsiveStyle } from '../utils/responsiveStyles';
import { useEmailVerification } from '../hooks/signup/useEmailVerification';
import OTPInput from '../components/OTPInput';
import ResponsiveImage from '../components/primitives/ResponsiveImage';

type RootStackParamList = {
  SignUp: undefined;
  SignIn: undefined;
  Landing: undefined;
  Dashboard: undefined;
  AdminPending: { email?: string } | undefined;
  VerifyEmail: { email?: string } | undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'VerifyEmail'>;
type Route = RouteProp<RootStackParamList, 'VerifyEmail'>;

interface Props {
  navigation: NavigationProp;
  route?: Route;
}

export default function EmailVerification({ navigation, route }: Props) {
  const initialEmail = route?.params?.email ?? '';
  const {
    email,
    status,
    message,
    resendCooldown,
    canResend,
    verifyCode: verifyCodeApi,
    sendVerificationCode,
  } = useEmailVerification(initialEmail);

  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [localResendCooldown, setLocalResendCooldown] = useState(resendCooldown || 0);

  const styles = useResponsiveStyle(({ isSm }) => ({
    container: {
      paddingHorizontal: isSm ? 20 : 40,
    },
    heading: {
      fontSize: isSm ? 20 : 24,
    },
    label: {
      fontSize: isSm ? 14 : 16,
    },
    description: {
      fontSize: isSm ? 13 : 15,
    },
  }));

  // Countdown timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (localResendCooldown > 0) {
      interval = setInterval(() => {
        setLocalResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [localResendCooldown]);

  const handleVerify = async () => {
    if (code.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the complete 6-digit code.');
      return;
    }

    setVerifying(true);
    try {
      await verifyCodeApi(code, email);
      Alert.alert('Success', 'Email verified successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('AdminPending', { email }),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Verification Failed', err?.message || 'Invalid code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || localResendCooldown > 0) return;

    setSending(true);
    try {
      await sendVerificationCode(email);
      setLocalResendCooldown(60);
      Alert.alert('Code Sent', `A new verification code has been sent to ${email}`);
    } catch (err: any) {
      Alert.alert('Failed to Send', err?.message || 'Could not send verification code');
    } finally {
      setSending(false);
    }
  };

  const isCodeComplete = code.length === 6;
  const canResendNow = canResend && localResendCooldown === 0;

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
                  Email Verification
                </Text>
                <Text style={[tw`text-center text-[#686677]`, styles.description]}>
                  Enter the 6-digit code sent to
                </Text>
                <Text style={[tw`text-center text-primary font-semibold`, styles.description]}>
                  {email}
                </Text>
              </View>

              {/* Status Message */}
              {message && status === 'error' && (
                <View style={tw`bg-red-50 border border-red-200 rounded-md p-4`}>
                  <Text style={tw`text-red-700 text-center`}>{message}</Text>
                </View>
              )}

              {message && status === 'success' && (
                <View style={tw`bg-green-50 border border-green-200 rounded-md p-4`}>
                  <Text style={tw`text-green-700 text-center`}>{message}</Text>
                </View>
              )}

              {/* OTP Input */}
              <View style={tw`gap-4`}>
                <Text style={[tw`text-[#9794AA] text-center`, styles.label]}>
                  Verification Code
                </Text>

                <OTPInput
                  length={6}
                  value={code}
                  onChange={setCode}
                  disabled={verifying}
                  error={false}
                />

                {/* Resend Code */}
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={!canResendNow || sending}
                  style={tw`self-center mt-2`}
                >
                  <Text
                    style={[
                      tw`text-primary font-medium`,
                      (!canResendNow || sending) && tw`opacity-50`,
                      styles.label,
                    ]}
                  >
                    {sending
                      ? 'Sending...'
                      : canResendNow
                      ? 'Resend Code'
                      : `Resend in ${localResendCooldown}s`}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  tw`bg-primary py-4.5 rounded-[40px] items-center justify-center mt-4`,
                  (!isCodeComplete || verifying) && tw`opacity-50`,
                ]}
                onPress={handleVerify}
                disabled={!isCodeComplete || verifying}
              >
                <Text style={[tw`text-white font-medium`, { fontSize: 20 }]}>
                  {verifying ? 'Verifying...' : 'Verify'}
                </Text>
              </TouchableOpacity>

              {/* Back to Sign In */}
              <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                <Text style={[tw`text-center text-primary font-medium`, styles.label]}>
                  Back to Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}