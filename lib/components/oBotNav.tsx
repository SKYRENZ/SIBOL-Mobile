import React from 'react';
import { View, TouchableOpacity, Image, Text } from 'react-native';
import tw from '../utils/tailwind';

export default function BottomNavbar() {
  return (
    <View style={tw`bg-primary h-18`}>
      <View style={tw`flex-row justify-around items-center h-full pt-2`}>
        <TouchableOpacity style={tw`items-center flex-1`}>
          <Image 
            source={require('../../assets/menu.png')}
            style={tw`w-[22px] h-[22px]`}
          />
          <Text style={tw`text-white font-semibold text-[11px] mt-1`}>Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={tw`items-center flex-1`}>
          <Image 
            source={require('../../assets/request.png')}
            style={tw`w-[22px] h-[22px]`}
          />
          <Text style={tw`text-white font-semibold text-[11px] mt-1`}>Request</Text>
        </TouchableOpacity>

        <View style={tw`items-center -mt-8`}>
          <View style={tw`w-18 h-18 rounded-full bg-primary border-2 border-white items-center justify-center`}>
            <Image 
              source={require('../../assets/home.png')}
              style={tw`w-[25px] h-[25px]`}
            />
          </View>
          <Text style={tw`text-white font-semibold text-[11px] mt-1`}>Home</Text>
        </View>

        <TouchableOpacity style={tw`items-center flex-1`}>
          <Image 
            source={require('../../assets/notifications.png')}
            style={tw`w-[22px] h-[22px]`}
          />
          <Text style={tw`text-white font-semibold text-[11px] mt-1`}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={tw`items-center flex-1`}>
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
