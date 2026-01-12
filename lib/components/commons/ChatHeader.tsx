import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { X, MoreVertical } from 'lucide-react-native';
import tw from '../../utils/tailwind';
import Svg, { Path } from 'react-native-svg';

export default function ChatHeader() {
  const navigation = useNavigation();

  const handleContactPress = () => {
    Linking.openURL('mailto:uccsibol@gmail.com');
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={tw`relative bg-[#88AB8E] pb-8`}>
      {/* Top Wavy Background */}
      <View style={tw`absolute top-10 left-0 right-0`}>
        <Svg width="100%" height={67} viewBox="0 0 583 67" fill="none">
          <Path
            d="M121.596 35.4301C251.765 14.784 275.076 70.8791 384.199 66.7855C493.323 62.6918 583 0 583 0L0.12058 2.83412C0.12058 2.83412 -8.57343 56.0762 121.596 35.4301Z"
            fill="#88AB8E"
          />
        </Svg>
      </View>

      {/* Cloud Decorations (Green Triangle) */}
      <View style={tw`absolute top-8 -left-12 z-20`}>
        <Svg width={78} height={40} viewBox="0 0 78 40" fill="none">
          <Path
            d="M21.5359 32.6252C13.4533 20.7204 3.83949 39.224 3.83949 39.224L77.1738 29.7607L76.124 21.6259C76.124 21.6259 76.4666 15.8254 69.2207 16.0413C61.9749 16.2571 58.5954 23.8879 58.5954 23.8879C58.5954 23.8879 64.1829 5.1847 51.9215 3.17143C39.6601 1.15815 24.1543 24.7329 21.5359 32.6252Z"
            fill="rgba(175, 200, 173, 0.61)"
          />
        </Svg>
      </View>

      <View style={tw`absolute top-4 right-0`}>
        <Svg width={76} height={34} viewBox="0 0 76 34" fill="none">
          <Path
            d="M19.4841 28.0869C12.4456 15.5366 1.28968 33.1535 1.28968 33.1535L75.1637 29.9747L74.8111 21.7802C74.8111 21.7802 75.6468 16.0299 68.4089 15.6274C61.171 15.225 57.1534 22.54 57.1534 22.54C57.1534 22.54 64.3147 4.38101 52.2694 1.33003C40.2242 -1.72095 22.7656 20.4465 19.4841 28.0869Z"
            fill="rgba(175, 200, 173, 0.61)"
          />
        </Svg>
      </View>

      {/* Header Content */}
      <View style={tw`flex-row items-center justify-between px-3 pt-4 z-10`}>
        {/* Close Button & Contact Info */}
        <View style={tw`flex-row items-center gap-3`}>
          <TouchableOpacity onPress={handleGoBack} style={tw`p-1`}>
            <X size={22} color="#FFF" />
          </TouchableOpacity>

          {/* Contact Info */}
          <TouchableOpacity onPress={handleContactPress}>
            <Text style={tw`text-white text-[9px] font-bold font-inter`}>
              Contact Us:{'\n'}
              <Text style={tw`underline`}>uccsibol@gmail.com</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lili Profile & Menu */}
        <View style={tw`flex-row items-center gap-2 -ml-16`}>
          <View style={tw`flex-row items-center gap-1`}>
            <View style={tw`w-10 h-10 rounded-full overflow-hidden bg-transparent`}>
              <Image
                source={require('../../../assets/lili-headshot.png')}
                style={tw`w-full h-full`}
                resizeMode="contain"
              />
            </View>
            <Text style={tw`text-white text-[11px] font-bold font-inter`}>Lili</Text>
          </View>

          <TouchableOpacity style={tw`p-1`}>
            <MoreVertical size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
