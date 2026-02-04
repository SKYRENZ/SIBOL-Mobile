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
import { Settings, LogOut, Gift, History, MapPin, MessageSquare, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  HDashboard: undefined;
  HMap: undefined;
  HProfile: undefined;
  HRewards: undefined;
  History: undefined;
  ChatSupport: undefined;
  Settings: undefined;
  SignIn: undefined;
};
import { logout } from '../services/authService';
import SignOutModal from './SignOutModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(300, Math.floor(SCREEN_WIDTH * 0.8));

type Props = {
    visible: boolean;
    onClose: () => void;
    onNavigate?: (route: string) => void;
};

const menuItems = [
    { 
      id: 'profile', 
      label: 'My Profile', 
      icon: User,
      route: 'HProfile'
    },
    { 
      id: 'rewards', 
      label: 'Rewards', 
      icon: Gift,
      route: 'HRewards'
    },
    { 
      id: 'history', 
      label: 'History', 
      icon: History,
      route: 'History' // Update this if you have a specific history route
    },
    { 
      id: 'map', 
      label: 'Map', 
      icon: MapPin,
      route: 'HMap' // This will navigate to the HMap screen
    },
    { 
      id: 'chat', 
      label: 'Chat Support', 
      icon: MessageSquare,
      route: 'ChatSupport' // Update this if you have a specific settings route
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      route: 'Settings' // Update this if you have a specific chat route
    },
];

export default function HMenu({ visible, onClose, onNavigate }: Props) {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
    const [mounted, setMounted] = useState(visible);
    const [loggingOut, setLoggingOut] = useState(false);
    const [showSignOutModal, setShowSignOutModal] = useState(false);

    const [displayName, setDisplayName] = useState<string>('User');

    // refresh displayName whenever menu opens
    useEffect(() => {
      if (!visible) return;
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
        } catch (e) {
          console.warn('[HMenu] refresh failed', e);
        }
      })();
    }, [visible]);

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
                <View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, tw`bg-[rgba(0,0,0,0.5)]`]}>
                     <TouchableWithoutFeedback>
                         <Animated.View
                             style={[
                                 { transform: [{ translateX }], width: SIDEBAR_WIDTH },
                                 tw`h-full bg-[#18472F]`,
                             ]}
                         >
                             {/* Header */}
                             <View style={tw`w-full bg-[#A6BCAF] px-5 py-4 flex-row justify-between items-center`}>
                                 <View>
                                     <Text style={tw`text-[16px] font-semibold text-[#18472F]`}>{displayName}</Text>
                                 </View>
                                 <View style={tw`w-10 h-10 rounded-full bg-[#E0E0E0] overflow-hidden`}>
                                     <Image source={{ uri: 'https://via.placeholder.com/40' }} style={tw`w-full h-full`} />
                                 </View>
                             </View>

                             {/* Menu Items */}
                             <View style={tw`py-2`}>
                                 {menuItems.map((item) => (
                                     <TouchableOpacity key={item.id} style={tw`flex-row items-center py-4 px-5`} onPress={() => handleNavigation(item.id)}>
                                         <item.icon size={20} color="#FFFFFF" />
                                         <Text style={tw`text-[16px] text-white font-medium ml-4`}>{item.label}</Text>
                                     </TouchableOpacity>
                                 ))}
                             </View>

                             {/* Sign Out Button */}
                             <TouchableOpacity style={tw`absolute bottom-8 left-5 right-5 bg-[#A6BCAF] rounded-md py-3 flex-row items-center justify-center`} onPress={() => setShowSignOutModal(true)} disabled={loggingOut}>
                                 {loggingOut ? <ActivityIndicator color="#18472F" /> : <>
                                     <LogOut size={20} color="#18472F" />
                                     <Text style={tw`text-[#18472F] text-[16px] font-semibold ml-3`}>Sign Out</Text>
                                 </>}
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
