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
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// ✅ use legacy FS for downloadAsync on SDK 54+
import * as LegacyFS from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import tw from '../utils/tailwind';
import { Image as LucideImage, Send as LucideSend, X as LucideX, Download as LucideDownload } from 'lucide-react-native';
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

  refreshAttachmentsSignal?: number;
  currentUserId?: number | null;

  autoPickOnOpen?: boolean;
  onAutoPickHandled?: () => void;

  // ✅ NEW
  readOnly?: boolean;
}

const isLikelyImage = (fileNameOrUrl: string, fileType?: string | null) => {
  const t = (fileType || '').toLowerCase();
  if (t.startsWith('image/')) return true;

  const s = (fileNameOrUrl || '').toLowerCase();

  // ✅ Cloudinary image URLs often have no file extension
  if (s.includes('/image/upload/')) return true;

  return /\.(png|jpe?g|gif|webp)$/i.test(s);
};

const guessFileName = (url: string, fallback = `attachment_${Date.now()}`) => {
  try {
    const clean = url.split('?')[0];
    const last = clean.substring(clean.lastIndexOf('/') + 1);
    return last || fallback;
  } catch {
    return fallback;
  }
};

export default function CommentsSection({
  visible,
  onClose,
  requestId,
  messages,
  onSendMessage,
  refreshAttachmentsSignal = 0,
  currentUserId = null,
  autoPickOnOpen = false,
  onAutoPickHandled,
  readOnly = false, // ✅ NEW
}: CommentsSectionProps) {
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const [uploadedAttachments, setUploadedAttachments] = useState<MaintenanceAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);

  // ✅ Preview modal state
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewIsImage, setPreviewIsImage] = useState(false);

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
    if (visible) loadAttachments();
  }, [refreshAttachmentsSignal]);

  useEffect(() => {
    if (!visible) {
      setNewMessage('');
      setPendingAttachments([]);
      setPreviewVisible(false);
      setPreviewUrl(null);
      setPreviewIsImage(false);
    }
  }, [visible]);

  const handlePickAttachments = async () => {
    if (readOnly) return; // ✅ block in view-only mode

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

  // ✅ Auto-open picker should not fire in read-only mode
  const autoPickFiredRef = useRef(false);
  useEffect(() => {
    if (readOnly) return;

    if (!visible) {
      autoPickFiredRef.current = false;
      return;
    }
    if (visible && autoPickOnOpen && !autoPickFiredRef.current) {
      autoPickFiredRef.current = true;
      setTimeout(async () => {
        try {
          await handlePickAttachments();
        } finally {
          onAutoPickHandled?.();
        }
      }, 0);
    }
  }, [visible, autoPickOnOpen, onAutoPickHandled, readOnly]);

  const removePendingAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const canSend = !readOnly && (newMessage.trim().length > 0 || pendingAttachments.length > 0);

  const handleSendMessage = async () => {
    if (readOnly) return; // ✅ block in view-only mode

    const text = newMessage.trim();
    if (!text && pendingAttachments.length === 0) return;

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

  const thumbSize = 56;
  const thumbRadius = 10;

  const hasUploadedAttachments = useMemo(
    () => uploadedAttachments.length > 0,
    [uploadedAttachments.length]
  );

  const openPreview = (url: string, fileNameOrUrl?: string, fileType?: string | null) => {
    setPreviewUrl(url);
    setPreviewIsImage(isLikelyImage(fileNameOrUrl || url, fileType));
    setPreviewVisible(true);
  };

  const handleDownload = async () => {
    if (!previewUrl) return;

    try {
      // ✅ Web: download via blob + anchor
      if (Platform.OS === 'web') {
        const res = await fetch(previewUrl);
        if (!res.ok) throw new Error(`Download failed (${res.status})`);
        const blob = await res.blob();

        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = guessFileName(previewUrl);
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
        return;
      }

      // ✅ Native (iOS/Android): use legacy downloadAsync
      const fileName = guessFileName(previewUrl);

      const baseDir =
        LegacyFS.documentDirectory ||
        LegacyFS.cacheDirectory;

      if (!baseDir) {
        Alert.alert('Error', 'File system directory is not available on this platform.');
        return;
      }

      const localUri = `${baseDir}${fileName}`;

      await LegacyFS.downloadAsync(previewUrl, localUri);

      // Share sheet (acts as "save/share/download" on mobile)
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Downloaded', `Saved to:\n${localUri}`);
        return;
      }

      await Sharing.shareAsync(localUri);
    } catch (err: any) {
      console.error('Download/share error:', err);
      Alert.alert('Error', err?.message || 'Failed to download the file');
    }
  };

  // ✅ Combine remarks + uploaded attachments into one timeline (Messenger-like)
  type TimelineItem =
    | { kind: 'remark'; key: string; createdAt: string; isBrgy: boolean; text: string }
    | { kind: 'attachment'; key: string; createdAt: string; isBrgy: boolean; url: string; name: string; type?: string | null };

  const isBarangaySideRemark = (r: MaintenanceRemark) => {
    const roleId = r.CreatedByRoleId ?? null;
    if (roleId === 1 || roleId === 2) return true;

    const roleName = (r.CreatedByRoleName ?? r.User_role ?? '').toLowerCase();
    return roleName.includes('admin') || roleName.includes('barangay');
  };

  const timeline: TimelineItem[] = useMemo(() => {
    const remarkItems: TimelineItem[] = (messages || []).map(r => ({
      kind: 'remark',
      key: `r-${r.Remark_Id}`,
      createdAt: r.Created_at,
      isBrgy: isBarangaySideRemark(r), // ✅ changed
      text: r.Remark_text,
    }));

    const attachmentItems: TimelineItem[] = (uploadedAttachments || []).map(a => ({
      kind: 'attachment',
      key: `a-${a.Attachment_Id}`,
      createdAt: a.Uploaded_at,
      isBrgy: currentUserId ? a.Uploaded_by !== currentUserId : true,
      url: a.File_path,
      name: a.File_name,
      type: a.File_type,
    }));

    return [...remarkItems, ...attachmentItems].sort(
      (x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime()
    );
  }, [messages, uploadedAttachments, currentUserId]);

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

          {/* Uploaded attachments strip (small squares, clickable, no "Add") */}
          <View style={tw`px-4 pt-3 pb-2 border-b border-gray-100`}>
            <View style={tw`flex-row items-center justify-between mb-2`}>
              <Text style={tw`text-sm font-semibold text-gray-700`}>Attachments</Text>
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
                  <TouchableOpacity
                    key={`uploaded_${att.Attachment_Id}`}
                    activeOpacity={0.85}
                    onPress={() => openPreview(att.File_path, att.File_name, att.File_type)}
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
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Timeline (remarks + attachments) */}
          <ScrollView ref={scrollRef} style={tw`flex-1 p-4`}>
            {timeline.length === 0 ? (
              <Text style={tw`text-gray-400 text-center py-8`}>No remarks or attachments yet</Text>
            ) : (
              timeline.map((item) => {
                const isBrgy = item.isBrgy;

                return (
                  <View
                    key={item.key}
                    style={{ marginBottom: 12, alignSelf: isBrgy ? 'flex-start' : 'flex-end', maxWidth: '78%' }}
                  >
                    {/* ✅ "You" aligned right (no time beside it) */}
                    <View style={{ flexDirection: 'row', justifyContent: isBrgy ? 'flex-start' : 'flex-end', marginBottom: 4 }}>
                      <Text style={{ fontWeight: '600', fontSize: 13, color: '#1F4D36' }}>
                        {isBrgy ? 'Barangay' : 'You'}
                      </Text>
                    </View>

                    <View
                      style={[
                        { padding: 10, borderRadius: 10, backgroundColor: isBrgy ? '#88AB8E' : '#FFFFFF' },
                        shadowStyle,
                      ]}
                    >
                      {item.kind === 'remark' ? (
                        <Text style={{ color: isBrgy ? '#FFFFFF' : '#1F4D36', fontSize: 14 }}>
                          {item.text}
                        </Text>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => openPreview(item.url, item.name, item.type)}
                        >
                          {isLikelyImage(item.name || item.url, item.type) ? (
                            <Image
                              source={{ uri: item.url }}
                              resizeMode="cover"
                              style={{ width: 160, height: 160, borderRadius: 10 }}
                            />
                          ) : (
                            <Text style={{ color: isBrgy ? '#FFFFFF' : '#1F4D36', fontSize: 14 }}>
                              Attachment
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}

                      {/* ✅ Always show details under the bubble (no clicking) */}
                      <Text style={{ marginTop: 6, fontSize: 11, color: isBrgy ? '#F1F5F9' : '#6B7280' }}>
                        {formatFullStamp(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Pending attachments ABOVE input */}
          {!readOnly && pendingAttachments.length > 0 && (
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
              <Text style={tw`text-[10px] text-gray-400 mt-1`}>Selected: {pendingAttachments.length}</Text>
            </View>
          )}

          {/* Input Area */}
          {!readOnly && (
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

                <TouchableOpacity
                  onPress={handleSendMessage}
                  disabled={!canSend}
                  style={{ marginLeft: 8, opacity: canSend ? 1 : 0.35 }}
                >
                  <LucideSend color="#88AB8E" style={{ opacity: 0.89 }} size={20} strokeWidth={1.5} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ✅ Attachment preview + download */}
          <Modal visible={previewVisible} transparent animationType="fade">
            <View style={tw`flex-1 bg-black bg-opacity-70 items-center justify-center`}>
              <View style={tw`bg-white rounded-lg w-11/12 max-h-5/6 overflow-hidden`}>
                <View style={tw`flex-row justify-between items-center p-3 border-b border-gray-200`}>
                  <Text style={tw`text-sm font-semibold text-gray-800`}>Attachment</Text>

                  <View style={tw`flex-row items-center`}>
                    <TouchableOpacity onPress={handleDownload} style={tw`mr-4`}>
                      <LucideDownload color="#2E523A" size={18} strokeWidth={2} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setPreviewVisible(false);
                        setPreviewUrl(null);
                        setPreviewIsImage(false);
                      }}
                    >
                      <LucideX color="#2E523A" size={18} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={tw`p-3`}>
                  {previewUrl && previewIsImage ? (
                    <Image
                      source={{ uri: previewUrl }}
                      resizeMode="contain"
                      style={{ width: '100%', height: 420, backgroundColor: '#111827', borderRadius: 10 }}
                    />
                  ) : (
                    <View style={tw`h-40 items-center justify-center bg-gray-100 rounded-lg border border-gray-200`}>
                      <Text style={tw`text-gray-600 text-sm`}>Preview not available</Text>
                      <Text style={tw`text-gray-400 text-xs mt-1`}>Use Download to save/share</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </Modal>

        </View>
      </View>
    </Modal>
  );
}
