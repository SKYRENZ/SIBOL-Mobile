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
  MaintenanceRemark,
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
  status: 'Pending' | 'Done' | 'For review' | 'Canceled' | 'Cancel Requested';
  isChecked: boolean;
  isExpanded: boolean;
  hasAttachment: boolean;
  priority?: string | null;

  // ✅ NEW: for Operator Cancelled-history snapshot
  cancelCutoffAt?: string | null;
}

interface RequestCardProps {
  request: RequestItem;
  onToggleExpand: (id: string) => void;
  onToggleCheck: (id: string) => void;
  onMarkDone?: (requestId: string, remarks: string, attachments: any[]) => Promise<void>;
  onCancelRequest?: (requestId: string, reason: string) => Promise<void>; // ✅ NEW
}

interface RemarkAttachment {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export default function RequestCard({
  request,
  onToggleExpand,
  onToggleCheck,
  onMarkDone,
  onCancelRequest, // ✅ NEW
}: RequestCardProps) {
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [forCompletionModalVisible, setForCompletionModalVisible] = useState(false);
  const [completionModalMode, setCompletionModalMode] = useState<'completion' | 'cancel'>('completion'); // ✅ NEW

  const [remarks, setRemarks] = useState<MaintenanceRemark[]>([]);
  const [loadingRemarks, setLoadingRemarks] = useState(false);
  const [inlineNewMsg, setInlineNewMsg] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('Operator');

  // ✅ NEW: tap-to-expand remark details
  const [expandedRemarkIds, setExpandedRemarkIds] = useState<Set<number>>(new Set());
  const [attachmentsRefreshSignal, setAttachmentsRefreshSignal] = useState(0);

  // ✅ NEW: open modal and auto-open picker (for small UI attach button)
  const [autoPickOnOpen, setAutoPickOnOpen] = useState(false);

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
      const before = request.status === 'Canceled' ? (request.cancelCutoffAt ?? undefined) : undefined;
      const data = await getTicketRemarks(Number(request.id), before);
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
    if (!canComment) return; // ✅ block inline send for Done (view-only)
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

  // ✅ Handle sending remark from modal (text + attachments)
  const handleModalSend = async (text: string, attachments: RemarkAttachment[]) => {
    if (!currentUserId) return;

    const trimmed = text.trim();
    const hasAttachments = !!attachments?.length;

    // ✅ allow attachments-only; block only if nothing to send
    if (!trimmed && !hasAttachments) return;

    try {
      // 1) Upload + attach to ticket
      if (hasAttachments) {
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
        if (failed.length > 0) {
          Alert.alert('Warning', `${failed.length} attachment(s) failed to upload.`);
        }

        // refresh attachments section in modal
        setAttachmentsRefreshSignal(x => x + 1);
      }

      // 2) Add remark ONLY if user typed something
      if (trimmed) {
        const newRemark = await addRemark(
          Number(request.id),
          trimmed,
          currentUserId,
          currentUserRole
        );
        setRemarks(prev => [...prev, newRemark]);
      }
    } catch (error: any) {
      console.error('Error adding remark with attachments:', error);
      Alert.alert('Error', error?.message || 'Failed to send remark');
      throw error;
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
  const isForReview = request.status === 'For review';
  const isDone = request.status === 'Done';
  const isCancelRequested = request.status === 'Cancel Requested';
  const isCanceled = request.status === 'Canceled'; // ✅ NEW

  // ✅ can chat only in Pending and For review (NOT Cancel Requested / Canceled / Done)
  const canComment = isPending || isForReview;

  // ✅ Done + Canceled are view-only
  const isViewOnly = isDone || isCanceled;

  const buttonLabel = 'For Completion';
  const followUpLabel = 'Follow up';

  const handleFollowUp = () => {
    // Follow-up just opens remarks modal (send message/attachments)
    setCommentsModalVisible(true);
  };

  const shadowStyle = {
    shadowColor: '#88AB8E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  };

  // REMOVE / stop using this for bubble side:
  // const isBarangaySideRemark = (remark: MaintenanceRemark) => { ... }

  const isMineRemark = (remark: MaintenanceRemark) => {
    return !!currentUserId && remark.Created_by === currentUserId;
  };

  const roleTag = (roleId?: number | null, roleName?: string | null, legacy?: string | null) => {
    if (roleId === 1 || roleId === 2) return 'Barangay';
    if (roleId === 3) return 'Operator';

    const s = String(roleName ?? legacy ?? '').toLowerCase();
    if (s.includes('admin') || s.includes('barangay')) return 'Barangay';
    if (s.includes('operator')) return 'Operator';
    return 'User';
  };

  const senderLabel = (remark: MaintenanceRemark) => {
    const name =
      (remark.CreatedByName && remark.CreatedByName.trim()) ||
      (remark.Created_by === currentUserId ? 'You' : 'Unknown');

    const tag = roleTag(remark.CreatedByRoleId, remark.CreatedByRoleName, remark.User_role ?? null);
    return `${name} (${tag})`;
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

          {/* ✅ NEW: Priority row with colors */}
          <View style={tw`flex-row justify-between items-center`}>
            <Text style={tw`text-[#4F6853] text-[11px] font-semibold`}>
              Priority:
            </Text>

            {(() => {
              const p = (request.priority || '').toLowerCase();
              const pill =
                p === 'critical'
                  ? 'bg-red-600'
                  : p === 'urgent'
                    ? 'bg-orange-500'
                    : p === 'mild'
                      ? 'bg-blue-600'
                      : 'bg-gray-400';

              return (
                <View style={tw`${pill} px-2 py-1 rounded-full`}>
                  <Text style={tw`text-white text-[10px] font-bold`}>
                    {request.priority || '—'}
                  </Text>
                </View>
              );
            })()}
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

              {/* ✅ SHOW Remarks section for Pending, For review, Done, Cancel Requested, Canceled */}
              {(isPending || isForReview || isDone || isCancelRequested || isCanceled) && (
                <View style={tw`mb-4`}>
                  <View style={tw`flex-row items-center justify-between mb-2`}>
                    <Text style={tw`text-gray-700 font-semibold text-sm`}>Remarks</Text>
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
                              const isMine = isMineRemark(remark); // ✅ me vs others
                              const isExpandedRemark = expandedRemarkIds.has(remark.Remark_Id);

                              return (
                                <View
                                  key={remark.Remark_Id}
                                  style={{
                                    marginBottom: 12,
                                    alignSelf: isMine ? 'flex-end' : 'flex-start', // ✅
                                    maxWidth: '78%',
                                  }}
                                >
                                  <View style={{ marginBottom: 4, flexDirection: 'row' }}>
                                    <Text style={{ fontWeight: '600', fontSize: 13, color: '#1F4D36' }}>
                                      {senderLabel(remark)}
                                    </Text>

                                    <Text style={tw`text-xs text-gray-400 ml-2`}>
                                      {formatTimeOnly(remark.Created_at)}
                                    </Text>
                                  </View>

                                  <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={() => toggleRemarkExpanded(remark.Remark_Id)}
                                    style={[
                                      {
                                        padding: 10,
                                        borderRadius: 10,
                                        backgroundColor: isMine ? '#FFFFFF' : '#88AB8E', // ✅
                                      },
                                      shadowStyle,
                                    ]}
                                  >
                                    <Text style={{ color: isMine ? '#1F4D36' : '#FFFFFF', fontSize: 14 }}>
                                      {remark.Remark_text}
                                    </Text>

                                    {isExpandedRemark && (
                                      <Text style={{ marginTop: 6, fontSize: 11, color: isMine ? '#6B7280' : '#F1F5F9' }}>
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

                    {/* ✅ Inline input ONLY for Pending + For review */}
                    {canComment && (
                      <View style={tw`mt-3`}>
                        <View style={tw`flex-row items-center bg-white border border-gray-200 rounded-full px-3`} >
                          {/* ✅ Small UI: open modal + picker */}
                          <TouchableOpacity
                            onPress={() => {
                              setAutoPickOnOpen(true);
                              setCommentsModalVisible(true);
                            }}
                            style={{ marginRight: 8 }}
                          >
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
                    )}
                  </View>
                </View>
              )}

              {/* ❌ REMOVE action buttons from here (moved to Bottom controls so arrow stays put) */}
              {/*
              {isPending && ( ...For Completion + Cancel Request... )}
              {isForReview && ( ...Follow up... )}
              */}
            </>
          )}
        </View>

        <View style={tw`h-4`} />

        {/* Bottom controls */}
        <View style={tw`mt-2`}>
          {/* Row 1: Remarks (left) + Expand arrow (right) */}
          <View style={tw`flex-row items-center justify-between`}>
            {!request.isExpanded ? (
              <TouchableOpacity
                onPress={() => {
                  onToggleExpand(request.id);
                  setCommentsModalVisible(true);
                }}
                style={tw`bg-white border border-gray-300 rounded-full px-3 py-2`}
              >
                <Text style={tw`text-text-gray text-[11px] font-semibold`}>Remarks</Text>
              </TouchableOpacity>
            ) : (
              // ✅ Keep the expand arrow in the same place even when expanded
              <View style={tw`flex-1`} />
            )}

            <TouchableOpacity
              onPress={() => onToggleExpand(request.id)}
              style={tw`bg-[#88AB8E] rounded-full w-8 h-8 items-center justify-center`}
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

          {/* ✅ Divider line between expand row and action buttons */}
          {(isPending || isForReview) && (
            <View style={tw`border-t border-green-light mt-3`} />
          )}

          {/* Row 2: Action buttons */}
          {isPending && (
            <View style={tw`mt-3 items-center`}>
              <View style={tw`flex-row items-center`}>
                <TouchableOpacity
                  onPress={() => {
                    setCompletionModalMode('completion');
                    setForCompletionModalVisible(true);
                  }}
                  style={tw`bg-[#2E523A] rounded-md py-2 px-4`}
                >
                  <Text style={tw`text-white text-[11px] font-bold`}>{buttonLabel}</Text>
                </TouchableOpacity>

                <View style={tw`w-3`} />

                <TouchableOpacity
                  onPress={() => {
                    setCompletionModalMode('cancel');
                    setForCompletionModalVisible(true);
                  }}
                  style={tw`bg-[#2E523A] rounded-md py-2 px-4`}
                >
                  <Text style={tw`text-white text-[11px] font-bold`}>Cancel Request</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ✅ Follow up ONLY for real For review, not Cancel Requested */}
          {isForReview && (
            <View style={tw`mt-3 items-center`}>
              <TouchableOpacity
                onPress={handleFollowUp}
                style={tw`bg-[#2E523A] rounded-md py-2 px-4`}
              >
                <Text style={tw`text-white text-[11px] font-bold`}>{followUpLabel}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <AttachmentModal
        visible={attachmentModalVisible}
        onClose={() => setAttachmentModalVisible(false)}
        filename="brokenfilter.png"
      />

      <CommentsSection
        visible={commentsModalVisible}
        onClose={() => {
          setCommentsModalVisible(false);
          setAutoPickOnOpen(false);
        }}
        requestId={Number(request.id)}
        messages={remarks}
        onSendMessage={handleModalSend}
        refreshAttachmentsSignal={attachmentsRefreshSignal}
        currentUserId={currentUserId}
        autoPickOnOpen={autoPickOnOpen}
        onAutoPickHandled={() => setAutoPickOnOpen(false)}
        readOnly={isViewOnly}
        cutoffAt={request.status === 'Canceled' ? (request.cancelCutoffAt ?? null) : null} // ✅ NEW
      />

      <ForCompletion
        visible={forCompletionModalVisible}
        onClose={() => setForCompletionModalVisible(false)}
        mode={completionModalMode} // ✅ NEW
        onMarkDone={handleMarkDone} // completion mode
        onCancelRequest={async (reason) => {
          try {
            await onCancelRequest?.(request.id, reason);
            Alert.alert('Success', 'Cancellation request submitted');
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to submit cancellation request');
          }
        }}
        requestId={request.id}
      />
    </View>
  );
}
