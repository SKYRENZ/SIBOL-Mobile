import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    Dimensions,
    Keyboard,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from '../utils/tailwind';
import { HardDrive, MessageSquare, LogOut, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { logout } from '../services/authService';
import SignOutModal from './SignOutModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(300, Math.floor(SCREEN_WIDTH * 0.8));

type Props = {
    visible: boolean;
    onClose: () => void;
    onNavigate?: (route: string) => void;
    user?: any;
};

export default function OMenu({ visible, onClose, onNavigate, user }: Props) {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
    const [mounted, setMounted] = useState(visible);
    const [loggingOut, setLoggingOut] = useState(false);
    const [showSignOutModal, setShowSignOutModal] = useState(false);

    const [displayName, setDisplayName] = useState<string>('User');
    const [roleLabel, setRoleLabel] = useState<string>('Operator');
    const [profileImage, setProfileImage] = useState<string | null>(null);

    // prefer user prop for instant updates, fallback to AsyncStorage
    useEffect(() => {
        if (!visible) return;
        if (user) {
            try {
                const u = user;
                const first = u?.FirstName ?? u?.firstName ?? '';
                const last = u?.LastName ?? u?.lastName ?? '';
                const username = u?.Username ?? u?.username ?? '';
                const email = u?.Email ?? u?.email ?? '';
                const name = (first || last) ? `${first} ${last}`.trim() : (username || email || 'User');
                setDisplayName(name);
                const img =
                    u?.Profile_image_path ??
                    u?.ProfileImage ??
                    u?.Image_path ??
                    u?.imagePath ??
                    u?.image_path ??
                    u?.profile_image_path ??
                    null;
                setProfileImage(img || null);
                const r = Number(u?.Roles ?? u?.role ?? NaN);
                if (r === 1) setRoleLabel('Admin');
                else if (r === 3) setRoleLabel('Operator');
                else if (r === 4) setRoleLabel('Household');
                else if (String(u?.role)?.toLowerCase?.() === 'operator') setRoleLabel('Operator');
                else setRoleLabel('User');
                return;
            } catch (e) {
                console.warn('[OMenu] using injected user failed', e);
            }
        }

        (async () => {
            try {
                const raw = await AsyncStorage.getItem('user');
                if (!raw) return;
                const u = JSON.parse(raw);
                const first = u?.FirstName ?? u?.firstName ?? '';
                const last = u?.LastName ?? u?.lastName ?? '';
                const username = u?.Username ?? u?.username ?? '';
                const email = u?.Email ?? u?.email ?? '';
                const name = (first || last) ? `${first} ${last}`.trim() : (username || email || 'User');
                setDisplayName(name);
                const img =
                    u?.Profile_image_path ??
                    u?.ProfileImage ??
                    u?.Image_path ??
                    u?.imagePath ??
                    u?.image_path ??
                    u?.profile_image_path ??
                    null;
                setProfileImage(img || null);
                const r = Number(u?.Roles ?? u?.role ?? NaN);
                if (r === 1) setRoleLabel('Admin');
                else if (r === 3) setRoleLabel('Operator');
                else if (r === 4) setRoleLabel('Household');
                else if (String(u?.role)?.toLowerCase?.() === 'operator') setRoleLabel('Operator');
                else setRoleLabel('User');
            } catch (e) {
                console.warn('[OMenu] refresh failed', e);
            }
        })();
    }, [visible, user]);

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
        } catch (err: any) {
            console.error('Sign out failed:', err);
            setShowSignOutModal(false);
        } finally {
            setLoggingOut(false);
        }
    };

    if (!mounted) return null;

    return (
        <>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, tw`bg-[rgba(0,0,0,0.3)]`]}>
                    <TouchableWithoutFeedback onPress={() => {}}>
                        <Animated.View
                            style={[
                                {
                                    width: SIDEBAR_WIDTH,
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,

                                    // ✅ stop ABOVE gesture navigation bar
                                    bottom: insets.bottom,

                                    transform: [{ translateX }],
                                    elevation: 20,
                                    shadowColor: '#000',
                                    shadowOpacity: 0.2,
                                    shadowRadius: 8,
                                },
                                tw`bg-[#193827]`,
                            ]}
                        >
                            {/* ✅ Header fills status bar/notch area */}
                            <TouchableOpacity
                                style={[tw`w-full bg-[#A6BCAF] px-5 py-4`, { paddingTop: insets.top + 12 }]}
                                onPress={() => { navigation.navigate('OProfile' as never); onClose(); }}
                            >
                                <View style={tw`flex-row justify-between items-center`}>
                                    <View>
                                        <Text style={tw`text-[16px] font-semibold text-[#18472F]`}>{displayName}</Text>
                                        <Text style={tw`text-[11px] text-[#18472F] mt-1`}>{roleLabel}</Text>
                                    </View>
                                    <View style={tw`w-10 h-10 rounded-full bg-[#E0E0E0] overflow-hidden`}>
                                        <Image
                                            source={profileImage ? { uri: profileImage } : require('../../assets/profile.png')}
                                            style={tw`w-full h-full`}
                                        />
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <View style={tw`py-2`}>
                                <TouchableOpacity
                                    style={tw`flex-row items-center py-4 px-5`}
                                    onPress={() => { navigation.navigate('OProfile' as never); onClose(); }}
                                >
                                    <User color="#E6F0E9" size={20} />
                                    <Text style={tw`text-[16px] text-[#E6F0E9] font-medium ml-4`}>My Profile</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={tw`flex-row items-center py-4 px-5`}
                                    onPress={() => { navigation.navigate('OMaintenance' as never); onClose(); }}
                                >
                                    <HardDrive color="#E6F0E9" size={20} />
                                    <Text style={tw`text-[16px] text-[#E6F0E9] font-medium ml-4`}>SIBOL Machines</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={tw`flex-row items-center py-4 px-5`}
                                    onPress={() => { navigation.navigate('ChatSupport' as never); onClose(); }}
                                >
                                    <MessageSquare color="#E6F0E9" size={20} />
                                    <Text style={tw`text-[16px] text-[#E6F0E9] font-medium ml-4`}>Chat Support</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[
                                    tw`absolute left-5 right-5 bg-[#A6BCAF] rounded-md py-3 flex-row items-center justify-center`,
                                    { bottom: 24 }, // ✅ no insets.bottom needed now
                                ]}
                                onPress={() => setShowSignOutModal(true)}
                            >
                                <LogOut color="#18472F" size={20} />
                                <Text style={tw`text-[#18472F] text-[16px] font-semibold ml-3`}>Sign Out</Text>
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
