import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import tw from '../utils/tailwind';
import NotificationCard, { NotificationData } from '../components/NotificationCard';
import BottomNavbar from '../components/hBotNav';
import HistoryFilter from '../components/HistoryFilter';

type TabType = 'Read' | 'Unread' | 'Rewards';
type FilterOption = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export default function HNotifications(props: any) {
  const [activeTab, setActiveTab] = useState<TabType>('Unread');
  const [filterValue, setFilterValue] = useState<FilterOption>('all');
  
  // Sample notification data - in a real app, this would come from an API or state management
  const [notifications, setNotifications] = useState<NotificationData[]>([
    {
      id: '1',
      type: 'schedule',
      title: 'You missed your schedule',
      message: 'You can reschedule or alert your waste collector to collect your waste',
      time: '9:00 A.M',
      isRead: false,
    },
    {
      id: '2',
      type: 'schedule',
      title: 'You missed your schedule',
      message: 'You can reschedule or alert your waste collector to collect your waste',
      time: '9:00 A.M',
      isRead: false,
    },
    {
      id: '3',
      type: 'schedule',
      title: 'You missed your schedule',
      message: 'You can reschedule or alert your waste collector to collect your waste',
      time: '9:00 A.M',
      isRead: false,
    },
    {
      id: '4',
      type: 'reward_claimed',
      title: 'Reward Claimed!',
      message: 'Congratulations! You can now collect your reward.',
      time: '9:00 A.M',
      isRead: true,
    },
    {
      id: '5',
      type: 'reward_claimed',
      title: 'Reward Claimed!',
      message: 'Congratulations! You can now collect your reward.',
      time: '9:00 A.M',
      isRead: true,
    },
    {
      id: '6',
      type: 'reward_processing',
      title: 'Reward in process',
      message: 'Please standby, your reward is being processed.',
      time: '9:00 A.M',
      isRead: true,
    },
  ]);

  // Handle notification click - move from Unread to Read
  const handleNotificationPress = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
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
        <BottomNavbar currentPage="Back" />
      </View>
    </SafeAreaView>
  );
}
