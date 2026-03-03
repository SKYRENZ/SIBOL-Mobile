import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import tw from '../utils/tailwind';
import NotificationCard, { NotificationData } from '../components/NotificationCard';
import BottomNavbar from '../components/hBotNav';
import HistoryFilter from '../components/HistoryFilter';
import * as notificationService from '../services/notificationService';
import type { MobileNotification } from '../services/notificationService';
import { useFocusEffect } from '@react-navigation/native';

type TabType = 'Read' | 'Unread';
type FilterOption = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export default function HNotifications(props: any) {
  const [activeTab, setActiveTab] = useState<TabType>('Unread');
  const [tabHistory, setTabHistory] = useState<TabType[]>([]);
  const [filterValue, setFilterValue] = useState<FilterOption>('all');
  
  // Replace sample state with fetched notifications
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  // load notifications on focus
  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const rows = await notificationService.fetchNotifications({ limit: 200 });
          if (!mounted) return;
          setNotifications(
            rows.map((r: MobileNotification) => ({
              id: r.id,
              type: r.type,
              title: r.title,
              message: r.message,
              time: r.time,
              isRead: r.isRead,
            }))
          );
        } catch (err) {
          console.error('load notifications failed', err);
        }
      })();
      return () => { mounted = false; };
    }, [])
  );

  // update unread count and mark read locally when pressed
  const handleNotificationPress = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      const item = notifications.find((n) => n.id === id);
      // only call backend if it wasn't already read
      if (item && !item.isRead) {
        await notificationService.markAsRead(id, 'system');
      }
    } catch (e) { /* ignore */ }
  };

  // Filter notifications based on active tab and date filter
  const getFilteredNotifications = () => {
    let filtered: NotificationData[] = [];

    switch (activeTab) {
      case 'Read':
        // show all notifications that are marked read (any type)
        filtered = notifications.filter((n) => n.isRead);
        break;
      case 'Unread':
        // show all notifications that are unread (any type)
        filtered = notifications.filter((n) => !n.isRead);
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

            {/* (Rewards tab removed) */}
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
                notification={notification}
                onPress={() => handleNotificationPress(notification.id)}
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
