import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    Dimensions,
    Keyboard,
    ActivityIndicator,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from '../utils/tailwind';
import { LogOut, Gift, History, MapPin, MessageSquare, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logout } from '../services/authService';
import SignOutModal from './SignOutModal';

type RootStackParamList = {
  HDashboard: undefined;
  HMap: undefined;
  HProfile: undefined;
  HRewards: undefined;
  HHistory: undefined;
  ChatSupport: undefined;
  Settings: undefined;
  SignIn: undefined;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(300, Math.floor(SCREEN_WIDTH * 0.8));

type Props = {
  visible: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
  user?: any; // optional injected user from MenuProvider
};

const menuItems = [
  { id: 'profile', label: 'My Profile', icon: User, route: 'HProfile' },
  { id: 'rewards', label: 'Rewards', icon: Gift, route: 'HRewards' },
  { id: 'history', label: 'History', icon: History, route: 'HHistory' },
  { id: 'map', label: 'Map', icon: MapPin, route: 'HMap' },
  { id: 'chat', label: 'Chat Support', icon: MessageSquare, route: 'ChatSupport' },
];

export default function HMenu({ visible, onClose, onNavigate, user }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const [mounted, setMounted] = useState(visible);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [displayName, setDisplayName] = useState<string>('User');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [roleLabel, setRoleLabel] = useState<string>('User');
 
  // prefer user prop for instant updates, fallback to AsyncStorage
  useEffect(() => {
    if (!visible) return;
    if (user) {
      try {
        const u = user;
        const first = u?.FirstName ?? u?.firstName ?? '';
        const last = u?.LastName ?? u?.lastName ?? '';
        const username = u?.Username ?? u?.username ?? '';
        const email = u?.Email ?? u?.email ?? '';
        const name = (first || last) ? `${first} ${last}`.trim() : (username || email || 'User');
        setDisplayName(name);
        const img =
          u?.Profile_image_path ??
          u?.ProfileImage ??
          u?.Image_path ??
          u?.imagePath ??
          u?.image_path ??
          u?.profile_image_path ??
          null;
        setProfileImage(img || null);
        const r = Number(u?.Roles ?? u?.role ?? NaN);
        if (r === 1) setRoleLabel('Admin');
        else if (r === 3) setRoleLabel('Operator');
        else if (r === 4) setRoleLabel('Household');
        else if (String(u?.role)?.toLowerCase?.() === 'operator') setRoleLabel('Operator');
        else setRoleLabel('User');
        return;
      } catch (e) {
        console.warn('[HMenu] using injected user failed', e);
      }
    }
 
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (!raw) return;
        const u = JSON.parse(raw);
        const first = u?.FirstName ?? u?.firstName ?? '';
        const last = u?.LastName ?? u?.lastName ?? '';
        const username = u?.Username ?? u?.username ?? '';
        const email = u?.Email ?? u?.email ?? '';
        const name = (first || last) ? `${first} ${last}`.trim() : (username || email || 'User');
        setDisplayName(name);
        const img =
          u?.Profile_image_path ??
          u?.ProfileImage ??
          u?.Image_path ??
          u?.imagePath ??
          u?.image_path ??
          u?.profile_image_path ??
          null;
        setProfileImage(img || null);
        const r = Number(u?.Roles ?? u?.role ?? NaN);
        if (r === 1) setRoleLabel('Admin');
        else if (r === 3) setRoleLabel('Operator');
        else if (r === 4) setRoleLabel('Household');
        else if (String(u?.role)?.toLowerCase?.() === 'operator') setRoleLabel('Operator');
        else setRoleLabel('User');
      } catch (e) {
        console.warn('[HMenu] refresh failed', e);
      }
    })();
  }, [visible, user]);

  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
      setMounted(true);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: -SIDEBAR_WIDTH,
        duration: 180,
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }
  }, [visible, translateX]);

  const handleSignOut = async () => {
    try {
      setLoggingOut(true);
      await logout();
      setShowSignOutModal(false);
      onClose();
      navigation.reset({
        index: 0,
        routes: [{ name: 'SignIn' as never }],
      });
    } catch (err) {
      console.error('Sign out failed:', err);
      setShowSignOutModal(false);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleNavigation = (id: string) => {
    onClose();
    const menuItem = menuItems.find(item => item.id === id);
    if (menuItem?.route) {
      // @ts-ignore - We know the route is valid because of our type checking
      navigation.navigate(menuItem.route);
    } else if (onNavigate) {
      onNavigate(id);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={[
            { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
            tw`bg-[rgba(0,0,0,0.5)]`,
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: 0,
                  top: 0,

                  // ✅ stop ABOVE gesture navigation bar
                  bottom: insets.bottom,

                  transform: [{ translateX }],
                  width: SIDEBAR_WIDTH,
                },
                tw`bg-[#18472F]`,
              ]}
            >
              {/* ✅ Header fills status bar/notch area and is clickable */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => { navigation.navigate('HProfile' as never); onClose(); }}
                style={[tw`w-full bg-[#A6BCAF] px-5 py-4 flex-row justify-between items-center`, { paddingTop: insets.top + 12 }]}
              >
                <View>
                  <Text style={tw`text-[16px] font-semibold text-[#18472F]`}>{displayName}</Text>
                  <Text style={tw`text-[11px] text-[#18472F] mt-1`}>{roleLabel}</Text>
                </View>
                <View style={tw`w-10 h-10 rounded-full bg-[#E0E0E0] overflow-hidden`}>
                  <Image
                    source={profileImage ? { uri: profileImage } : require('../../assets/profile.png')}
                    style={tw`w-full h-full`}
                  />
                </View>
              </TouchableOpacity>

              {/* Menu Items */}
              <View style={tw`py-2`}>
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={tw`flex-row items-center py-4 px-5`}
                    onPress={() => handleNavigation(item.id)}
                  >
                    <item.icon size={20} color="#FFFFFF" />
                    <Text style={tw`text-[16px] text-white font-medium ml-4`}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sign Out Button */}
              <TouchableOpacity
                style={[
                  tw`absolute left-5 right-5 bg-[#A6BCAF] rounded-md py-3 flex-row items-center justify-center`,
                  { bottom: 24 }, // ✅ no need to add insets.bottom now
                ]}
                onPress={() => setShowSignOutModal(true)}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <ActivityIndicator color="#18472F" />
                ) : (
                  <>
                    <LogOut size={20} color="#18472F" />
                    <Text style={tw`text-[#18472F] text-[16px] font-semibold ml-3`}>Sign Out</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>

      <SignOutModal
        visible={showSignOutModal}
        loading={loggingOut}
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutModal(false)}
      />
    </>
  );
}
