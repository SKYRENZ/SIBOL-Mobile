import { get, post } from './apiClient';

export type MobileNotification = {
  id: string;
  type: 'schedule' | 'reward_claimed' | 'reward_processing' | 'leaderboard' | 'points';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
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
  const evt = (row.eventType ?? row.event_type ?? '').toString().toUpperCase();
  let type: MobileNotification['type'] = 'schedule';

  if (evt.startsWith('REWARD_')) {
    // reward notifications (new/restocked/updated/claimed/unclaimed)
    if (evt.includes('CLAIMED')) type = 'reward_claimed';
    else type = 'reward_processing';
  } else if (evt.startsWith('POINTS_')) {
    type = 'points';
  } else if (evt.startsWith('LEADERBOARD_')) {
    type = 'leaderboard';
  }

  return {
    id: String(row.id),
    type,
    title: row.title ?? row.username ?? row.first_name ?? 'Notification',
    message: row.message ?? row.description ?? '',
    time: fmtTime(row.timestamp ?? row.created_at ?? row.createdAt),
    isRead: Boolean(row.read ?? row.read_flag),
  };
}

export async function fetchNotifications(opts: { limit?: number; offset?: number; unreadOnly?: boolean } = {}) {
  const params: any = {};
  // request only system notifications from backend to avoid maintenance/waste
  params.type = 'system';
  if (opts.limit) params.limit = opts.limit;
  if (opts.offset) params.offset = opts.offset;
  if (opts.unreadOnly) params.unreadOnly = 'true';

  const resp: any = await get('/api/notifications', { params });
  const rows = Array.isArray(resp?.data) ? resp.data : [];

  // keep only the notification event types we care about:
  // - REWARD_* (new/restocked/updated/claimed/unclaimed)
  // - POINTS_* (points-enough)
  // - LEADERBOARD_* (rank changes)
  const filtered = rows.filter((r: any) => {
    const e = (r.eventType ?? r.event_type ?? '').toString().toUpperCase();
    if (!e) return false;
    return e.startsWith('REWARD_') || e.startsWith('POINTS_') || e.startsWith('LEADERBOARD_');
  });

  return filtered.map(mapRowToMobile);
}

export async function fetchUnreadCount() {
  try {
    const rows = await fetchNotifications({ limit: 100, unreadOnly: true });
    return rows.length;
  } catch (e) {
    console.warn('[notificationService] fetchUnreadCount failed', e);
    return 0;
  }
}

export async function markAsRead(id: string, type: string) {
  return post('/api/notifications/read', { id: Number(id), type });
}

export async function markAllRead(type: string) {
  return post('/api/notifications/read-all', { type });
}