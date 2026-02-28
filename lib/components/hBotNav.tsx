import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import tw from '../utils/tailwind';
import { Menu, MessageSquare, Home as HomeIcon, ArrowLeft, QrCode } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMenu } from './MenuProvider';
import { useScan } from './ScanProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TourGuideZone } from 'rn-tourguide';

interface BottomNavbarProps {
  onScan?: () => void;
  currentPage?: 'Menu' | 'Chat' | 'Home' | 'Scan' | 'Back';
  onRefresh?: () => void;
  onBack?: () => Promise<boolean> | boolean;
}

export default function BottomNavbar({ onScan, currentPage, onRefresh, onBack }: BottomNavbarProps) {
  const navigation = useNavigation<any>();
  const { openMenu } = useMenu();
  const { openScanner } = useScan();
  const insets = useSafeAreaInsets();

  const handleNavigation = async (page: string) => {
    if (page === currentPage) {
      // Don't let onRefresh or onScan intercept the Back action — Back should always navigate
      if (onRefresh && page !== 'Back') {
        onRefresh();
        return;
      } else if (page === 'Scan') {
        if (onScan) onScan();
        return;
      }
    }

    switch (page) {
      case 'Menu':
        openMenu();
        break;
      case 'Chat':
        navigation.navigate('ChatSupport');
        break;
      case 'Home':
        navigation.navigate('HDashboard' as never);
        break;
      case 'Scan':
        if (onScan) onScan();
        break;
      case 'Back': {
        // allow page to intercept Back (e.g., unwind local tab history)
        if (onBack) {
          const handled = await Promise.resolve(onBack());
          if (handled) break;
        }
        // verify token first
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          // not authenticated — go to SignIn
          navigation.navigate('SignIn' as never);
          break;
        }
        // safe to navigate back if previous route is not an auth screen
        const state = navigation.getState && navigation.getState();
        const routes = state?.routes ?? [];
        const idx = typeof state?.index === 'number' ? state.index : routes.length - 1;
        const prev = routes[idx - 1];
        const authScreens = ['SignIn', 'SignUp', 'Landing', 'VerifyEmail', 'ForgotPassword'];
        if (prev && !authScreens.includes(prev.name)) {
          navigation.goBack();
        } else {
          navigation.navigate('HDashboard' as never);
        }
        break;
      }
    }
  };

  const handleScanPress = async () => {
    await openScanner();
  };

  const labelStyle = tw`text-[10px] font-semibold text-white mt-1`;

  return (
  <View style={[tw`bg-primary`, { paddingBottom: insets.bottom }]}>
    <View style={tw`h-20 flex-row justify-around items-center px-2 pt-2`}>

      {/* MENU */}
      <TouchableOpacity
        style={tw`items-center flex-1`}
        onPress={() => handleNavigation('Menu')}
      >
        <TourGuideZone
          zone={7}
          text="This is the Menu button. Tap here to open the hamburger menu and access other pages in the app."
          shape="circle"
          borderRadius={10}
        >
          <View style={tw`items-center`}>
            <Menu color="white" size={22} />
            <Text style={labelStyle}>Menu</Text>
          </View>
        </TourGuideZone>
      </TouchableOpacity>

      {/* CHAT SUPPORT */}
      <TouchableOpacity
        style={tw`items-center flex-1`}
        onPress={() => handleNavigation('Chat')}
      >
        <TourGuideZone
          zone={8}
          text="This is Chat Support. Our mascot Lili is here to guide and assist you whenever you need help."
          shape="circle"
          borderRadius={10}
        >
          <View style={tw`items-center`}>
            <MessageSquare color="white" size={22} />
            <Text style={labelStyle}>Chat Support</Text>
          </View>
        </TourGuideZone>
      </TouchableOpacity>

      {/* HOME */}
      <View style={tw`items-center -mt-7`}> 
        <TourGuideZone
          zone={9}
          text="This is the Home button. Tap here anytime to return to your dashboard."
          shape="circle"
          borderRadius={40}
        >
          <TouchableOpacity
            style={tw`w-16 h-16 rounded-full bg-primary border-2 border-white items-center justify-center`}
            onPress={() => handleNavigation('Home')}
          >
            <HomeIcon color="white" size={24} />
          </TouchableOpacity>
        </TourGuideZone>
        <Text style={labelStyle}>Home</Text>
      </View>

      {/* SCAN QR */}
      <TouchableOpacity
        style={tw`items-center flex-1`}
        onPress={handleScanPress}
      >
        <TourGuideZone
          zone={10}
          text="Tap here to scan a QR code whenever you donate food waste. You will receive reward points based on the weight of your donation."
          shape="circle"
          borderRadius={10}
        >
          <View style={tw`items-center`}>
            <QrCode color="white" size={22} />
            <Text style={labelStyle}>Scan QR</Text>
          </View>
        </TourGuideZone>
      </TouchableOpacity>

      {/* BACK */}
      <TouchableOpacity
        style={tw`items-center flex-1`}
        onPress={() => handleNavigation('Back')}
      >
        <TourGuideZone
          zone={11}
          text="This is the Back button. Tap here to return to the previous page."
          shape="circle"
          borderRadius={10}
        >
          <View style={tw`items-center`}>
            <ArrowLeft color="white" size={22} />
            <Text style={labelStyle}>Back</Text>
          </View>
        </TourGuideZone>
      </TouchableOpacity>

    </View>
  </View>
);
}