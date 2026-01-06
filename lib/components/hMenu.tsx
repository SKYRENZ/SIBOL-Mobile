import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    Dimensions,
    Keyboard,
    ActivityIndicator,
    Image,
    StyleSheet
} from 'react-native';
import tw from '../utils/tailwind';
import { Settings, LogOut, Gift, History, MapPin, MessageSquare } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { logout } from '../services/authService';
import SignOutModal from './SignOutModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(300, Math.floor(SCREEN_WIDTH * 0.8));

type Props = {
    visible: boolean;
    onClose: () => void;
    onNavigate?: (route: string) => void;
};

const menuItems = [
    { 
      id: 'rewards', 
      label: 'Rewards', 
      icon: Gift,
      route: 'HRewards'
    },
    { 
      id: 'history', 
      label: 'History', 
      icon: History,
      route: 'History' // Update this if you have a specific history route
    },
    { 
      id: 'map', 
      label: 'Map', 
      icon: MapPin,
      route: 'Map' // Update this if you have a specific map route
    },
    { 
      id: 'chat', 
      label: 'Chat Support', 
      icon: MessageSquare,
      route: 'ChatSupport' // Update this if you have a specific settings route
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      route: 'Settings' // Update this if you have a specific chat route
    },
];

export default function HMenu({ visible, onClose, onNavigate }: Props) {
    const navigation = useNavigation();
    const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
    const [mounted, setMounted] = useState(visible);
    const [loggingOut, setLoggingOut] = useState(false);
    const [showSignOutModal, setShowSignOutModal] = useState(false);

    useEffect(() => {
        if (visible) {
            Keyboard.dismiss();
            setMounted(true);
            Animated.timing(translateX, {
                toValue: 0,
                duration: 220,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(translateX, {
                toValue: -SIDEBAR_WIDTH,
                duration: 180,
                useNativeDriver: true,
            }).start(() => setMounted(false));
        }
    }, [visible, translateX]);

    const handleSignOut = async () => {
        try {
            setLoggingOut(true);
            await logout();
            setShowSignOutModal(false);
            onClose();
            navigation.reset({
                index: 0,
                routes: [{ name: 'SignIn' as never }],
            });
        } catch (err) {
            console.error('Sign out failed:', err);
            setShowSignOutModal(false);
        } finally {
            setLoggingOut(false);
        }
    };

    const handleNavigation = (id: string) => {
        onClose();
        const menuItem = menuItems.find(item => item.id === id);
        if (menuItem?.route) {
            navigation.navigate(menuItem.route as never);
        } else if (onNavigate) {
            onNavigate(id);
        }
    };

    if (!mounted) return null;

    return (
        <>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.menuContainer,
                                { transform: [{ translateX }], width: SIDEBAR_WIDTH, backgroundColor: '#18472F' },
                            ]}
                        >
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.username}>User#39239!</Text>
                                <View style={styles.avatarContainer}>
                                    <Image 
                                        source={{ uri: 'https://via.placeholder.com/40' }} 
                                        style={styles.avatar} 
                                    />
                                </View>
                            </View>

                            {/* Menu Items */}
                            <View style={styles.menuItems}>
                                {menuItems.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.menuItem}
                                        onPress={() => handleNavigation(item.id)}
                                    >
                                        <item.icon size={20} color="#FFFFFF" style={styles.menuIcon} />
                                        <Text style={styles.menuText}>{item.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Sign Out Button */}
                            <TouchableOpacity 
                                style={styles.signOutButton}
                                onPress={() => setShowSignOutModal(true)}
                                disabled={loggingOut}
                            >
                                {loggingOut ? (
                                    <ActivityIndicator color="#18472F" />
                                ) : (
                                    <>
                                        <LogOut size={20} color="#18472F" style={styles.signOutIcon} />
                                        <Text style={styles.signOutText}>Sign Out</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>

            <SignOutModal
                visible={showSignOutModal}
                loading={loggingOut}
                onConfirm={handleSignOut}
                onCancel={() => setShowSignOutModal(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    menuContainer: {
        height: '100%',
        position: 'absolute',
        left: 0,
        top: 0,
        elevation: 20,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    header: {
        width: '100%',
        backgroundColor: '#A6BCAF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    username: {
        fontSize: 16,
        fontWeight: '600',
        color: '#18472F',
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E0E0E0',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    menuItems: {
        paddingVertical: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    menuIcon: {
        marginRight: 16,
    },
    menuText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    signOutButton: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: '#A6BCAF',
        borderRadius: 8,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signOutIcon: {
        marginRight: 8,
    },
    signOutText: {
        color: '#18472F',
        fontSize: 16,
        fontWeight: '600',
    },
});
