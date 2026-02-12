import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import tw from '../../utils/tailwind';
import AttachmentModal from '../AttachmentModal';
import CommentsSection from './CommentsSection';
import ForCompletion from './ForCompletion';
import TicketTimelineCard from './TicketTimelineCard';
import {
  uploadToCloudinary,
  addAttachmentToTicket,
  getTicketRemarks,
  addRemark,
  MaintenanceRemark,
} from '../../services/maintenanceService';
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
  status: 'Requested' | 'Pending' | 'Done' | 'For review' | 'Canceled' | 'Cancel Requested';
  isExpanded: boolean;
  hasAttachment: boolean;
  priority?: string | null;

  cancelCutoffAt?: string | null;
}

interface RequestCardProps {
  request: RequestItem;
  onToggleExpand: (id: string) => void;
  onMarkDone?: (requestId: string, remarks: string, attachments: any[]) => Promise<void>;
  onCancelRequest?: (requestId: string, reason: string) => Promise<void>;
  onNotify?: (message: string, type?: 'success'|'info'|'error') => void; // <-- new
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
  onMarkDone,
  onCancelRequest,
  onNotify,
}: RequestCardProps) {
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [forCompletionModalVisible, setForCompletionModalVisible] = useState(false);
  const [completionModalMode, setCompletionModalMode] = useState<'completion' | 'cancel'>('completion');

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('Operator');

  const [remarks, setRemarks] = useState<MaintenanceRemark[]>([]);

  const [attachmentsRefreshSignal, setAttachmentsRefreshSignal] = useState(0);
  const [autoPickOnOpen, setAutoPickOnOpen] = useState(false);
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackType, setSnackType] = useState<'success' | 'info' | 'error'>('success');

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

  const loadRemarks = async () => {
    try {
      const before = request.status === 'Canceled' ? (request.cancelCutoffAt ?? undefined) : undefined;
      const data = await getTicketRemarks(Number(request.id), before);
      setRemarks(data || []);
    } catch (error) {
      console.error('Error loading remarks:', error);
    }
  };

  const handleModalSend = async (text: string, attachments: RemarkAttachment[]) => {
    if (!currentUserId) return;

    const trimmed = text.trim();
    const hasAttachments = !!attachments?.length;

    if (!trimmed && !hasAttachments) return;

    try {
      if (hasAttachments) {
        const uploadResults = await Promise.allSettled(
          attachments.map(async (attachment) => {
            const cloudinaryUrl = await uploadToCloudinary(attachment.uri, attachment.name, attachment.type);

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

        setAttachmentsRefreshSignal(x => x + 1);
      }

      if (trimmed) {
        const newRemark = await addRemark(Number(request.id), trimmed, currentUserId, currentUserRole);
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
            const cloudinaryUrl = await uploadToCloudinary(attachment.uri, attachment.name, attachment.type);

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
          await addRemark(Number(request.id), `${completionRemarks}`, currentUserId, currentUserRole);
        }

        if (onMarkDone) {
          await onMarkDone(request.id, completionRemarks, attachments);
        }

        if (failed.length > 0) {
          onNotify?.(`Marked for verification — ${succeeded.length} of ${attachments.length} photos uploaded`, 'info');
        } else {
          onNotify?.(`Marked for verification (${attachments.length} photo(s))`, 'success');
        }
      } else {
        if (onMarkDone) {
          await onMarkDone(request.id, completionRemarks, attachments);
        }
        onNotify?.('Marked for verification', 'success');
      }

      await loadRemarks();
    } catch (error: any) {
      console.error('Error in handleMarkDone:', error);
      Alert.alert('Error', error?.message || 'Failed to mark request as done');
      throw error;
    }
  };

  const isRequested = request.status === 'Requested';
  const isPending = request.status === 'Pending';
  const isForReview = request.status === 'For review';
  const isDone = request.status === 'Done';
  const isCancelRequested = request.status === 'Cancel Requested';
  const isCanceled = request.status === 'Canceled';

  // display labels (keep internal status values for logic)
  const displayStatus =
    request.status === 'For review' ? 'For Verification' :
    request.status === 'Done' ? 'Completed' :
    request.status;

  // pill colors (bg, border, text) per status
  const statusBgColor =
    isPending ? '#FEF3C7' : // amber-100
    isRequested ? '#2563EB' : // blue-600
    isCancelRequested ? '#EA580C' : // orange-600
    isForReview ? '#7C3AED' : // purple-600
    isDone ? '#16A34A' : // green-600
    isCanceled ? '#DC2626' : '#AFC8AD';
  const statusBorderColor =
    isPending ? '#D97706' : // darker amber
    isRequested ? '#93C5FD' : // lighter blue
    isCancelRequested ? '#FDBA74' : // lighter orange
    isForReview ? '#A78BFA' : // lighter violet/purple
    isDone ? '#A7F3D0' : // lighter green
    isCanceled ? '#FCA5A5' : '#2E523A';
  const statusTextColor = isPending ? '#92400E' : '#FFFFFF';

  // Requested tickets are not yet assigned → avoid calling mark-done/cancel APIs that require assignment
  const canComment = (isPending || isForReview) && !isRequested;
  const isViewOnly = isDone || isCanceled || isRequested;

  const buttonLabel = 'For Completion';

  return (
    <View style={tw`mb-4 bg-green-light rounded-xl overflow-hidden`}>
      <View style={tw`p-5 mb-6 relative overflow-visible`}>
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View style={tw`flex-row items-center gap-3`}>
            <Text style={tw`text-primary text-[13px] font-bold`}>{request.title}</Text>

            {/* ✅ UPDATED: dynamic bg color */}
            <View style={{ backgroundColor: statusBgColor, borderColor: statusBorderColor, borderWidth: 2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ color: statusTextColor, fontSize: 10, fontWeight: '700' }}>{displayStatus}</Text>
            </View>
          </View>

          {/* ✅ Checkbox removed */}
        </View>

        <View style={tw`border-t border-green-light mb-4`} />

        <View style={tw`gap-2`}>
          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-[#4F6853] text-[11px] font-semibold`}>Request number:</Text>
            <Text style={tw`text-text-gray text-[11px] font-semibold`}>{request.requestNumber}</Text>
          </View>

          <View style={tw`flex-row justify-between items-center`}>
            <Text style={tw`text-[#4F6853] text-[11px] font-semibold`}>Priority:</Text>

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
                  <Text style={tw`text-white text-[10px] font-bold`}>{request.priority || '—'}</Text>
                </View>
              );
            })()}
          </View>

          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-[#4F6853] text-[11px] font-semibold`}>Date Assigned:</Text>
            <Text style={tw`text-text-gray text-[11px] font-semibold`}>{request.dateAssigned}</Text>
          </View>

          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-[#4F6853] text-[11px] font-semibold`}>Due Date:</Text>
            <Text style={tw`text-text-gray text-[11px] font-semibold`}>{request.dueDate}</Text>
          </View>

          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-[#4F6853] text-[11px] font-semibold`}>Issue Description:</Text>
            <Text style={tw`text-text-gray text-[11px] font-semibold text-right flex-1 ml-4`}>{request.description || '—'}</Text>
          </View>

          {request.isExpanded && (
            <>
              {(isRequested || isPending || isForReview || isDone || isCancelRequested || isCanceled) && (
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
            </>
          )}
        </View>

        <View style={tw`h-4`} />

        <View style={tw`mt-2`}>
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

          <View style={tw`border-t border-green-light mt-3`} />

          <View style={tw`mt-3 items-center`}>
            {isRequested ? (
              <Text style={tw`text-text-gray text-[11px] font-semibold`}>
                Waiting for staff to accept and assign this request.
              </Text>
            ) : isPending ? (
              <View style={tw`flex-row items-center`}>
                <TouchableOpacity
                  onPress={() => {
                    setCompletionModalMode('completion');
                    setForCompletionModalVisible(true);
                  }}
                  style={tw`bg-[#2E523A] rounded-md py-2 px-4`}
                >
                  <Text style={tw`text-white text-[11px] font-bold`}>For Completion</Text>
                </TouchableOpacity>

                <View style={tw`w-3`} />

                <TouchableOpacity
                  onPress={() => {
                    setCompletionModalMode('cancel');
                    setForCompletionModalVisible(true);
                  }}
                  style={tw`bg-red-600 rounded-md py-2 px-4`}
                >
                  <Text style={tw`text-white text-[11px] font-bold`}>Cancel Request</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
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
            onNotify?.('Cancellation request submitted', 'success');
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to submit cancellation request');
          }
        }}
        requestId={request.id}
      />
    </View>
  );
}
