import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import tw from '../utils/tailwind';
import NotificationCard, { NotificationData } from '../components/NotificationCard';
import BottomNavbar from '../components/hBotNav';
import HistoryFilter from '../components/HistoryFilter';
import { get } from '../services/apiClient';
import { post } from '../services/apiClient';

type TabType = 'Read' | 'Unread' | 'Rewards';
type FilterOption = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export default function HNotifications(props: any) {
  const [activeTab, setActiveTab] = useState<TabType>('Unread');
  const [filterValue, setFilterValue] = useState<FilterOption>('all');
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // helper to map backend rows to NotificationData
  const mapRowToNotification = (row: any): NotificationData => {
    const backendType = row.type as string;
    let type: NotificationData['type'] = 'schedule';
    if (backendType === 'system') {
      const et = String(row.eventType ?? '').toUpperCase();
      if (et === 'POINTS_AWARDED') type = 'points';
      else if (et === 'REWARD_REDEEMED') type = 'reward_redeemed';
      else if (et === 'REWARD_CLAIMED') type = 'reward_success';
      else type = 'schedule';
    } else if (backendType === 'waste-input' || backendType === 'collection' || backendType === 'maintenance') {
      type = 'schedule';
    }

    return {
      id: String(row.id),
      type,
      title: String(row.title ?? row.title === 0 ? row.title : '') ,
      message: String(row.message ?? ''),
      time: String(row.timestamp ?? ''),
      isRead: !!row.read,
      // keep backend fields for marking read
      // @ts-ignore attach for later use
      backendType: backendType,
    } as any;
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Household should only fetch system and waste-input notifications
      const [sysRes, wiRes] = await Promise.all([
        get<any>(`/api/notifications?type=system`),
        get<any>(`/api/notifications?type=waste-input`),
      ]);

      const sysRows = sysRes?.data ?? [];
      const wiRows = wiRes?.data ?? [];

      const merged = [...(sysRows || []), ...(wiRows || [])];
      // map and sort by timestamp desc
      const mapped = merged.map(mapRowToNotification).sort((a, b) => {
        const ta = new Date(a.time).getTime() || 0;
        const tb = new Date(b.time).getTime() || 0;
        return tb - ta;
      });

      setNotifications(mapped);
    } catch (err) {
      console.warn('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle notification click - move from Unread to Read
  const handleNotificationPress = (id: string) => {
    const found = notifications.find((n) => n.id === id) as any;
    // optimistic ui
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif)));
    // send mark read to server
    try {
      const backendType = (found && (found as any).backendType) || 'system';
      post('/api/notifications/read', { type: backendType, id: Number(id) }).catch((e) => {
        console.warn('mark read failed', e);
      });
    } catch (e) {
      console.warn('mark read error', e);
    }
  };

  // Filter notifications based on active tab and date filter
  const getFilteredNotifications = () => {
    let filtered: NotificationData[];
    
    switch (activeTab) {
      case 'Read':
        filtered = notifications.filter((n) => n.isRead && (n.type === 'schedule'));
        break;
      case 'Unread':
        filtered = notifications.filter((n) => !n.isRead);
        break;
      case 'Rewards':
        filtered = notifications.filter((n) => n.type === 'reward_claimed' || n.type === 'reward_processing');
        break;
      default:
        filtered = [];
    }

    // Apply date filter if not 'all'
    // Note: In a real app, you would filter by actual dates
    // For now, this is a placeholder structure
    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`flex-1`}>
        {/* Header */}
        <View style={tw`items-center pt-8 pb-4`}>
          <Text style={tw`text-[20px] font-bold text-[#6C8770] text-center`}>
            Notifications
          </Text>
        </View>

        {/* Tabs */}
        <View style={tw`px-9 mb-4`}>
          <View style={tw`flex-row border border-[#CAD3CA] rounded-[15px] h-9 relative`}>
            {/* Read Tab */}
            <TouchableOpacity
              onPress={() => setActiveTab('Read')}
              style={tw.style(
                `flex-1 justify-center items-center rounded-[15px]`,
                activeTab === 'Read' && 'bg-[#88AB8E] border border-[#88AB8E]'
              )}
            >
              <Text
                style={tw.style(
                  `text-[15px] font-semibold`,
                  activeTab === 'Read' ? 'text-white' : 'text-[#6C8770]'
                )}
              >
                Read
              </Text>
            </TouchableOpacity>

            {/* Unread Tab */}
            <TouchableOpacity
              onPress={() => setActiveTab('Unread')}
              style={tw.style(
                `flex-1 justify-center items-center rounded-[15px] flex-row`,
                activeTab === 'Unread' && 'bg-[#88AB8E] border border-[#88AB8E]'
              )}
            >
              <Text
                style={tw.style(
                  `text-[15px] font-semibold`,
                  activeTab === 'Unread' ? 'text-white' : 'text-[#6C8770]'
                )}
              >
                Unread
              </Text>
              {/* Unread count badge */}
              {unreadCount > 0 && (
                <View style={tw`ml-1 bg-[#2E523A] rounded-full min-w-[18px] h-[18px] justify-center items-center px-1`}>
                  <Text style={tw`text-white text-[10px] font-bold`}>
                    {unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Rewards Tab */}
            <TouchableOpacity
              onPress={() => setActiveTab('Rewards')}
              style={tw.style(
                `flex-1 justify-center items-center rounded-[15px]`,
                activeTab === 'Rewards' && 'bg-[#88AB8E] border border-[#88AB8E]'
              )}
            >
              <Text
                style={tw.style(
                  `text-[15px] font-semibold`,
                  activeTab === 'Rewards' ? 'text-white' : 'text-[#6C8770]'
                )}
              >
                Rewards
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter by button */}
        <View style={tw`px-4 mb-4`}>
          <HistoryFilter value={filterValue} onChange={setFilterValue} />
        </View>

        {/* Divider */}
        <View style={tw`h-[1px] bg-[#CAD3CA]`} />

        {/* Notifications List */}
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`pb-24`}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={tw`items-center justify-center py-20`}>
              <ActivityIndicator size="small" color="#88AB8E" />
            </View>
          ) : filteredNotifications.length === 0 ? (
            <View style={tw`items-center justify-center py-20`}>
              <Text style={tw`text-[#88AB8E] text-[14px]`}>
                No notifications
              </Text>
            </View>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onPress={() => handleNotificationPress(notification.id)}
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* Bottom Navigation */}
      <View style={tw`absolute bottom-0 left-0 right-0 bg-white`}>
        <BottomNavbar currentPage="Back" />
      </View>
    </SafeAreaView>
  );
}
