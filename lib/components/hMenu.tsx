import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Image,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../utils/tailwind';
import { Clock, MapPin, Settings, LogOut, Gift, MessageCircle, ChevronRight } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  HRewards: undefined;
  History: undefined;
  Map: undefined;
  ChatSupport: undefined;
  Settings: undefined;
  HDashboard: undefined;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(320, Math.floor(SCREEN_WIDTH * 0.8));

const menuItems = [
  { id: 1, title: 'Rewards', icon: Gift, route: 'HRewards' as const },
  { id: 2, title: 'History', icon: Clock, route: 'History' as const },
  { id: 3, title: 'Map', icon: MapPin, route: 'Map' as const },
  { id: 4, title: 'Chat Support', icon: MessageCircle, route: 'ChatSupport' as const },
  { id: 5, title: 'Settings', icon: Settings, route: 'Settings' as const },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onNavigate: (route: keyof RootStackParamList) => void;
};

export default function HMenu({ visible, onClose, onNavigate }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: -SIDEBAR_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }
  }, [visible, translateX]);

  const handleNavigation = (route: keyof RootStackParamList) => {
    onClose();
    navigation.navigate(route);
  };

  if (!mounted) return null;

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      
      <Animated.View 
        style={[
          styles.menuContainer,
          { transform: [{ translateX }] }
        ]}
      >
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: 'https://ui-avatars.com/api/?name=User&background=18472f&color=fff' }}
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.userName}>User#39239!</Text>
          <Text style={styles.userType}>Household</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuItems}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleNavigation(item.route)}
            >
              <View style={styles.menuItemContent}>
                <View style={styles.menuItemIcon}>
                  <item.icon size={20} color="#193827" />
                </View>
                <Text style={tw`ml-4 text-[#193827]`}>{item.title}</Text>
              </View>
              <ChevronRight size={16} color="#666" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={() => {
            // Handle sign out
            onClose();
          }}
        >
          <LogOut size={20} color="#E74C3C" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    width: SIDEBAR_WIDTH,
    backgroundColor: 'white',
    height: '100%',
    paddingTop: 20,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#193827',
    marginBottom: 4,
  },
  userType: {
    fontSize: 14,
    color: '#6B7280',
  },
  menuItems: {
    flex: 1,
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    width: 24,
    marginRight: 16,
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#193827',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  signOutText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#E74C3C',
    fontWeight: '500',
  },
});
