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
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// ✅ use legacy FS for downloadAsync on SDK 54+
import * as LegacyFS from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import tw from '../../utils/tailwind';
import { Image as LucideImage, Send as LucideSend, X as LucideX, Download as LucideDownload } from 'lucide-react-native';
import {
  MaintenanceRemark,
  getTicketAttachments,
  MaintenanceAttachment,
  getTicketEvents,            // ✅ NEW
  MaintenanceEvent,           // ✅ NEW
} from '../../services/maintenanceService';

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

  readOnly?: boolean;

  // ✅ NEW: only show attachments up to this datetime (Operator Cancelled-history snapshot)
  cutoffAt?: string | null;
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
  readOnly = false,
  cutoffAt = null,
}: CommentsSectionProps) {
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // Android-only: tiny style toggle to force reflow without remount (prevents stuck-gap without "tick")
  const [androidReflowPad, setAndroidReflowPad] = useState(0);

  const restoreScrollAfterRemountRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [uploadedAttachments, setUploadedAttachments] = useState<MaintenanceAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);

  // ✅ Preview modal state
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewIsImage, setPreviewIsImage] = useState(false);

  const [ticketEvents, setTicketEvents] = useState<MaintenanceEvent[]>([]); // ✅ NEW
  const [loadingEvents, setLoadingEvents] = useState(false);               // ✅ NEW

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

  const normalizeRoleName = (role?: string | null) => {
    if (!role) return '';
    return role.replace(/_staff/gi, '').trim();
  };

  const roleTag = (roleId?: number | null, roleName?: string | null, legacy?: string | null) => {
    if (roleId === 1 || roleId === 2) return 'Barangay';
    if (roleId === 3) return 'Operator';

    const s = String(roleName ?? legacy ?? '').toLowerCase();
    if (s.includes('admin') || s.includes('barangay') || s.includes('staff')) return 'Barangay';
    if (s.includes('operator')) return 'Operator';
    return 'User';
  };

  const senderLabelForRemark = (r: MaintenanceRemark) => {
    const name = (r.CreatedByName && r.CreatedByName.trim()) || 'Unknown';
    const tag = roleTag(r.CreatedByRoleId, r.CreatedByRoleName, r.User_role ?? null);
    return `${name} (${tag})`;
  };

  const senderLabelForAttachment = (a: MaintenanceAttachment) => {
    const name = (a.UploaderName && a.UploaderName.trim()) || 'Unknown';
    const tag = roleTag(a.UploaderRoleId ?? null, a.UploaderRoleName ?? null, a.UploaderRole ?? null);
    return `${name} (${tag})`;
  };

  const eventTitle = (t: string) => {
    switch (t) {
      case 'REQUESTED': return 'Requested';
      case 'ACCEPTED': return 'Accepted';
      case 'REASSIGNED': return 'Reassigned';
      case 'FOR_VERIFICATION': return 'For Verification';
      case 'CANCEL_REQUESTED': return 'Cancel Requested';
      case 'CANCELLED': return 'Cancelled';
      case 'COMPLETED': return 'Completed';
      case 'DELETED': return 'Deleted';
      default:
        return t
          .toLowerCase()
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
    }
  };

  const formatActor = (name?: string | null, roleName?: string | null) => {
    const n = (name || 'Unknown').trim();
    const r = normalizeRoleName(roleName || '');
    return r ? `${n} (${r})` : n;
  };

  const loadEvents = async () => {
    if (!requestId) return;
    setLoadingEvents(true);
    try {
      const data = await getTicketEvents(requestId, cutoffAt ?? undefined); // ✅ apply cutoff if needed
      setTicketEvents(data || []);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadAttachments = async () => {
    if (!requestId) return;
    setLoadingAttachments(true);
    try {
      const data = await getTicketAttachments(requestId, cutoffAt ?? undefined);
      setUploadedAttachments(data);
    } catch (err) {
      console.error('Error loading attachments:', err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadEvents();       // ✅ NEW
      loadAttachments();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [visible, cutoffAt]);

  useEffect(() => {
    if (visible) {
      loadEvents();       // ✅ NEW (optional refresh hook)
      loadAttachments();
    }
  }, [refreshAttachmentsSignal, cutoffAt]);

  useEffect(() => {
    if (!visible) {
      setNewMessage('');
      setPendingAttachments([]);
      setPreviewVisible(false);
      setPreviewUrl(null);
      setPreviewIsImage(false);
      setTicketEvents([]); // ✅ NEW
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

  // ✅ Combine events + remarks + uploaded attachments into one timeline
  type TimelineItem =
    | {
        kind: 'event';
        key: string;
        createdAt: string;
        title: string;
        actorDisplay: string;
        toDisplay?: string | null;
        reason?: string | null;
      }
    | { kind: 'remark'; key: string; createdAt: string; isMine: boolean; text: string; senderLabel: string }
    | { kind: 'attachment'; key: string; createdAt: string; isMine: boolean; url: string; name: string; type?: string | null; senderLabel: string };

  const timeline: TimelineItem[] = useMemo(() => {
    const eventItems: TimelineItem[] = (ticketEvents || []).map(ev => {
      const title = eventTitle(ev.Event_type);

      const actorDisplay = formatActor(ev.ActorName, ev.ActorRoleName ?? null);

      const isReassigned = ev.Event_type === 'REASSIGNED';
      const toDisplay =
        isReassigned && ev.ToActorName
          ? formatActor(ev.ToActorName, ev.ToActorRoleName ?? null)
          : null;

      const isCancelRequested = ev.Event_type === 'CANCEL_REQUESTED';
      const reason = isCancelRequested ? (ev.Notes || '').trim() : null;

      return {
        kind: 'event',
        key: `e-${ev.Event_Id}`,
        createdAt: ev.Created_At,
        title,
        actorDisplay,
        toDisplay,
        reason: reason || null,
      };
    });

    const remarkItems: TimelineItem[] = (messages || []).map(r => ({
      kind: 'remark',
      key: `r-${r.Remark_Id}`,
      createdAt: r.Created_at,
      isMine: !!currentUserId && r.Created_by === currentUserId,
      text: r.Remark_text,
      senderLabel: senderLabelForRemark(r),
    }));

    const attachmentItems: TimelineItem[] = (uploadedAttachments || []).map(a => ({
      kind: 'attachment',
      key: `a-${a.Attachment_Id}`,
      createdAt: a.Uploaded_at,
      isMine: !!currentUserId && a.Uploaded_by === currentUserId,
      url: a.File_path,
      name: a.File_name,
      type: a.File_type,
      senderLabel: senderLabelForAttachment(a),
    }));

    return [...eventItems, ...remarkItems, ...attachmentItems].sort(
      (x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime()
    );
  }, [ticketEvents, messages, uploadedAttachments, currentUserId]);

  const getEventTheme = (eventType: string) => {
    switch (eventType) {
      case 'REQUESTED':
        return { border: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)', text: '#1D4ED8' };
      case 'ACCEPTED':
        return { border: '#0D9488', bg: 'rgba(13, 148, 136, 0.08)', text: '#0F766E' };
      case 'REASSIGNED':
        return { border: '#059669', bg: 'rgba(5, 150, 105, 0.08)', text: '#047857' };
      case 'FOR_VERIFICATION':
        return { border: '#7C3AED', bg: 'rgba(124, 58, 237, 0.08)', text: '#6D28D9' };
      case 'CANCEL_REQUESTED':
        return { border: '#EA580C', bg: 'rgba(234, 88, 12, 0.08)', text: '#C2410C' };
      case 'CANCELLED':
        return { border: '#DC2626', bg: 'rgba(220, 38, 38, 0.08)', text: '#B91C1C' };
      case 'COMPLETED':
        return { border: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)', text: '#15803D' };
      case 'DELETED':
        return { border: '#6B7280', bg: 'rgba(107, 114, 128, 0.08)', text: '#374151' };
      default:
        return { border: '#2E523A', bg: 'rgba(53, 88, 66, 0.06)', text: '#1F4D36' };
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={tw`flex-1 bg-black/50`}>
        <KeyboardAvoidingView
          style={{
            flex: 1,
            justifyContent: keyboardVisible ? 'flex-end' : 'center',
            alignItems: 'center',
            paddingBottom: Platform.OS === 'android' ? androidReflowPad : 0,
          }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <View
            style={[
              tw`bg-white rounded-lg w-11/12 flex flex-col`,
              { height: '85%', marginBottom: keyboardVisible ? 12 : 0 },
            ]}
          >
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
            <ScrollView
              ref={scrollRef}
              style={tw`flex-1 p-4`}
              contentContainerStyle={tw`pb-3`}
              keyboardShouldPersistTaps="handled"
            >
              {(loadingEvents || loadingAttachments) && timeline.length === 0 ? (
                <Text style={tw`text-gray-400 text-center py-8`}>Loading...</Text>
              ) : timeline.length === 0 ? (
                <Text style={tw`text-gray-400 text-center py-8`}>No history yet</Text>
              ) : (
                timeline.map((item) => {
                  if (item.kind === 'event') {
                    const theme = getEventTheme((ticketEvents.find(e => `e-${e.Event_Id}` === item.key)?.Event_type) || '');

                    // ✅ Full-width event box "touching" edges: compensate ScrollView p-4 with -16 margins.
                    return (
                      <View
                        key={item.key}
                        style={{
                          marginHorizontal: -16,
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          backgroundColor: theme.bg,
                          borderLeftWidth: 4,
                          borderLeftColor: theme.border,
                          marginBottom: 12,
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                          {/* ✅ whole event text colored */}
                          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text, flex: 1 }}>
                            {item.toDisplay
                              ? `${item.title} by ${item.actorDisplay} to ${item.toDisplay}`
                              : `${item.title} by ${item.actorDisplay}`}
                          </Text>

                          {/* ✅ time stays muted */}
                          <Text style={{ fontSize: 11, color: 'rgba(31,77,54,0.7)' }}>
                            {formatFullStamp(item.createdAt)}
                          </Text>
                        </View>

                        {!!item.reason && (
                          <Text style={{ marginTop: 6, fontSize: 12, color: theme.text }}>
                            Reason: {item.reason}
                          </Text>
                        )}
                      </View>
                    );
                  }

                  const isMine = item.isMine;

                  // ✅ existing bubble UI (remarks + attachments) stays as-is
                  return (
                    <View
                      key={item.key}
                      style={{ marginBottom: 12, alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '78%' }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
                        <Text style={{ fontWeight: '600', fontSize: 13, color: '#1F4D36' }}>
                          {item.senderLabel}
                        </Text>
                      </View>

                      <View
                        style={[
                          { padding: 10, borderRadius: 10, backgroundColor: isMine ? '#FFFFFF' : '#88AB8E' },
                          shadowStyle,
                        ]}
                      >
                        {item.kind === 'remark' ? (
                          <Text style={{ color: isMine ? '#1F4D36' : '#FFFFFF', fontSize: 14 }}>
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
                              <Text style={{ color: isMine ? '#1F4D36' : '#FFFFFF', fontSize: 14 }}>
                                Attachment
                              </Text>
                            )}
                          </TouchableOpacity>
                        )}

                        <Text style={{ marginTop: 6, fontSize: 11, color: isMine ? '#6B7280' : '#F1F5F9' }}>
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
                    onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)}
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
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
