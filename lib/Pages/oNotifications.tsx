import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import tw from '../utils/tailwind';
import NotificationCard from '../components/NotificationCard';
import BottomNavbar from '../components/oBotNav';
import HistoryFilter from '../components/HistoryFilter';
import * as notificationService from '../services/notificationService';
import type { MobileNotification } from '../services/notificationService';

type TabType = 'Read' | 'Unread';
type FilterOption = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';
type FilterTab = 'Pending' | 'For review' | 'Done' | 'Canceled';

type RootStackParamList = {
  ORequest: { initialTab?: FilterTab; openRequestId?: string; navAt?: number };
};

export default function ONotifications(props: any) {
  const navigation = useNavigation<any>(); // useNavigation<NativeStackNavigationProp<RootStackParamList>>() if you want strict typing
  const [activeTab, setActiveTab] = useState<TabType>('Unread');
  const [tabHistory, setTabHistory] = useState<TabType[]>([]);
  const [filterValue, setFilterValue] = useState<FilterOption>('all');
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const rows = await notificationService.fetchNotifications({ type: 'maintenance', limit: 200 });
          if (mounted) setNotifications(rows);
        } catch (err) {
          console.error('load operator notifications failed', err);
        }
      })();
      return () => { mounted = false; };
    }, [])
  );

  const extractRequestId = (n: MobileNotification): string | undefined => {
    const source = `${n.title ?? ''} ${n.message ?? ''}`;
    const m = source.match(/request\s*#\s*(\d+)/i);
    return m?.[1];
  };

  const eventToTab = (eventType?: string): FilterTab => {
    const e = String(eventType ?? '').toUpperCase();
    if (e === 'COMPLETED') return 'Done';
    if (e === 'CANCELLED' || e === 'CANCEL_REQUESTED') return 'Canceled';
    if (e === 'FOR_VERIFICATION') return 'For review';
    return 'Pending'; // ACCEPTED, REASSIGNED, ONGOING, fallback
  };

  const handleNotificationPress = async (notification: MobileNotification) => {
    // mark local state read
    setNotifications(prev =>
      prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
    );

    // mark backend read
    try {
      if (!notification.isRead) {
        await notificationService.markAsRead(notification.id, 'maintenance');
      }
    } catch {}

    // navigate operator to the relevant request view
    const openRequestId = extractRequestId(notification);
    navigation.navigate('ORequest', {
      initialTab: eventToTab(notification.eventType),
      openRequestId,
      navAt: Date.now(),
    });
  };

  const getFilteredNotifications = () => {
    let filtered: MobileNotification[];
    
    switch (activeTab) {
      case 'Read':
        filtered = notifications.filter((n) => n.isRead);
        break;
      case 'Unread':
        filtered = notifications.filter((n) => !n.isRead);
        break;
      default:
        filtered = [];
    }

    // Apply date filter if not 'all'
    // Note: In a real app, you would filter by actual dates
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
              onPress={() => changeTab('Read')}
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
              onPress={() => changeTab('Unread')}
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
          {filteredNotifications.length === 0 ? (
            <View style={tw`items-center justify-center py-20`}>
              <Text style={tw`text-[#88AB8E] text-[14px]`}>
                No notifications
              </Text>
            </View>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification as any}
                disableAutoNavigate
                onPress={() => handleNotificationPress(notification)}
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* Bottom Navigation */}
      <View style={tw`absolute bottom-0 left-0 right-0 bg-white`}>
        <BottomNavbar currentPage="Back" onBack={handleBack} />
      </View>
    </SafeAreaView>
  );

  function changeTab(next: TabType) {
    if (next === activeTab) return;
    setTabHistory((h) => [...h, activeTab]);
    setActiveTab(next);
  }

  function handleBack() {
    const h = tabHistory.slice();
    const prev = h.pop();
    if (prev) {
      setTabHistory(h);
      setActiveTab(prev);
      return true;
    }
    return false;
  }
}
