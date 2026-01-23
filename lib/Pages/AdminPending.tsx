import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from '../utils/tailwind';
import { useResponsiveStyle } from '../utils/responsiveStyles';
import { useAdminPending } from '../hooks/useAdminPending';

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
  const initialEmail = route?.params?.email ?? '';
  const { email, setEmail, queueInfo, loading, error, refresh } = useAdminPending(initialEmail);

  const styles = useResponsiveStyle(({ isSm }) => ({
    container: { paddingHorizontal: isSm ? 20 : 28, paddingVertical: isSm ? 20 : 36, flex: 1, justifyContent: 'center' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: isSm ? 16 : 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
    title: { fontSize: isSm ? 20 : 22, fontWeight: '700', color: '#22543D', marginBottom: 8 },
    subtitle: { color: '#4B5563', marginBottom: 12 },
    bigNum: { fontSize: isSm ? 48 : 56, fontWeight: '800', color: '#2563EB' },
    smallText: { color: '#6B7280' },
  }));

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail, setEmail]);

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <View style={[styles.container]}>
        <View style={[styles.card]}>
          <Text style={[styles.title]}>Awaiting Admin Approval</Text>
          <Text style={[styles.subtitle]}>Your account registration is in the approval queue. You'll receive an email once approved.</Text>

          {loading ? (
            <View style={tw`items-center py-6`}>
              <ActivityIndicator size="large" color="#2E523A" />
              <Text style={tw`text-gray-600 mt-3`}>Checking queue position…</Text>
            </View>
          ) : error ? (
            <View style={tw`bg-red-50 border border-red-200 rounded-md p-4 mb-4`}>
              <Text style={tw`text-red-700`}>{error}</Text>
            </View>
          ) : queueInfo ? (
            <View style={tw`items-center py-4`}>
              <Text style={styles.bigNum}>#{queueInfo.position}</Text>
              <Text style={[styles.smallText, tw`mt-2`]}>out of {queueInfo.totalPending} pending accounts</Text>

              <View style={tw`mt-4 w-full border-t border-gray-100 pt-4`}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={tw`text-sm text-gray-600`}>Estimated approval time: </Text>
                  <Text style={tw`text-lg font-semibold text-green-700 px-5`}>{queueInfo.estimatedWaitTime}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={refresh}
                style={[
                  tw`mt-4`,
                  {
                    alignSelf: 'stretch',
                    backgroundColor: '#F6F9F6',
                    borderRadius: 8,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: '#E6EFE6',
                    alignItems: 'center',
                  },
                ]}
              >
                <Text style={tw`text-primary font-medium`}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={tw`items-center py-6`}>
              <Text style={tw`text-gray-600`}>No queue information available.</Text>
            </View>
          )}

          <View style={tw`mt-0`}>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignIn')}
              style={tw`bg-primary py-3 rounded-lg items-center`}
            >
              <Text style={tw`text-white font-medium`}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}