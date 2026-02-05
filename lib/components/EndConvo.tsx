import React from 'react';
import { View, Text, TouchableOpacity, Modal, Image } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import tw from '../utils/tailwind';

interface EndConvoProps {
  visible: boolean;
  onClose: () => void;
}

type RootStackParamList = {
  ChatIntro: undefined;
};

export default function EndConvo({ visible, onClose }: EndConvoProps) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleEndConversation = () => {
    onClose();
    navigation.navigate('ChatIntro');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      {/* Overlay with reduced opacity */}
      <View style={[tw`flex-1 bg-black/50 flex items-center justify-center`, { justifyContent: 'center' }]}>
        {/* Modal Container */}
        <View style={[tw`bg-white rounded-[15px] w-[85%] px-6 py-6 gap-3 shadow-lg`, { maxWidth: 320 }]}>
          {/* Content Container */}
          <View style={tw`flex items-center gap-3 w-full`}>
            {/* Image */}
            <View style={tw`flex justify-center`}>
              <Image
                source={require('../../assets/leave.png')}
                style={[tw`w-16 h-16`, { transform: [{ rotate: '9.743deg' }] }]}
                resizeMode="contain"
              />
            </View>

            {/* Text Content */}
            <View style={tw`flex gap-1 w-full`}>
              {/* Heading */}
              <Text style={tw`text-[#2E523A] text-base font-semibold text-center`}>
                Leave this chat?
              </Text>

              {/* Subtitle */}
              <Text style={tw`text-gray-400 text-xs text-center`}>
                End this conversation and start a new one?
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={tw`flex gap-3 w-full mt-2`}>
            {/* YES Button */}
            <TouchableOpacity
              onPress={handleEndConversation}
              style={[tw`flex-1 bg-[#88AB8E] px-3 py-2 rounded-[8px] items-center justify-center`, { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 2, elevation: 3 }]}
            >
              <Text style={tw`text-[#F2F1EB] font-bold text-[11px] text-center`}>
                YES, END THIS{'\n'}CONVERSATION
              </Text>
            </TouchableOpacity>

            {/* CANCEL Button */}
            <TouchableOpacity
              onPress={onClose}
              style={[tw`flex-1 bg-white px-3 py-2 rounded-[8px] border border-[#88AB8E] items-center justify-center`, { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 2, elevation: 3 }]}
            >
              <Text style={tw`text-[#88AB8E] font-bold text-[11px]`}>
                CANCEL
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
