import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, ScrollView, TextInput, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import tw from '../utils/tailwind';
import { X as LucideX, Paperclip as LucidePaperclip, Minus as LucideMinus, Plus as LucidePlus } from 'lucide-react-native';
import Button from './commons/Button';

interface Attachment {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

interface ForCompletionProps {
  visible: boolean;
  onClose: () => void;
  onMarkDone?: (remarks: string, attachments: Attachment[]) => void;
}

export default function ForCompletion({ visible, onClose, onMarkDone }: ForCompletionProps) {
  const [remarks, setRemarks] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    // ✅ Enable multiple selection
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      allowsMultipleSelection: true, // ✅ Changed from false to true
      quality: 0.8, // ✅ Reduced quality for better upload
    });

    if (!result.canceled && result.assets.length > 0) {
      // ✅ Handle multiple assets
      const newAttachments = result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName || `completion_${Date.now()}_${index}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      }));

      // ✅ Add new attachments to existing ones
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const handleMarkDone = () => {
    if (attachments.length === 0) {
      Alert.alert('Missing Attachment', 'Please add at least one attachment');
      return;
    }

    if (onMarkDone) {
      onMarkDone(remarks, attachments);
    }

    setRemarks('');
    setAttachments([]);
    onClose();
  };

  const handleClose = () => {
    setRemarks('');
    setAttachments([]);
    onClose();
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={tw`flex-1 bg-black bg-opacity-50 items-center justify-center`}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={[
                tw`bg-white p-4`,
                {
                  width: '85%',        
                  height: '45%',       
                  borderRadius: 10,
                  alignSelf: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  elevation: 6,
                },
              ]}
            >
              {/* Header */}
              <View style={tw`mb-4 relative`}>
                <View style={tw`items-center`}>
                  <Text style={tw`text-lg font-semibold text-text-gray text-center`}>Proof of maintenance</Text>
                </View>

                <TouchableOpacity
                  onPress={handleClose}
                  style={{ position: 'absolute', right: 16, top: 6, padding: 4 }} 
                  accessibilityLabel="Close"
                >
                  <LucideX color="#14532D" size={18} strokeWidth={2} />
                </TouchableOpacity>
              </View>
 
               <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
                 {/* Remarks Section */}
                 <View style={tw`mb-6`}>
                  <Text style={tw`text-text-gray text-sm font-semibold mb-2`}>Remarks:</Text>
                  <TextInput
                    style={tw`border border-green-light rounded-lg p-3 text-gray-700 min-h-20 text-sm`}
                    placeholder="Add remarks (optional)"
                    placeholderTextColor="#AFC8AD"
                    value={remarks}
                    onChangeText={setRemarks}
                    multiline
                    textAlignVertical="top"
                  />
                 </View>
 
                 {/* Attachment Section */}
                 <View style={tw`mb-6`}>
                  <View style={tw`flex-row justify-between items-center mb-2`}>
                    <Text style={tw`text-text-gray text-sm font-semibold`}>Attachment</Text>
                    {attachments.length > 0 && (
                      <TouchableOpacity onPress={handleImagePick} style={tw`p-1`}>
                        <LucidePlus color="#14532D" size={18} strokeWidth={2} />
                      </TouchableOpacity>
                    )}
                  </View>
 
                  {attachments.length === 0 && (
                    <TouchableOpacity
                      onPress={handleImagePick}
                      style={tw`border border-green-light rounded-lg p-5 items-center justify-center min-h-24 bg-secondary`}
                    >
                      <View style={tw`items-center`}>
                        <LucidePaperclip color="#14532D" size={26} strokeWidth={2} />
                        <Text style={tw`text-text-gray text-xs font-medium text-center mt-2`}>
                          attach here the photos for proof
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
 
                   {/* Attachments List */}
                   {attachments.length > 0 && (
                     <View style={tw`mt-4`}>
                       {attachments.map((attachment, index) => (
                         <View
                           key={index}
                           style={tw`flex-row justify-between items-center bg-secondary rounded-lg p-2 mb-2`}
                         >
                          <Text style={tw`text-gray-700 font-medium flex-1 mr-2 text-sm`} numberOfLines={1}>
                             {attachment.name}
                           </Text>
                           <TouchableOpacity
                             onPress={() => removeAttachment(index)}
                             style={tw`p-1`}
                           >
                            <LucideMinus color="#DC2626" size={16} strokeWidth={2} />
                           </TouchableOpacity>
                         </View>
                       ))}
                     </View>
                   )}
                 </View>
               </ScrollView>
 
               <View style={tw`mt-4 self-center w-full px-6`}> 
                <Button
                  title="Mark as Done"
                  onPress={handleMarkDone}
                  disabled={attachments.length === 0}
                  style={tw`w-full`} 
                  testID="for-completion-mark-done"
                />
               </View>
             </View>
           </TouchableWithoutFeedback>
         </View>
       </TouchableWithoutFeedback>
     </Modal>
   );
 }
