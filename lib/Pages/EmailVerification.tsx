import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import tw from '../utils/tailwind';
import { useResponsiveStyle } from '../utils/responsiveStyles';

type RootStackParamList = {
  SignUp: undefined;
  SignIn: undefined;
  Landing: undefined;
  Dashboard: undefined;
  VerifyEmail: { email?: string } | undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'VerifyEmail'>;
type Route = RouteProp<RootStackParamList, 'VerifyEmail'>;

interface Props {
  navigation: NavigationProp;
  route?: Route;
}

export default function VerifyEmail({ navigation, route }: Props) {
  const email = route?.params?.email ?? '';
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const [timer, setTimer] = useState(60);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const styles = useResponsiveStyle(({ isSm }) => ({
    container: { paddingHorizontal: isSm ? 20 : 40 },
    heading: { fontSize: isSm ? 22 : 26 },
    input: { width: isSm ? 44 : 52, height: isSm ? 52 : 60, fontSize: isSm ? 20 : 22 },
  }));

  useEffect(() => {
    inputsRef.current[0]?.focus();
    let interval: NodeJS.Timeout | null = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    // allow only single digit numeric
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
    if (!digit && index > 0) {
      // keep cursor in this field if user deleted, but move focus back
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }: any, index: number) => {
    if (nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = async (e: string) => {
    // if user pastes full code into a single input, populate
    const digits = e.replace(/\D/g, '').slice(0, 6).split('');
    if (digits.length === 0) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = digits[i] ?? '';
    }
    setOtp(newOtp);
    const filledIndex = digits.length >= 6 ? 5 : digits.length;
    inputsRef.current[filledIndex]?.focus();
  };

  const verifyCode = () => {
    const code = otp.join('');
    if (code.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code sent to your email.');
      return;
    }
    setVerifying(true);
    // TODO: replace with real verification API call
    setTimeout(() => {
      setVerifying(false);
      // fake success
      Alert.alert('Success', 'Email verified.');
      navigation.navigate('Dashboard');
    }, 1000);
  };

  const resendCode = () => {
    if (timer > 0) return;
    setSending(true);
    // TODO: replace with real resend API call
    setTimeout(() => {
      setSending(false);
      setTimer(60);
      Alert.alert('Sent', `A new code was sent to ${email || 'your email'}.`);
    }, 800);
  };

  const isComplete = otp.every((d) => d !== '');

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <View style={[tw`flex-1 py-8`, styles.container]}>
          <Text style={[tw`text-center font-bold text-primary mb-4`, styles.heading]}>
            Email Verification
          </Text>

          <Text style={tw`text-center text-primary opacity-80 mb-6`}>
            Enter the 6‑digit code sent to
          </Text>
          <Text style={tw`text-center text-primary font-bold mb-6`}>{email || 'your email'}</Text>

          <View style={tw`flex-row justify-center gap-3 mb-6`}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => (inputsRef.current[i] = ref)}
                value={digit}
                onChangeText={(text) => handleChange(text, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                style={[
                  tw`border-2 border-text-gray rounded-md text-center bg-white`,
                  styles.input,
                ]}
                selectionColor="#000"
                onSelectionChange={() => {}}
                onFocus={() => {
                  // clear current on focus so user can replace
                  const newOtp = [...otp];
                  newOtp[i] = '';
                  setOtp(newOtp);
                }}
                // support paste by listening onChangeText for multiple chars
                onChange={() => {}}
                // fallback paste support via onTextInput (some RN versions)
                onTextInput={({ nativeEvent }) => {
                  if (nativeEvent && nativeEvent.text && nativeEvent.text.length > 1) {
                    handlePaste(nativeEvent.text);
                  }
                }}
              />
            ))}
          </View>

          <TouchableOpacity
            style={tw`bg-primary py-3 rounded-[10px] items-center justify-center mb-3 ${
              !isComplete ? 'opacity-60' : ''
            }`}
            onPress={verifyCode}
            disabled={!isComplete || verifying}
          >
            <Text style={tw`text-[#FFFDF4] font-bold`}>{verifying ? 'Verifying...' : 'Verify'}</Text>
          </TouchableOpacity>

          <View style={tw`flex-row items-center justify-center mt-2`}>
            <Text style={tw`text-primary opacity-70 mr-2`}>
              {timer > 0 ? `Resend code in ${timer}s` : 'Didn’t receive a code?'}
            </Text>
            <TouchableOpacity
              onPress={resendCode}
              disabled={timer > 0 || sending}
              style={tw`${timer > 0 ? 'opacity-40' : ''}`}
            >
              <Text style={tw`text-primary font-bold`}>{sending ? 'Sending...' : 'Resend'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('SignIn')}
            style={tw`mt-6 items-center`}
          >
            <Text style={tw`text-primary opacity-70`}>Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}