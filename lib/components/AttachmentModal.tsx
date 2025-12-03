import React from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import tw from '../utils/tailwind';
import { X as LucideX } from 'lucide-react-native';

interface AttachmentModalProps {
  visible: boolean;
  onClose: () => void;
  filename?: string;
}

export default function AttachmentModal({ visible, onClose, filename = 'image.png' }: AttachmentModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={tw`flex-1 bg-black bg-opacity-50 items-center justify-center`}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={tw`bg-white rounded-lg p-4 w-11/12 max-h-5/6`}>
              <View style={tw`flex-row justify-between items-center mb-3`}>
                <Text style={tw`text-lg font-bold text-gray-800`}>{filename}</Text>

                <TouchableOpacity onPress={onClose}>
                  <LucideX color="#2E523A" style={{ opacity: 0.99 }} size={20} strokeWidth={1.6} />
                </TouchableOpacity>
              </View>

              <View style={tw`bg-gray-100 rounded-md h-64 items-center justify-center border border-gray-300`}>
                <Text style={tw`text-gray-500`}>[ Image preview placeholder ]</Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
