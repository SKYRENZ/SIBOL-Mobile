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
import tw from '../utils/tailwind';
import { HardDrive, MessageSquare, Settings, LogOut, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { logout } from '../services/authService';
import SignOutModal from './SignOutModal'; // ✅ Import modal

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(320, Math.floor(SCREEN_WIDTH * 0.58));

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
							style={[
								{
									width: SIDEBAR_WIDTH,
									height: SCREEN_HEIGHT,
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
							<TouchableOpacity
								style={{ width: '100%', backgroundColor: '#A6BCAF', paddingHorizontal: 12, paddingTop: 20, paddingBottom: 14 }}
								onPress={() => {
									navigation.navigate('OProfile' as never);
									onClose();
								}}
							>
								<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
									<View>
										<Text style={{ fontSize: 14, fontWeight: '600', color: '#18472f' }}>User#39239!</Text>
										<Text style={{ fontSize: 11, color: '#18472f', marginTop: 4 }}>Operator</Text>
									</View>

									<View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
										<User color="#18472f" size={22} />
									</View>
								</View>
							</TouchableOpacity>

							<View style={tw`h-[1px] bg-[#264A3C] my-2`} />

							<View style={tw`mt-2 px-2`}>
								<TouchableOpacity
									style={tw`flex-row items-center py-3 px-3 rounded`}
									onPress={() => {
										navigation.navigate('oMaintenance' as never);
										onClose();
									}}
								>
									<HardDrive color="#E6F0E9" size={18} />
									<Text style={tw`text-[14px] text-[#E6F0E9] ml-3`}>SIBOL Machines</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={tw`flex-row items-center py-3 px-3 rounded`}
									onPress={() => {
										onNavigate?.('Chat Support');
										onClose();
									}}
								>
									<MessageSquare color="#E6F0E9" size={18} />
									<Text style={tw`text-[14px] text-[#E6F0E9] ml-3`}>Chat Support</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={tw`flex-row items-center py-3 px-3 rounded`}
									onPress={() => {
										onNavigate?.('Settings');
										onClose();
									}}
								>
									<Settings color="#E6F0E9" size={18} />
									<Text style={tw`text-[14px] text-[#E6F0E9] ml-3`}>Settings</Text>
								</TouchableOpacity>
							</View>

							<View style={{ flex: 1 }} />

							<View style={tw`px-4 pb-6`}>
								<TouchableOpacity
									onPress={() => setShowSignOutModal(true)} // ✅ Show modal instead of Alert
									style={tw`flex-row items-center justify-center bg-[#A6BCAF] rounded py-3`}
								>
									<LogOut color="#18472f" size={18} />
									<Text style={tw`ml-3 text-[14px] font-semibold text-[#18472f]`}>Sign Out</Text>
								</TouchableOpacity>
							</View>
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
