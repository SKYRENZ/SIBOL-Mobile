import { get, post } from './apiClient';

export type NotificationFeedType = 'maintenance' | 'waste-input' | 'collection' | 'system';

export type MobileNotification = {
  id: string;
  type:
    | 'maintenance'
    | 'waste-input'
    | 'collection'
    | 'system'
    | 'schedule'
    | 'reward_claimed'
    | 'reward_processing'
    | 'leaderboard'
    | 'points';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  timestampISO?: string;
  eventType?: string;
};

function fmtTime(ts?: string) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return String(ts);
    // date like "July 24, 2026" and time without seconds
    const datePart = d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    const timePart = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${datePart} • ${timePart}`;
  } catch {
    return String(ts);
  }
}

function mapRowToMobile(row: any): MobileNotification {
  const notifType = String(row.type ?? row.notif_type ?? '').toLowerCase();
  const evt = String(row.eventType ?? row.event_type ?? '').toUpperCase();

  let type: MobileNotification['type'] = 'system';

  if (notifType === 'maintenance' || notifType === 'waste-input' || notifType === 'collection' || notifType === 'system') {
    type = notifType as MobileNotification['type'];
  } else if (evt.startsWith('REWARD_')) {
    type = evt.includes('CLAIMED') ? 'reward_claimed' : 'reward_processing';
  } else if (evt.startsWith('POINTS_')) {
    type = 'points';
  } else if (evt.startsWith('LEADERBOARD_')) {
    type = 'leaderboard';
  }

  const rawTs = row.timestamp ?? row.created_at ?? row.createdAt;

  return {
    id: String(row.id),
    type,
    title: row.title ?? 'Notification',
    message: row.message ?? '',
    time: fmtTime(rawTs),
    isRead: Boolean(row.read ?? row.read_flag),
    timestampISO: rawTs ? String(rawTs) : undefined,
    eventType: evt || undefined,
  };
}

export async function fetchNotifications(
  opts: {
    type?: NotificationFeedType;
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    includeAllSystemEvents?: boolean; // NEW: default false keeps old household behavior
  } = {}
) {
  const params: any = {};
  params.type = opts.type ?? 'system';
  if (opts.limit) params.limit = opts.limit;
  if (opts.offset) params.offset = opts.offset;
  if (opts.unreadOnly) params.unreadOnly = 'true';

  const resp: any = await get('/api/notifications', { params });
  const rows = Array.isArray(resp?.data) ? resp.data : [];

  // Keep previous household behavior:
  // when requesting system notifications, show only reward/points/leaderboard unless explicitly overridden.
  const shouldFilterSystem =
    params.type === 'system' && !opts.includeAllSystemEvents;

  const filtered = shouldFilterSystem
    ? rows.filter((r: any) => {
        const e = String(r.eventType ?? r.event_type ?? '').toUpperCase();
        return e.startsWith('REWARD_') || e.startsWith('POINTS_') || e.startsWith('LEADERBOARD_');
      })
    : rows;

  return filtered.map(mapRowToMobile);
}

export async function fetchUnreadCountByType(type: NotificationFeedType) {
  try {
    const rows = await fetchNotifications({ type, limit: 200, unreadOnly: true });
    return rows.length;
  } catch {
    return 0;
  }
}

export async function markAsRead(id: string, type: NotificationFeedType) {
  return post('/api/notifications/read', { id: Number(id), type });
}

export async function markAllRead(type: NotificationFeedType) {
  return post('/api/notifications/read-all', { type });
}