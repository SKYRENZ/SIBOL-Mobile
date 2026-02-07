import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import tw from '../../utils/tailwind';
import { Image as LucideImage, Send as LucideSend } from 'lucide-react-native';

import {
  MaintenanceRemark,
  MaintenanceEvent,
  getTicketRemarks,
  getTicketEvents,
  addRemark,
} from '../../services/maintenanceService';

type TicketStatus =
  | 'Requested' // ✅ add
  | 'Pending'
  | 'Done'
  | 'For review'
  | 'Canceled'
  | 'Cancel Requested';

type TimelineItem =
  | {
      kind: 'event';
      key: string;
      createdAt: string;
      eventType: string;
      title: string;
      actorDisplay: string;
      toDisplay?: string | null;
      reason?: string | null;
      notes?: string | null;
    }
  | {
      kind: 'remark';
      key: string;
      createdAt: string;
      remark: MaintenanceRemark;
    };

type Props = {
  expanded: boolean;
  requestId: number;
  status: TicketStatus;

  cutoffAt?: string | null;

  currentUserId: number | null;
  currentUserRole: string;

  // parent owns remarks (so CommentsSection can reuse them)
  remarks: MaintenanceRemark[];
  onRemarksChange: (next: MaintenanceRemark[]) => void;

  canComment: boolean;

  onOpenModal: () => void;

  // for the small image button (open modal + auto-pick)
  onAttachPress: () => void;
};

export default function TicketTimelineCard({
  expanded,
  requestId,
  status,
  cutoffAt = null,
  currentUserId,
  currentUserRole,
  remarks,
  onRemarksChange,
  canComment,
  onOpenModal,
  onAttachPress,
}: Props) {
  const [inlineNewMsg, setInlineNewMsg] = useState('');
  const [events, setEvents] = useState<MaintenanceEvent[]>([]);
  const [loadingRemarks, setLoadingRemarks] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [expandedRemarkIds, setExpandedRemarkIds] = useState<Set<number>>(new Set());
  const inlineScrollRef = useRef<ScrollView>(null);

  const shadowStyle = {
    shadowColor: '#88AB8E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  };

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

  const normalizeRoleName = (role?: string | null) => {
    if (!role) return '';
    return role.replace(/_staff/gi, '').trim();
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
        return t.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  };

  const formatActor = (name?: string | null, roleName?: string | null) => {
    const n = (name || 'Unknown').trim();
    const r = normalizeRoleName(roleName || '');
    return r ? `${n} (${r})` : n;
  };

  const getEventTheme = (eventType: string) => {
    switch (eventType) {
      case 'REQUESTED': return { border: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)', text: '#1D4ED8' };
      case 'ACCEPTED': return { border: '#0D9488', bg: 'rgba(13, 148, 136, 0.08)', text: '#0F766E' };
      case 'REASSIGNED': return { border: '#059669', bg: 'rgba(5, 150, 105, 0.08)', text: '#047857' };
      case 'FOR_VERIFICATION': return { border: '#7C3AED', bg: 'rgba(124, 58, 237, 0.08)', text: '#6D28D9' };
      case 'CANCEL_REQUESTED': return { border: '#EA580C', bg: 'rgba(234, 88, 12, 0.08)', text: '#C2410C' };
      case 'CANCELLED': return { border: '#DC2626', bg: 'rgba(220, 38, 38, 0.08)', text: '#B91C1C' };
      case 'COMPLETED': return { border: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)', text: '#15803D' };
      case 'DELETED': return { border: '#6B7280', bg: 'rgba(107, 114, 128, 0.08)', text: '#374151' };
      default: return { border: '#2E523A', bg: 'rgba(53, 88, 66, 0.06)', text: '#1F4D36' };
    }
  };

  const roleTag = (roleId?: number | null, roleName?: string | null, legacy?: string | null) => {
    if (roleId === 1 || roleId === 2) return 'Barangay';
    if (roleId === 3) return 'Operator';

    const s = String(roleName ?? legacy ?? '').toLowerCase();
    if (s.includes('admin') || s.includes('barangay') || s.includes('staff')) return 'Barangay';
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

  const isMineRemark = (remark: MaintenanceRemark) => !!currentUserId && remark.Created_by === currentUserId;

  const toggleRemarkExpanded = (remarkId: number) => {
    setExpandedRemarkIds(prev => {
      const next = new Set(prev);
      if (next.has(remarkId)) next.delete(remarkId);
      else next.add(remarkId);
      return next;
    });
  };

  const before = status === 'Canceled' ? (cutoffAt ?? undefined) : undefined;

  const loadRemarks = async () => {
    setLoadingRemarks(true);
    try {
      const data = await getTicketRemarks(requestId, before);
      onRemarksChange(data || []);
    } catch (e) {
      console.error('loadRemarks error:', e);
    } finally {
      setLoadingRemarks(false);
    }
  };

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const data = await getTicketEvents(requestId, before);
      setEvents(data || []);
    } catch (e) {
      console.error('loadEvents error:', e);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (!expanded || !requestId) return;
    // load once per expand (parent controls expand state)
    if (remarks.length === 0) loadRemarks();
    if (events.length === 0) loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  useEffect(() => {
    // scroll when items change
    if (!expanded) return;
    const t = setTimeout(() => inlineScrollRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [expanded, remarks.length, events.length]);

  const timeline: TimelineItem[] = useMemo(() => {
    const eventItems: TimelineItem[] = (events || []).map(ev => {
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
        eventType: ev.Event_type,
        title,
        actorDisplay,
        toDisplay,
        reason: reason || null,

        // ✅ IMPORTANT: do NOT show notes for REASSIGNED (or any non-cancel-requested event)
        notes: null,
      };
    });

    const remarkItems: TimelineItem[] = (remarks || []).map(r => ({
      kind: 'remark',
      key: `r-${r.Remark_Id}`,
      createdAt: r.Created_at,
      remark: r,
    }));

    return [...eventItems, ...remarkItems].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [events, remarks]);

  const handleInlineSend = async () => {
    if (!canComment) return;
    if (!currentUserId) return;

    const text = inlineNewMsg.trim();
    if (!text) return;

    try {
      const newRemark = await addRemark(requestId, text, currentUserId, currentUserRole);
      onRemarksChange([...(remarks || []), newRemark]);
      setInlineNewMsg('');
    } catch (e: any) {
      console.error('inline send error:', e);
      Alert.alert('Error', e?.message || 'Failed to add remark');
    }
  };

  return (
    <View style={tw`mb-4`}>
      <View style={tw`flex-row items-center justify-between mb-2`}>
        <Text style={tw`text-gray-700 font-semibold text-sm`}>Remarks</Text>
      </View>

      <View style={tw`bg-white border border-gray-300 rounded p-3 relative`}>
        <View style={tw`absolute right-3 top-3 z-10`}>
          <TouchableOpacity onPress={onOpenModal}>
            <Text style={tw`text-gray-600 text-lg`}>⛶</Text>
          </TouchableOpacity>
        </View>

        <View style={tw`min-h-24 max-h-40`}>
          {(loadingRemarks || loadingEvents) && timeline.length === 0 ? (
            <View style={tw`items-center justify-center py-4`}>
              <Text style={tw`text-gray-500 text-xs`}>Loading...</Text>
            </View>
          ) : (
            <ScrollView ref={inlineScrollRef}>
              {timeline.length === 0 ? (
                <Text style={tw`text-gray-400 text-xs italic`}>No history yet</Text>
              ) : (
                timeline.map((item) => {
                  if (item.kind === 'event') {
                    const theme = getEventTheme(item.eventType);
                    return (
                      <View
                        key={item.key}
                        style={{
                          marginBottom: 10,
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                          backgroundColor: theme.bg,
                          borderLeftWidth: 4,
                          borderLeftColor: theme.border,
                          borderRadius: 8,
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text, flex: 1 }}>
                            {item.toDisplay
                              ? `${item.title} by ${item.actorDisplay} to ${item.toDisplay}`
                              : `${item.title} by ${item.actorDisplay}`}
                          </Text>

                          <Text style={{ fontSize: 11, color: 'rgba(31,77,54,0.7)' }}>
                            {formatTimeOnly(item.createdAt)}
                          </Text>
                        </View>

                        {!!item.reason && (
                          <Text style={{ marginTop: 4, fontSize: 12, color: theme.text }}>
                            Reason: {item.reason}
                          </Text>
                        )}
                      </View>
                    );
                  }

                  const remark = item.remark;
                  const isMine = isMineRemark(remark);
                  const isExpanded = expandedRemarkIds.has(remark.Remark_Id);

                  return (
                    <View
                      key={item.key}
                      style={{
                        marginBottom: 12,
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
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
                            backgroundColor: isMine ? '#FFFFFF' : '#88AB8E',
                          },
                          shadowStyle,
                        ]}
                      >
                        <Text style={{ color: isMine ? '#1F4D36' : '#FFFFFF', fontSize: 14 }}>
                          {remark.Remark_text}
                        </Text>

                        {isExpanded && (
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

        {canComment && (
          <View style={tw`mt-3`}>
            <View style={tw`flex-row items-center bg-white border border-gray-200 rounded-full px-3`}>
              <TouchableOpacity onPress={onAttachPress} style={{ marginRight: 8 }}>
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
  );
}