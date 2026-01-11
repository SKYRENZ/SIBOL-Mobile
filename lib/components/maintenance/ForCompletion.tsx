import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, ScrollView, TextInput, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import tw from '../../utils/tailwind';
import { X as LucideX, Paperclip as LucidePaperclip, Minus as LucideMinus, Plus as LucidePlus } from 'lucide-react-native';
import Button from '../commons/Button';
import AttachmentThumbnails from '../commons/AttachmentThumbnails'; // ✅ add

interface Attachment {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

type ModalMode = 'completion' | 'cancel';

interface ForCompletionProps {
  visible: boolean;
  onClose: () => void;

  // completion mode
  onMarkDone?: (remarks: string, attachments: Attachment[]) => void;

  // cancel mode
  onCancelRequest?: (reason: string) => void;

  requestId?: string;
  mode?: ModalMode; // ✅ NEW
}

export default function ForCompletion({
  visible,
  onClose,
  onMarkDone,
  onCancelRequest,
  requestId,
  mode = 'completion',
}: ForCompletionProps) {
  const [remarks, setRemarks] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const isCancel = mode === 'cancel';

  const handleSubmit = () => {
    if (isCancel) {
      const reason = remarks.trim();
      if (!reason) {
        Alert.alert('Missing Reason', 'Please add a reason for cancellation');
        return;
      }
      onCancelRequest?.(reason);

      setRemarks('');
      setAttachments([]);
      onClose();
      return;
    }

    // completion mode (existing behavior)
    if (attachments.length === 0) {
      Alert.alert('Missing Attachment', 'Please add at least one attachment');
      return;
    }

    onMarkDone?.(remarks, attachments);

    setRemarks('');
    setAttachments([]);
    onClose();
  };

  const handleClose = () => {
    setRemarks('');
    setAttachments([]);
    onClose();
  };

  const handleImagePick = async () => {
    if (isCancel) return; // ✅ no attachments in cancel mode

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newAttachments = result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName || `completion_${Date.now()}_${index}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      }));

      setAttachments(prev => [...prev, ...newAttachments]);
    }
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
                  <Text style={tw`text-lg font-semibold text-text-gray text-center`}>
                    {isCancel ? 'Cancel Request' : 'Proof of maintenance'}
                  </Text>
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
                {/* Remarks -> Reason */}
                <View style={tw`mb-6`}>
                  <Text style={tw`text-text-gray text-sm font-semibold mb-2`}>
                    {isCancel ? 'Reason:' : 'Remarks:'}
                  </Text>
                  <TextInput
                    style={tw`border border-green-light rounded-lg p-3 text-gray-700 min-h-20 text-sm`}
                    placeholder={isCancel ? 'Add Reason' : 'Add remarks (optional)'}
                    placeholderTextColor="#AFC8AD"
                    value={remarks}
                    onChangeText={setRemarks}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                {/* ✅ Remove attachment section in cancel mode */}
                {!isCancel && (
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

                    {attachments.length > 0 && (
                      <View style={tw`mt-4`}>
                        <AttachmentThumbnails
                          items={attachments}
                          onRemove={removeAttachment}
                          showCount
                        />
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>

              <View style={tw`mt-4 self-center w-full px-6`}>
                <Button
                  title={isCancel ? 'Cancel Request' : 'Mark as Done'}
                  onPress={handleSubmit}
                  disabled={isCancel ? remarks.trim().length === 0 : attachments.length === 0}
                  style={tw`w-full`}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
