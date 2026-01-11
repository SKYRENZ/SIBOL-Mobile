import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import tw from '../utils/tailwind';
import AttachmentModal from './AttachmentModal';
import CommentsSection from './CommentsSection';
import ForCompletion from './ForCompletion';
import TicketTimelineCard from './TicketTimelineCard';
import { Check as LucideCheck } from 'lucide-react-native';
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
  onCancelRequest,
}: RequestCardProps) {
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [forCompletionModalVisible, setForCompletionModalVisible] = useState(false);
  const [completionModalMode, setCompletionModalMode] = useState<'completion' | 'cancel'>('completion');

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('Operator');

  // ✅ parent keeps remarks so it can pass into CommentsSection modal
  const [remarks, setRemarks] = useState<MaintenanceRemark[]>([]);

  const [attachmentsRefreshSignal, setAttachmentsRefreshSignal] = useState(0);
  const [autoPickOnOpen, setAutoPickOnOpen] = useState(false);

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
            4: 'Household',
          };
          setCurrentUserRole(roleMap[roleId] || 'Operator');
        }
      } catch (err) {
        console.error('Error loading user:', err);
      }
    };
    loadUser();
  }, []);

  // ✅ Load remarks for modal use (TicketTimelineCard will also call onRemarksChange)
  const loadRemarks = async () => {
    try {
      const before = request.status === 'Canceled' ? (request.cancelCutoffAt ?? undefined) : undefined;
      const data = await getTicketRemarks(Number(request.id), before);
      setRemarks(data || []);
    } catch (error) {
      console.error('Error loading remarks:', error);
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
            `${completionRemarks}`,
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
  const isCanceled = request.status === 'Canceled';

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

  // REMOVE / stop using this for bubble side:
  // const isBarangaySideRemark = (remark: MaintenanceRemark) => { ... }

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

              {(isPending || isForReview || isDone || isCancelRequested || isCanceled) && (
                <TicketTimelineCard
                  expanded={request.isExpanded}
                  requestId={Number(request.id)}
                  status={request.status}
                  cutoffAt={request.status === 'Canceled' ? (request.cancelCutoffAt ?? null) : null}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  remarks={remarks}
                  onRemarksChange={setRemarks}
                  canComment={canComment}
                  onOpenModal={() => setCommentsModalVisible(true)}
                  onAttachPress={() => {
                    setAutoPickOnOpen(true);
                    setCommentsModalVisible(true);
                  }}
                />
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
