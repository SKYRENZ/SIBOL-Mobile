import React from 'react';
import { View, TouchableOpacity, Image, Text } from 'react-native';
import tw from '../utils/tailwind';

export default function BottomNavbar() {
  return (
    <View style={tw`h-20 flex-row justify-around items-end bg-primary relative pb-4`}>
      <TouchableOpacity style={tw`items-center min-w-[60px]`}>
        <Image 
          source={require('../../assets/menu.png')}
          style={tw`w-[22px] h-[22px]`}
        />
        <Text style={tw`text-[11px] font-semibold text-white mt-1 font-inter`}>Menu</Text>
      </TouchableOpacity>
      <TouchableOpacity style={tw`items-center min-w-[60px]`}>
        <Image 
          source={require('../../assets/chat-support.png')}
          style={tw`w-[22px] h-[22px]`}
        />
        <Text style={tw`text-[11px] font-semibold text-white mt-1 font-inter`}>Chat Support</Text>
      </TouchableOpacity>
      <View style={tw`items-center min-w-[60px] relative -bottom-3`}>
        <View style={tw`w-[72px] h-[72px] rounded-full bg-primary border-2 border-white justify-center items-center`}>
          <Image 
            source={require('../../assets/home.png')}
            style={tw`w-[22px] h-[22px]`}
          />
        </View>
        <View style={tw`items-center`}>
          <Text style={tw`text-[11px] font-semibold text-white mt-1 font-inter`}>Home</Text>
          <View style={tw`w-[14px] h-[1.2px] bg-white mt-[1px] rounded-[1px]`} />
        </View>
      </View>
      <TouchableOpacity style={tw`items-center min-w-[60px]`}>
        <Image 
          source={require('../../assets/notifications.png')}
          style={tw`w-[22px] h-[22px]`}
        />
        <Text style={tw`text-[11px] font-semibold text-white mt-1 font-inter`}>Notifications</Text>
      </TouchableOpacity>
      <TouchableOpacity style={tw`items-center min-w-[60px]`}>
        <Image 
          source={require('../../assets/back.png')}
          style={tw`w-[22px] h-[22px]`}
        />
        <Text style={tw`text-[11px] font-semibold text-white mt-1 font-inter`}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}
