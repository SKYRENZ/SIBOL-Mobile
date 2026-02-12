import React from 'react';
import { View, Text, TouchableOpacity, Modal, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface EndConvoProps {
  visible: boolean;
  onClose: () => void;
}

export default function EndConvo({ visible, onClose }: EndConvoProps) {
  const navigation = useNavigation();

  const handleEndConversation = () => {
    onClose();
    navigation.goBack();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      {/* Overlay with reduced opacity */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        {/* Modal Container */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 15, width: '85%', maxWidth: 320, paddingHorizontal: 24, paddingVertical: 24, gap: 12 }}>
          {/* Content Container */}
          <View style={{ alignItems: 'center', gap: 12, width: '100%' }}>
            {/* Image */}
            <View style={{ justifyContent: 'center' }}>
              <Image
                source={require('../../assets/leave.png')}
                style={{ width: 64, height: 64, transform: [{ rotate: '9.743deg' }] }}
                resizeMode="contain"
              />
            </View>

            {/* Text Content */}
            <View style={{ gap: 4, width: '100%' }}>
              {/* Heading */}
              <Text style={{ color: '#2E523A', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                Leave this chat?
              </Text>

              {/* Subtitle */}
              <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center' }}>
                End this conversation and start a new one?
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={{ gap: 12, width: '100%', marginTop: 8 }}>
            {/* YES Button */}
            <TouchableOpacity
              onPress={handleEndConversation}
              style={{ backgroundColor: '#88AB8E', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', elevation: 3 }}
            >
              <Text style={{ color: '#F2F1EB', fontWeight: '700', fontSize: 11, textAlign: 'center' }}>
                YES, END THIS CONVERSATION
              </Text>
            </TouchableOpacity>

            {/* CANCEL Button */}
            <TouchableOpacity
              onPress={onClose}
              style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#88AB8E', alignItems: 'center', justifyContent: 'center', elevation: 3 }}
            >
              <Text style={{ color: '#88AB8E', fontWeight: '700', fontSize: 11 }}>
                CANCEL
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
