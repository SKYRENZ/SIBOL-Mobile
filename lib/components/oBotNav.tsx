import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import tw from '../utils/tailwind';
import { useNavigation } from '@react-navigation/native';
import { Menu, FileText, Home as HomeIcon, Map as MapIcon, ArrowLeft } from 'lucide-react-native';
import { useMenu } from './MenuProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavbarProps {
  // allow 'Chat' as well so pages like ChatSupport can pass currentPage="Chat"
  currentPage?: 'Menu' | 'Request' | 'Home' | 'Map' | 'Back' | 'Chat';
  onRefresh?: () => void;
  onBack?: () => Promise<boolean> | boolean;
}

export default function BottomNavbar({ currentPage, onRefresh, onBack }: BottomNavbarProps) {
  const navigation = useNavigation();
  const { openMenu } = useMenu();
  const insets = useSafeAreaInsets();

  const handleNavigation = async (page: string) => {
    if (page === currentPage) {
      // Allow onRefresh to trigger only for normal tabs — not for the Back action
      if (onRefresh && page !== 'Back') {
        onRefresh();
        return;
      } else {
        if (page === 'Home') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'ODashboard' as never }],
          });
          return;
        } else if (page === 'Request') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'ORequest' as never }],
          });
          return;
        }
      }
    }

    switch (page) {
      case 'Menu':
        openMenu();
        break;
      case 'Request':
        navigation.navigate('ORequest' as never);
        break;
      case 'Home':
        navigation.navigate('ODashboard' as never);
        break;
      case 'Map':
        navigation.navigate('OMap' as never);
        break;
      case 'Back': {
        // allow page to intercept Back (e.g., unwind local tab history)
        if (onBack) {
          const handled = await Promise.resolve(onBack());
          if (handled) break;
        }
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          navigation.navigate('SignIn' as never);
          break;
        }
        const state = navigation.getState && navigation.getState();
        const routes = state?.routes ?? [];
        const idx = typeof state?.index === 'number' ? state.index : routes.length - 1;
        const prev = routes[idx - 1];
        const authScreens = ['SignIn', 'SignUp', 'Landing', 'VerifyEmail', 'ForgotPassword'];
        if (prev && !authScreens.includes(prev.name)) {
          navigation.goBack();
        } else {
          navigation.navigate('ODashboard' as never);
        }
        break;
      }
    }
  };

  const labelStyle = tw`text-[12px] font-semibold text-white mt-1`;

  return (
    // ✅ Safe-area space is just background
    <View style={[tw`bg-primary`, { paddingBottom: insets.bottom }]}>
      {/* ✅ Match hBotNav layout */}
      <View style={tw`h-20 flex-row justify-around items-center px-2 pt-2`}>
        <TouchableOpacity style={tw`items-center flex-1`} onPress={() => handleNavigation('Menu')}>
          <Menu color="white" size={22} />
          <Text style={labelStyle}>Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={tw`items-center flex-1`} onPress={() => handleNavigation('Request')}>
          <FileText color="white" size={22} />
          <Text style={labelStyle}>Request</Text>
        </TouchableOpacity>

        {/* ✅ Home button: same size + same lift */}
        <View style={tw`items-center -mt-7`}>
          <TouchableOpacity
            style={tw`w-16 h-16 rounded-full bg-primary border-2 border-white items-center justify-center`}
            onPress={() => handleNavigation('Home')}
          >
            <HomeIcon color="white" size={24} />
          </TouchableOpacity>
          <Text style={labelStyle}>Home</Text>
        </View>

        <TouchableOpacity style={tw`items-center flex-1`} onPress={() => handleNavigation('Map')}>
          <MapIcon color="white" size={22} />
          <Text style={labelStyle}>Map</Text>
        </TouchableOpacity>

        <TouchableOpacity style={tw`items-center flex-1`} onPress={() => handleNavigation('Back')}>
          <ArrowLeft color="white" size={22} />
          <Text style={labelStyle}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
