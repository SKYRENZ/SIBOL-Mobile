import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Linking, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { X, MoreVertical } from 'lucide-react-native';
import tw from '../../utils/tailwind';
import Svg, { Path } from 'react-native-svg';
import EndConvo from '../EndConvo';

export default function ChatHeader() {
  const navigation = useNavigation();
  const [showEndConvoModal, setShowEndConvoModal] = useState(false);
  const cloudLeftAnim = useRef(new Animated.Value(-80)).current;
  const cloudRightAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    const animateCloudLeft = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(cloudLeftAnim, {
            toValue: 400,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(cloudLeftAnim, {
            toValue: -80,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    const animateCloudRight = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(cloudRightAnim, {
            toValue: -150,
            duration: 9000,
            useNativeDriver: true,
          }),
          Animated.timing(cloudRightAnim, {
            toValue: 400,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateCloudLeft();
    animateCloudRight();
  }, [cloudLeftAnim, cloudRightAnim]);

  const handleContactPress = () => {
    Linking.openURL('mailto:sibolucc@gmail.com');
  };

  const handleClosePress = () => {
    setShowEndConvoModal(true);
  };

  return (
    <View style={tw`relative`}>
      {/* Top Wavy Background - Container */}
      <View style={[tw`absolute top-0 left-0 right-0`, { height: 110, overflow: 'hidden' }]}>
        {/* Solid top section */}
        <View style={[tw`bg-[#88AB8E]`, { width: '100%', height: 63 }]} />

        {/* Wavy bottom section */}
        <View style={[tw`absolute`, { left: -86, top: 43, width: 583, height: 67 }]}>
          <Svg width={583} height={67} viewBox="0 0 583 67" fill="none">
            <Path
              d="M121.596 35.4301C251.765 14.784 275.076 70.8791 384.199 66.7855C493.323 62.6918 583 0 583 0L0.12058 2.83412C0.12058 2.83412 -8.57343 56.0762 121.596 35.4301Z"
              fill="#88AB8E"
            />
          </Svg>
        </View>
      </View>

      {/* Cloud Decorations (Green Triangle) - Left - Animated */}
      <Animated.View style={[tw`absolute z-20`, { top: 8, left: 0, transform: [{ translateX: cloudLeftAnim }] }]}>
        <Svg width={78} height={40} viewBox="0 0 78 40" fill="none">
          <Path
            d="M21.5359 32.6252C13.4533 20.7204 3.83949 39.224 3.83949 39.224L77.1738 29.7607L76.124 21.6259C76.124 21.6259 76.4666 15.8254 69.2207 16.0413C61.9749 16.2571 58.5954 23.8879 58.5954 23.8879C58.5954 23.8879 64.1829 5.1847 51.9215 3.17143C39.6601 1.15815 24.1543 24.7329 21.5359 32.6252Z"
            fill="rgba(175, 200, 173, 0.61)"
          />
        </Svg>
      </Animated.View>

      {/* Cloud Decorations - Right - Animated */}
      <Animated.View style={[tw`absolute z-20`, { top: 12, right: 0, transform: [{ translateX: cloudRightAnim }] }]}>
        <Svg width={76} height={34} viewBox="0 0 76 34" fill="none">
          <Path
            d="M19.4841 28.0869C12.4456 15.5366 1.28968 33.1535 1.28968 33.1535L75.1637 29.9747L74.8111 21.7802C74.8111 21.7802 75.6468 16.0299 68.4089 15.6274C61.171 15.225 57.1534 22.54 57.1534 22.54C57.1534 22.54 64.3147 4.38101 52.2694 1.33003C40.2242 -1.72095 22.7656 20.4465 19.4841 28.0869Z"
            fill="rgba(175, 200, 173, 0.61)"
          />
        </Svg>
      </Animated.View>

      {/* Header Content - Fixed Layout */}
      <View style={[tw`absolute top-0 left-0 right-0 z-30 flex-row items-center`, { paddingTop: 16, paddingHorizontal: 12 }]}>
        {/* Close Button */}
        <TouchableOpacity onPress={handleClosePress} style={tw`p-1`}>
          <X size={22} color="#FFF" strokeWidth={3} />
        </TouchableOpacity>

        {/* Contact Info */}
        <TouchableOpacity onPress={handleContactPress} style={tw`ml-8`}>
          <Text style={tw`text-white text-[10px] font-bold font-inter leading-tight`}>
            Contact Us:{'\n'}
            <Text style={tw`underline`}>sibolucc@gmail.com</Text>
          </Text>
        </TouchableOpacity>

        {/* Spacer to push right content */}
        <View style={tw`flex-1`} />

        {/* Lili Profile */}
        <View style={tw`flex-row items-center gap-2.5`}>
          <View style={[tw`rounded-full overflow-hidden bg-transparent`, { width: 52, height: 52 }]}>
            <Image
              source={require('../../../assets/lili-headshot.png')}
              style={{ width: 52, height: 52 }}
              resizeMode="contain"
            />
          </View>
          <Text style={tw`text-white text-[11px] font-bold font-inter`}>Lili</Text>
        </View>

        {/* Menu Dots */}
        <TouchableOpacity style={tw`ml-4 p-1`}>
          <View style={tw`gap-1.5`}>
            <View style={[tw`bg-white rounded-full`, { width: 3, height: 3 }]} />
            <View style={[tw`bg-white rounded-full`, { width: 3, height: 3 }]} />
            <View style={[tw`bg-white rounded-full`, { width: 3, height: 3 }]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Spacer for header height */}
      <View style={{ height: 110 }} />

      {/* End Conversation Modal */}
      <EndConvo visible={showEndConvoModal} onClose={() => setShowEndConvoModal(false)} />
    </View>
  );
}
