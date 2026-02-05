import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import tw from '../utils/tailwind';
import { useNavigation } from '@react-navigation/native';
import { Menu, FileText, Home as HomeIcon, Map as MapIcon, ArrowLeft } from 'lucide-react-native';
import { useMenu } from './MenuProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BottomNavbarProps {
  currentPage?: 'Menu' | 'Request' | 'Home' | 'Map' | 'Back';
  onRefresh?: () => void;
}

export default function BottomNavbar({ currentPage, onRefresh }: BottomNavbarProps) {
  const navigation = useNavigation();
  const { openMenu } = useMenu();

  const handleNavigation = async (page: string) => {
    if (page === currentPage) {
      if (onRefresh) {
        onRefresh();
      } else {
        if (page === 'Home') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'ODashboard' as never }],
          });
        } else if (page === 'Request') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'ORequest' as never }],
          });
        }
      }
    } else {
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
    }
  };

  return (
    <View style={tw`bg-primary h-18`}>
      <View style={tw`flex-row justify-around items-center h-full pt-2`}>
        <TouchableOpacity 
          style={tw`items-center flex-1`}
          onPress={() => handleNavigation('Menu')}
        >
          <Menu color="white" size={22} />
          <Text style={tw`text-white font-semibold text-[11px] mt-1`}>Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={tw`items-center flex-1`}
          onPress={() => handleNavigation('Request')}
        >
          <FileText color="white" size={22} />
          <Text style={tw`text-white font-semibold text-[11px] mt-1`}>Request</Text>
        </TouchableOpacity>

        <View style={tw`items-center -mt-8`}>
          <TouchableOpacity 
            style={tw`w-18 h-18 rounded-full bg-primary border-2 border-white items-center justify-center`}
            onPress={() => handleNavigation('Home')}
          >
            <HomeIcon color="white" size={25} />
          </TouchableOpacity>
          <Text style={tw`text-white font-semibold text-[11px] mt-1`}>Home</Text>
        </View>

        <TouchableOpacity 
          style={tw`items-center flex-1`}
          onPress={() => handleNavigation('Map')}
        >
          <MapIcon color="white" size={22} />
          <Text style={tw`text-white font-semibold text-[11px] mt-1`}>Map</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={tw`items-center flex-1`}
          onPress={() => handleNavigation('Back')}
        >
          <ArrowLeft color="white" size={22} />
          <Text style={tw`text-white font-semibold text-[11px] mt-1`}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
