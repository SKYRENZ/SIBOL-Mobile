import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import tw from '../utils/tailwind';
import { Menu, MessageSquare, Home as HomeIcon, ArrowLeft, QrCode } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMenu } from './MenuProvider';
import { useScan } from './ScanProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavbarProps {
  onScan?: () => void;
  currentPage?: 'Menu' | 'Chat' | 'Home' | 'Scan' | 'Back';
  onRefresh?: () => void;
}

export default function BottomNavbar({ onScan, currentPage, onRefresh }: BottomNavbarProps) {
  const navigation = useNavigation<any>();
  const { openMenu } = useMenu();
  const { openScanner } = useScan();
  const insets = useSafeAreaInsets();

  const handleNavigation = async (page: string) => {
    if (page === currentPage) {
      if (onRefresh) {
        onRefresh();
      } else if (page === 'Scan') {
        if (onScan) onScan();
      }
    } else {
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
    }
  };

  const handleScanPress = async () => {
    await openScanner();
  };

  const labelStyle = tw`text-[10px] font-semibold text-white mt-1`;

  return (
    // ✅ Safe-area space is just background
    <View style={[tw`bg-primary`, { paddingBottom: insets.bottom }]}>
      {/* ✅ Match oBotNav layout */}
      <View style={tw`h-20 flex-row justify-around items-center px-2 pt-2`}>
        <TouchableOpacity style={tw`items-center flex-1`} onPress={() => handleNavigation('Menu')}>
          <Menu color="white" size={22} />
          <Text style={labelStyle}>Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={tw`items-center flex-1`} onPress={() => handleNavigation('Chat')}>
          <MessageSquare color="white" size={22} />
          <Text style={labelStyle}>Chat Support</Text>
        </TouchableOpacity>

        {/* ✅ Home button: same size + not too high */}
        <View style={tw`items-center -mt-7`}>
          <TouchableOpacity
            style={tw`w-16 h-16 rounded-full bg-primary border-2 border-white items-center justify-center`}
            onPress={() => handleNavigation('Home')}
          >
            <HomeIcon color="white" size={24} />
          </TouchableOpacity>
          <Text style={labelStyle}>Home</Text>
        </View>

        <TouchableOpacity style={tw`items-center flex-1`} onPress={handleScanPress}>
          <QrCode color="white" size={22} />
          <Text style={labelStyle}>Scan QR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={tw`items-center flex-1`} onPress={() => handleNavigation('Back')}>
          <ArrowLeft color="white" size={22} />
          <Text style={labelStyle}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
