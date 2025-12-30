import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import tw from '../utils/tailwind';
import { Image as LucideImage, Send as LucideSend, X as LucideX } from 'lucide-react-native';
import {
  MaintenanceRemark,
  getTicketAttachments,
  MaintenanceAttachment,
} from '../services/maintenanceService';

interface Attachment {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

interface CommentsSectionProps {
  visible: boolean;
  onClose: () => void;
  requestId: number;

  messages: MaintenanceRemark[];
  onSendMessage: (text: string, attachments: Attachment[]) => Promise<void>;

  // ✅ parent can bump this to force re-fetch of server attachments
  refreshAttachmentsSignal?: number;
}

const isLikelyImage = (fileNameOrUrl: string, fileType?: string | null) => {
  const t = (fileType || '').toLowerCase();
  if (t.startsWith('image/')) return true;
  const s = (fileNameOrUrl || '').toLowerCase();
  return /\.(png|jpe?g|gif|webp)$/i.test(s);
};

export default function CommentsSection({
  visible,
  onClose,
  requestId,
  messages,
  onSendMessage,
  refreshAttachmentsSignal = 0,
}: CommentsSectionProps) {
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const [uploadedAttachments, setUploadedAttachments] = useState<MaintenanceAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // ✅ Pending attachments picked locally (not yet uploaded)
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);

  // ✅ tap-to-expand remark details
  const [expandedRemarkIds, setExpandedRemarkIds] = useState<Set<number>>(new Set());

  const formatTimeOnly = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatFullStamp = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const toggleRemarkExpanded = (remarkId: number) => {
    setExpandedRemarkIds(prev => {
      const next = new Set(prev);
      if (next.has(remarkId)) next.delete(remarkId);
      else next.add(remarkId);
      return next;
    });
  };

  const loadAttachments = async () => {
    if (!requestId) return;
    setLoadingAttachments(true);
    try {
      const data = await getTicketAttachments(requestId);
      setUploadedAttachments(data);
    } catch (err) {
      console.error('Error loading attachments:', err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadAttachments();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      loadAttachments();
    }
  }, [refreshAttachmentsSignal]);

  // Clear drafts when closing
  useEffect(() => {
    if (!visible) {
      setNewMessage('');
      setPendingAttachments([]);
      setExpandedRemarkIds(new Set());
    }
  }, [visible]);

  const handlePickAttachments = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.length) {
      const picked: Attachment[] = result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName || `remark_${Date.now()}_${index}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      }));

      setPendingAttachments(prev => [...prev, ...picked]);
    }
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    const text = newMessage.trim();
    if (!text) return;

    await onSendMessage(text, pendingAttachments);
    setNewMessage('');
    setPendingAttachments([]);
  };

  const shadowStyle = {
    shadowColor: '#88AB8E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  };

  const { width: screenWidth } = Dimensions.get('window');

  // ✅ Smaller square thumbnails
  const thumbSize = 56;
  const thumbRadius = 10;

  const hasUploadedAttachments = useMemo(
    () => uploadedAttachments.length > 0,
    [uploadedAttachments.length]
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={tw`flex-1 bg-black bg-opacity-50 items-center justify-center`}>
        <View style={tw`bg-white rounded-lg w-11/12 h-5/6 flex flex-col`}>

          {/* Header */}
          <View style={tw`flex-row justify-between items-center p-4 border-b border-gray-200`}>
            <Text style={tw`text-lg font-bold text-gray-800`}>Remarks</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={tw`text-2xl text-gray-600`}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ Attachments section under header (UPLOADED ONLY) */}
          <View style={tw`px-4 pt-3 pb-2 border-b border-gray-100`}>
            <View style={tw`flex-row items-center justify-between mb-2`}>
              <Text style={tw`text-sm font-semibold text-gray-700`}>Attachments</Text>

              {/* ✅ Removed "Add" (redundant) */}
              <Text style={tw`text-xs text-gray-400`}>
                {uploadedAttachments.length > 0 ? `${uploadedAttachments.length}` : ''}
              </Text>
            </View>

            {loadingAttachments ? (
              <Text style={tw`text-xs text-gray-400`}>Loading attachments...</Text>
            ) : !hasUploadedAttachments ? (
              <Text style={tw`text-xs text-gray-400`}>No attachments</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {uploadedAttachments.map((att) => (
                  <View
                    key={`uploaded_${att.Attachment_Id}`}
                    style={[
                      tw`mr-2 bg-gray-50 border border-gray-200 overflow-hidden`,
                      { width: thumbSize, height: thumbSize, borderRadius: thumbRadius },
                    ]}
                  >
                    {isLikelyImage(att.File_name || att.File_path, att.File_type) ? (
                      <Image
                        source={{ uri: att.File_path }}
                        resizeMode="cover"
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : (
                      <View style={tw`flex-1 items-center justify-center px-1`}>
                        <Text style={tw`text-[9px] text-gray-600 font-semibold`} numberOfLines={2}>
                          FILE
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Messages */}
          <ScrollView ref={scrollRef} style={tw`flex-1 p-4`}>
            {messages.length === 0 ? (
              <Text style={tw`text-gray-400 text-center py-8`}>No remarks yet</Text>
            ) : (
              messages.map((remark) => {
                const isBrgy = remark.User_role === 'Barangay_staff' || remark.User_role === 'Admin';
                const isExpanded = expandedRemarkIds.has(remark.Remark_Id);

                return (
                  <View
                    key={remark.Remark_Id}
                    style={{ marginBottom: 12, alignSelf: isBrgy ? 'flex-start' : 'flex-end', maxWidth: '78%' }}
                  >
                    <View style={tw`flex-row mb-1`}>
                      <Text style={[tw`font-semibold text-sm`, { color: '#1F4D36' }]}>
                        {isBrgy ? 'Barangay' : 'You'}
                      </Text>

                      <Text style={tw`text-xs text-gray-500 ml-2`}>
                        {formatTimeOnly(remark.Created_at)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => toggleRemarkExpanded(remark.Remark_Id)}
                      style={[
                        { padding: 10, borderRadius: 10, backgroundColor: isBrgy ? '#88AB8E' : '#FFFFFF' },
                        shadowStyle,
                      ]}
                    >
                      <Text style={{ color: isBrgy ? '#FFFFFF' : '#1F4D36', fontSize: 14 }}>
                        {remark.Remark_text}
                      </Text>

                      {isExpanded && (
                        <Text style={{ marginTop: 6, fontSize: 11, color: isBrgy ? '#F1F5F9' : '#6B7280' }}>
                          {formatFullStamp(remark.Created_at)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* ✅ Pending attachments should appear ABOVE the input area */}
          {pendingAttachments.length > 0 && (
            <View style={tw`px-4 pb-2`}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {pendingAttachments.map((att, idx) => (
                  <View
                    key={`pending_${att.uri}_${idx}`}
                    style={[
                      tw`mr-2 bg-gray-100 border border-gray-200 overflow-hidden`,
                      { width: thumbSize, height: thumbSize, borderRadius: thumbRadius },
                    ]}
                  >
                    <Image source={{ uri: att.uri }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />

                    <TouchableOpacity
                      onPress={() => removePendingAttachment(idx)}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(0,0,0,0.45)',
                        borderRadius: 12,
                        padding: 4,
                      }}
                      accessibilityLabel="Remove attachment"
                    >
                      <LucideX color="#fff" size={12} strokeWidth={2.2} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              <Text style={tw`text-[10px] text-gray-400 mt-1`}>
                Selected: {pendingAttachments.length}
              </Text>
            </View>
          )}

          {/* Input Area */}
          <View style={tw`border-t border-gray-200 p-4`}>
            <View style={tw`flex-row items-center bg-white border border-gray-300 rounded-full px-3`}>
              <TouchableOpacity onPress={handlePickAttachments} style={{ marginRight: 8 }}>
                <LucideImage color="#88AB8E" style={{ opacity: 0.89 }} size={20} strokeWidth={1.5} />
              </TouchableOpacity>

              <TextInput
                style={[tw`flex-1 text-sm`, { paddingVertical: 0, height: 36, textAlignVertical: 'center' }]}
                placeholder="Type a remark..."
                placeholderTextColor="#8A8A8A"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline={false}
              />

              <TouchableOpacity onPress={handleSendMessage} style={{ marginLeft: 8 }}>
                <LucideSend color="#88AB8E" style={{ opacity: 0.89 }} size={20} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </View>
    </Modal>
  );
}
