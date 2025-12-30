import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import tw from '../utils/tailwind';
import AttachmentModal from './AttachmentModal';
import CommentsSection from './CommentsSection';
import ForCompletion from './ForCompletion';
import { Image as LucideImage, Send as LucideSend, Check as LucideCheck } from 'lucide-react-native';
import { 
  uploadToCloudinary, 
  addAttachmentToTicket, 
  getTicketRemarks, 
  addRemark,
  MaintenanceRemark 
} from '../services/maintenanceService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RequestItem {
  id: string;
  title: string;
  description: string;
  requestNumber: string;
  dateAssigned: string;
  dueDate: string;
  remarksBrgy: string;
  remarksMaintenance: string;
  status: 'Pending' | 'Done' | 'For review' | 'Canceled';
  isChecked: boolean;
  isExpanded: boolean;
  hasAttachment: boolean;
}

interface RequestCardProps {
  request: RequestItem;
  onToggleExpand: (id: string) => void;
  onToggleCheck: (id: string) => void;
  onMarkDone?: (requestId: string, remarks: string, attachments: any[]) => Promise<void>;
}

export default function RequestCard({
  request,
  onToggleExpand,
  onToggleCheck,
  onMarkDone
}: RequestCardProps) {
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [forCompletionModalVisible, setForCompletionModalVisible] = useState(false);

  const [remarks, setRemarks] = useState<MaintenanceRemark[]>([]);
  const [loadingRemarks, setLoadingRemarks] = useState(false);
  const [inlineNewMsg, setInlineNewMsg] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('Operator');

  // ✅ NEW: tap-to-expand remark details
  const [expandedRemarkIds, setExpandedRemarkIds] = useState<Set<number>>(new Set());

  const inlineScrollRef = useRef<any>(null);

  const formatTimeOnly = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
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

  // ✅ Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setCurrentUserId(user.Account_id || user.account_id);
          
          const roleId = user.Roles || user.role;
          const roleMap: { [key: number]: string } = {
            1: 'Admin',
            2: 'Barangay_staff',
            3: 'Operator',
            4: 'Household'
          };
          setCurrentUserRole(roleMap[roleId] || 'Operator');
        }
      } catch (err) {
        console.error('Error loading user:', err);
      }
    };
    loadUser();
  }, []);

  // ✅ Load remarks when card is expanded
  useEffect(() => {
    if (request.isExpanded && !loadingRemarks && remarks.length === 0) {
      loadRemarks();
    }
  }, [request.isExpanded]);

  // ✅ Load remarks from backend
  const loadRemarks = async () => {
    setLoadingRemarks(true);
    try {
      const data = await getTicketRemarks(Number(request.id));
      setRemarks(data);
    } catch (error) {
      console.error('Error loading remarks:', error);
    } finally {
      setLoadingRemarks(false);
    }
  };

  // ✅ Scroll to bottom when remarks change
  useEffect(() => {
    if (inlineScrollRef.current && typeof inlineScrollRef.current.scrollToEnd === 'function') {
      setTimeout(() => {
        inlineScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [remarks.length]);

  // ✅ Handle sending inline remark
  const handleInlineSend = async () => {
    if (!inlineNewMsg.trim() || !currentUserId) return;
    
    try {
      const newRemark = await addRemark(
        Number(request.id),
        inlineNewMsg.trim(),
        currentUserId,
        currentUserRole
      );
      
      setRemarks(prev => [...prev, newRemark]);
      setInlineNewMsg('');
    } catch (error: any) {
      console.error('Error adding remark:', error);
      Alert.alert('Error', error?.message || 'Failed to add remark');
    }
  };

  // ✅ Handle sending remark from modal
  const handleModalSend = async (text: string) => {
    if (!text.trim() || !currentUserId) return;
    
    try {
      const newRemark = await addRemark(
        Number(request.id),
        text.trim(),
        currentUserId,
        currentUserRole
      );
      
      setRemarks(prev => [...prev, newRemark]);
    } catch (error: any) {
      console.error('Error adding remark:', error);
      Alert.alert('Error', error?.message || 'Failed to add remark');
    }
  };

  const handleMarkDone = async (completionRemarks: string, attachments: any[]) => {
    if (!currentUserId) {
      Alert.alert('Error', 'User not found. Please sign in again.');
      return;
    }

    try {
      if (attachments.length > 0) {
        const uploadResults = await Promise.allSettled(
          attachments.map(async (attachment) => {
            const cloudinaryUrl = await uploadToCloudinary(
              attachment.uri,
              attachment.name,
              attachment.type
            );

            await addAttachmentToTicket(
              Number(request.id),
              currentUserId,
              cloudinaryUrl,
              attachment.name,
              attachment.type,
              attachment.size
            );

            return attachment.name;
          })
        );

        const failed = uploadResults.filter(r => r.status === 'rejected');
        const succeeded = uploadResults.filter(r => r.status === 'fulfilled');

        if (completionRemarks.trim()) {
          await addRemark(
            Number(request.id),
            `[COMPLETION] ${completionRemarks}`,
            currentUserId,
            currentUserRole
          );
        }

        if (onMarkDone) {
          await onMarkDone(request.id, completionRemarks, attachments);
        }

        if (failed.length > 0) {
          Alert.alert(
            'Partial Success',
            `Request marked for verification.\n${succeeded.length} of ${attachments.length} photos uploaded successfully.`
          );
        } else {
          Alert.alert('Success', `Request marked for verification with ${attachments.length} photo(s)`);
        }
      } else {
        if (onMarkDone) {
          await onMarkDone(request.id, completionRemarks, attachments);
        }
        Alert.alert('Success', 'Request marked for verification');
      }
      
      await loadRemarks();
    } catch (error: any) {
      console.error('Error in handleMarkDone:', error);
      Alert.alert('Error', error?.message || 'Failed to mark request as done');
      throw error;
    }
  };

  const isPending = request.status === 'Pending';
  const buttonLabel = isPending ? 'For Completion' : 'Follow-up';

  const shadowStyle = {
    shadowColor: '#88AB8E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  };

  return (
    <View style={tw`mb-4 bg-green-light rounded-xl overflow-hidden`}> 
      <View style={tw`p-5 mb-6 relative overflow-visible`}>
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View style={tw`flex-row items-center gap-3`}>
            <Text style={tw`text-primary text-[13px] font-bold`}>
              {request.title}
            </Text>
            
            <View style={tw`bg-[#AFC8AD] border border-text-gray rounded-xl px-3 py-1`}>
              <Text style={tw`text-white text-[10px] font-bold`}>
                {request.status}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => onToggleCheck(request.id)}
            style={tw`w-[18px] h-[18px] rounded-sm border-2 border-[#49454F] items-center justify-center`}
          >
            {request.isChecked && (
              <View style={[tw`flex-1 w-full h-full items-center justify-center rounded-sm`, { backgroundColor: '#2E523A' }]}>
                <LucideCheck color="#fff" size={14} strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={tw`border-t border-green-light mb-4`} />

        <View style={tw`gap-2`}>
          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-[#4F6853] text-[11px] font-semibold`}>
              Request number:
            </Text>
            <Text style={tw`text-text-gray text-[11px] font-semibold`}>
              {request.requestNumber}
            </Text>
          </View>

          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-[#4F6853] text-[11px] font-semibold`}>
              Date Assigned:
            </Text>
            <Text style={tw`text-text-gray text-[11px] font-semibold`}>
              {request.dateAssigned}
            </Text>
          </View>

          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-[#4F6853] text-[11px] font-semibold`}>
              Due Date:
            </Text>
            <Text style={tw`text-text-gray text-[11px] font-semibold`}>
              {request.dueDate}
            </Text>
          </View>

          {/* ✅ NEW: Issue Description (replaces the two "Remarks from ..." rows) */}
          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-[#4F6853] text-[11px] font-semibold`}>
              Issue Description:
            </Text>
            <Text style={tw`text-text-gray text-[11px] font-semibold text-right flex-1 ml-4`}>
              {request.description || '—'}
            </Text>
          </View>

          {request.isExpanded && (
            <>
              {isPending && request.hasAttachment && (
                <View style={tw`mb-3 flex-row items-center justify-between`}>
                  <Text style={tw`text-gray-700 font-semibold text-sm`}>Attachment from brgy</Text>
                  <TouchableOpacity onPress={() => setAttachmentModalVisible(true)}>
                    <Text style={tw`text-green-800 underline text-sm`}>brokenfilter.png</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isPending && (
                <View style={tw`mb-4`}>
                  <View style={tw`flex-row items-center justify-between mb-2`}>
                    <Text style={tw`text-gray-700 font-semibold text-sm`}>
                      {/* ✅ Comments -> Remarks */}
                      Remarks
                    </Text>
                  </View>

                  <View style={tw`bg-white border border-gray-300 rounded p-3 relative`}>
                    <View style={tw`absolute right-3 top-3 z-10`}>
                      <TouchableOpacity onPress={() => setCommentsModalVisible(true)}>
                        <Text style={tw`text-gray-600 text-lg`}>⛶</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={tw`min-h-24 max-h-40`}>
                      {loadingRemarks ? (
                        <View style={tw`items-center justify-center py-4`}>
                          <Text style={tw`text-gray-500 text-xs`}>Loading remarks...</Text>
                        </View>
                      ) : (
                        <ScrollView ref={inlineScrollRef}>
                          {remarks.length === 0 ? (
                            <Text style={tw`text-gray-400 text-xs italic`}>No remarks yet</Text>
                          ) : (
                            remarks.map((remark) => {
                              const isBrgy = remark.User_role === 'Barangay_staff' || remark.User_role === 'Admin';
                              const isExpandedRemark = expandedRemarkIds.has(remark.Remark_Id);

                              return (
                                <View
                                  key={remark.Remark_Id}
                                  style={{
                                    marginBottom: 12,
                                    alignSelf: isBrgy ? 'flex-start' : 'flex-end',
                                    maxWidth: '78%',
                                  }}
                                >
                                  <View style={{ marginBottom: 4, flexDirection: 'row' }}>
                                    <Text style={{ fontWeight: '600', fontSize: 13, color: '#1F4D36' }}>
                                      {isBrgy ? 'Barangay' : 'You'}
                                    </Text>

                                    {/* ✅ Time only */}
                                    <Text style={tw`text-xs text-gray-400 ml-2`}>
                                      {formatTimeOnly(remark.Created_at)}
                                    </Text>
                                  </View>

                                  {/* ✅ Tap bubble to show more info */}
                                  <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={() => toggleRemarkExpanded(remark.Remark_Id)}
                                    style={[
                                      {
                                        padding: 10,
                                        borderRadius: 10,
                                        backgroundColor: isBrgy ? '#88AB8E' : '#FFFFFF',
                                      },
                                      shadowStyle,
                                    ]}
                                  >
                                    <Text style={{ color: isBrgy ? '#FFFFFF' : '#1F4D36', fontSize: 14 }}>
                                      {remark.Remark_text}
                                    </Text>

                                    {isExpandedRemark && (
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
                      )}
                    </View>

                    <View style={tw`mt-3`}>
                      <View style={tw`flex-row items-center bg-white border border-gray-200 rounded-full px-3`} >
                        <TouchableOpacity onPress={() => { /* open image picker */ }} style={{ marginRight: 8 }}>
                          <LucideImage color="#88AB8E" style={{ opacity: 0.89 }} size={20} strokeWidth={1.5} />
                        </TouchableOpacity>

                        <TextInput
                          style={[tw`flex-1 text-sm`, { paddingVertical: 0, height: 24, textAlignVertical: 'center' }]}
                          placeholder="Type a remark..."
                          placeholderTextColor="#8A8A8A"
                          value={inlineNewMsg}
                          onChangeText={setInlineNewMsg}
                          multiline={false}
                        />

                        <TouchableOpacity onPress={handleInlineSend} style={{ marginLeft: 8 }}>
                          <LucideSend color="#88AB8E" style={{ opacity: 0.89 }} size={20} strokeWidth={1.5} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              <View style={tw`mt-2 items-center`}>
                <TouchableOpacity
                  onPress={() => setForCompletionModalVisible(true)}
                  style={tw`bg-[#2E523A] rounded-md py-2 px-6`}
                >
                  <Text style={tw`text-white text-[11px] font-bold`}>
                    {buttonLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={tw`h-4`} />

        <View style={tw`mt-2 relative`}>
          {!request.isExpanded && isPending && (
            <View style={[{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }]}>
              <TouchableOpacity
                onPress={() => setForCompletionModalVisible(true)}
                style={tw`bg-[#2E523A] rounded-md py-2 px-4`}
              >
                <Text style={tw`text-white text-[11px] font-bold`}>{buttonLabel}</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={() => onToggleExpand(request.id)}
            style={[tw`bg-[#88AB8E] rounded-full w-6 h-6 items-center justify-center`, { position: 'absolute', right: 0 }]}
          >
            <Svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <Path
                d={request.isExpanded ? "M9 5L5 1L1 5" : "M1 1L5 5L9 1"}
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      <AttachmentModal
        visible={attachmentModalVisible}
        onClose={() => setAttachmentModalVisible(false)}
        filename="brokenfilter.png"
      />

      <CommentsSection
        visible={commentsModalVisible}
        onClose={() => setCommentsModalVisible(false)}
        messages={remarks}
        onSendMessage={handleModalSend}
      />

      <ForCompletion
        visible={forCompletionModalVisible}
        onClose={() => setForCompletionModalVisible(false)}
        onMarkDone={handleMarkDone}
        requestId={request.id} // ✅ Pass requestId
      />
    </View>
  );
}
