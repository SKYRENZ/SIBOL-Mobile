import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    Dimensions,
    Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // { added }
import tw from '../utils/tailwind';
import { HardDrive, MessageSquare, Settings, LogOut, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { logout } from '../services/authService';
import SignOutModal from './SignOutModal'; // ✅ Import modal

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(300, Math.floor(SCREEN_WIDTH * 0.8));

type Props = {
	visible: boolean;
	onClose: () => void;
	onNavigate?: (route: string) => void;
};

export default function OMenu({ visible, onClose, onNavigate }: Props) {
    const navigation = useNavigation();
    const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
    const [mounted, setMounted] = useState(visible);
    const [loggingOut, setLoggingOut] = useState(false);
    const [showSignOutModal, setShowSignOutModal] = useState(false); // ✅ Add modal state

	const [displayName, setDisplayName] = useState<string>('User');
	const [roleLabel, setRoleLabel] = useState<string>('Operator');

	useEffect(() => {
		if (!visible) return;
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
	}, [visible]);

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

	// ✅ Handle sign out confirmation
	const handleSignOut = async () => {
		try {
			setLoggingOut(true);
			await logout();
			setShowSignOutModal(false);
			onClose();
			// Navigate to SignIn screen
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
							// use full-height percent so it responds to different screen containers (safe area, tablets)
							style={[
								{
									width: SIDEBAR_WIDTH,
									height: '100%',
									transform: [{ translateX }],
									position: 'absolute',
									left: 0,
									top: 0,
									elevation: 20,
									shadowColor: '#000',
									shadowOpacity: 0.2,
									shadowRadius: 8,
								},
								tw`bg-[#193827]`,
							]}
						>
							<TouchableOpacity style={tw`w-full bg-[#A6BCAF] px-5 py-4`} onPress={() => { navigation.navigate('OProfile' as never); onClose(); }}>
								<View style={tw`flex-row justify-between items-center`}>
									<View>
										<Text style={tw`text-[16px] font-semibold text-[#18472F]`}>{displayName}</Text>
										<Text style={tw`text-[11px] text-[#18472F] mt-1`}>{roleLabel}</Text>
									</View>
									<View style={tw`w-10 h-10 rounded-full bg-[#E0E0E0] items-center justify-center`}>
										<User color="#18472F" size={20} />
									</View>
								</View>
							</TouchableOpacity>

							<View style={tw`h-[1px] bg-[#264A3C] my-2`} />

							<View style={tw`py-2`}>
								{/* tailwind items to match hMenu sizing */}
								<TouchableOpacity style={tw`flex-row items-center py-4 px-5`} onPress={() => { navigation.navigate('OMaintenance' as never); onClose(); }}>
									<HardDrive color="#E6F0E9" size={20} />
									<Text style={tw`text-[16px] text-[#E6F0E9] font-medium ml-4`}>SIBOL Machines</Text>
								</TouchableOpacity>

								<TouchableOpacity style={tw`flex-row items-center py-4 px-5`} onPress={() => { navigation.navigate('ChatSupport' as never); onClose(); }}>
									<MessageSquare color="#E6F0E9" size={20} />
									<Text style={tw`text-[16px] text-[#E6F0E9] font-medium ml-4`}>Chat Support</Text>
								</TouchableOpacity>

								<TouchableOpacity style={tw`flex-row items-center py-4 px-5`} onPress={() => { onNavigate?.('Settings'); onClose(); }}>
									<Settings color="#E6F0E9" size={20} />
									<Text style={tw`text-[16px] text-[#E6F0E9] font-medium ml-4`}>Settings</Text>
								</TouchableOpacity>
							</View>

							{/* Anchor sign-out to bottom like hMenu for consistent layout */}
							<TouchableOpacity style={tw`absolute bottom-8 left-5 right-5 bg-[#A6BCAF] rounded-md py-3 flex-row items-center justify-center`} onPress={() => setShowSignOutModal(true)}>
								<LogOut color="#18472F" size={20} />
								<Text style={tw`text-[#18472F] text-[16px] font-semibold ml-3`}>Sign Out</Text>
							</TouchableOpacity>
						</Animated.View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>

			{/* ✅ Sign Out Confirmation Modal */}
			<SignOutModal
				visible={showSignOutModal}
				loading={loggingOut}
				onConfirm={handleSignOut}
				onCancel={() => setShowSignOutModal(false)}
			/>
		</>
	);
}
