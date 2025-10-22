import React from 'react';
import { View, TouchableOpacity, Image, Text } from 'react-native';
import tw from '../utils/tailwind';
import { useNavigation } from '@react-navigation/native';

interface BottomNavbarProps {
  currentPage?: 'Menu' | 'Request' | 'Home' | 'Notifications' | 'Back';
  onRefresh?: () => void;
}

export default function BottomNavbar({ currentPage, onRefresh }: BottomNavbarProps) {
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
          break;
        case 'Request':
          navigation.navigate('ORequest' as never);
          break;
        case 'Home':
          navigation.navigate('ODashboard' as never);
          break;
        case 'Notifications':
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
          <Image 
            source={require('../../assets/menu.png')}
            style={tw`w-[22px] h-[22px]`}
          />
          <Text style={tw`text-white font-semibold text-[11px] mt-1`}>Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={tw`items-center flex-1`}
          onPress={() => handleNavigation('Request')}
        >
          <Image 
            source={require('../../assets/request.png')}
            style={tw`w-[22px] h-[22px]`}
          />
          <Text style={tw`text-white font-semibold text-[11px] mt-1`}>Request</Text>
        </TouchableOpacity>

        <View style={tw`items-center -mt-8`}>
          <TouchableOpacity 
            style={tw`w-18 h-18 rounded-full bg-primary border-2 border-white items-center justify-center`}
            onPress={() => handleNavigation('Home')}
          >
            <Image 
              source={require('../../assets/home.png')}
              style={tw`w-[25px] h-[25px]`}
            />
          </TouchableOpacity>
          <Text style={tw`text-white font-semibold text-[11px] mt-1`}>Home</Text>
        </View>

        <TouchableOpacity 
          style={tw`items-center flex-1`}
          onPress={() => handleNavigation('Notifications')}
        >
          <Image 
            source={require('../../assets/notifications.png')}
            style={tw`w-[22px] h-[22px]`}
          />
          <Text style={tw`text-white font-semibold text-[11px] mt-1`}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={tw`items-center flex-1`}
          onPress={() => handleNavigation('Back')}
        >
          <Image 
            source={require('../../assets/back.png')}
            style={tw`w-[22px] h-[22px]`}
          />
          <Text style={tw`text-white font-semibold text-[11px] mt-1`}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
