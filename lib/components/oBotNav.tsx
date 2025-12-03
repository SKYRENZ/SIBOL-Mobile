import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import tw from '../utils/tailwind';
import { useNavigation } from '@react-navigation/native';
import { Menu, FileText, Home as HomeIcon, Map as MapIcon, ArrowLeft } from 'lucide-react-native';

interface BottomNavbarProps {
  currentPage?: 'Menu' | 'Request' | 'Home' | 'Map' | 'Back';
  onRefresh?: () => void;
  onMenuPress?: () => void;
}

export default function BottomNavbar({ currentPage, onRefresh, onMenuPress }: BottomNavbarProps) {
  const navigation = useNavigation();

  const handleNavigation = (page: string) => {
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
          if (onMenuPress) onMenuPress();
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
        case 'Back':
          navigation.goBack();
          break;
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
