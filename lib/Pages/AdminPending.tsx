import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from '../utils/tailwind';
import { useResponsiveStyle } from '../utils/responsiveStyles';

type RootStackParamList = {
  Landing: undefined;
  SignIn: undefined;
  SignUp: undefined;
  VerifyEmail: { email?: string } | undefined;
  Dashboard: undefined;
  AdminPending: { email?: string } | undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AdminPending'>;

interface Props {
  navigation: NavigationProp;
  route?: { params?: { email?: string } };
}

export default function AdminPending({ navigation, route }: Props) {
  const email = route?.params?.email ?? '';

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const styles = useResponsiveStyle(({ isSm }) => ({
    pagePadding: { paddingHorizontal: isSm ? 20 : 32, paddingVertical: isSm ? 24 : 36 },
    card: {
      width: '100%',
      maxWidth: isSm ? 420 : 520,
      borderRadius: 14,
      padding: isSm ? 18 : 28,
    },
    title: { fontSize: isSm ? 20 : 24 },
    iconSize: { fontSize: isSm ? 48 : 64 },
    smallText: { fontSize: isSm ? 12 : 14 },
  }));

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] });

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <View style={[tw`flex-1 items-center justify-center`, styles.pagePadding]}>
        {/* Card */}
        <View
          style={[
            styles.card,
          ]}
        >
          <View style={tw`items-center`}>

            <Text style={[tw`text-center font-bold text-primary mt-4 mb-3`, styles.title]}>
              Account Pending Approval
            </Text>

            <Text style={tw`text-center text-gray-600 mb-6`}>
              Your account is under review. We'll notify you when it's approved.
            </Text>
          </View>

          {/* Verification summary */}
          <View style={tw`bg-green-100 border border-green-500 rounded-lg p-4 mb-4`}>
            <Text style={tw`text-green-700 font-semibold mb-2`}>Email verification complete</Text>
            <View style={tw`bg-white border border-blue-50 rounded-md p-3`}>
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`text-gray-600`}>Email</Text>
                <Text style={tw`text-gray-800 font-semibold`}>{email || '—'}</Text>
              </View>
            </View>
          </View>

          {/* Admin review note */}
          <View style={tw`bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6`}>
            <Text style={tw`text-yellow-800 font-semibold mb-2`}>Admin review required</Text>
            <Text style={tw`text-yellow-700`}>We’re reviewing your account. This usually takes 1–2 business days.</Text>
          </View>

          {/* Actions */}
          <View>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignIn')}
              style={tw`bg-primary py-3 rounded-lg items-center mb-3`}
            >
              <Text style={tw`text-white font-medium`}>Back to Sign in</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                /* replace with real support action if needed */
              }}
              style={tw`items-center`}
            >
{/*               <Text style={tw`text-gray-600 ${styles.smallText ? '' : ''}`}>
                Questions? <Text style={tw`text-primary font-semibold`}>Contact support</Text>
              </Text> */}
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer note */}
{/*         <View style={tw`mt-6 items-center`}>
          <Text style={[tw`text-gray-500`, styles.smallText]}>
            Need faster help? Reach out to support@sibol.example
          </Text>
        </View> */}
      </View>
    </SafeAreaView>
  );
}