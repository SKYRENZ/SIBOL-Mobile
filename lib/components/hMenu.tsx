import React, { useEffect, useRef, useState } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	TouchableWithoutFeedback,
	Animated,
	Dimensions,
	Platform,
	Image
} from 'react-native';
import tw from '../utils/tailwind';
import { Clock, MapPin, Settings, LogOut, User, Gift } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(320, Math.floor(SCREEN_WIDTH * 0.58));
const SIDEBAR_HEIGHT = SCREEN_HEIGHT;

type Props = {
	visible: boolean;
	onClose: () => void;
	onNavigate?: (route: string) => void;
};

export default function HMenu({ visible, onClose, onNavigate }: Props) {
	const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
	const [mounted, setMounted] = useState(visible);

	useEffect(() => {
		if (visible) {
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

	if (!mounted) return null;

	return (
		<TouchableWithoutFeedback onPress={onClose}>
			<View
				style={[
					// overlay
					{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
					tw`bg-[rgba(0,0,0,0.3)]`,
				]}
			>
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
							Platform.OS === 'android' ? { paddingTop: 0 } : { paddingTop: 0 },
						]}
					>
						
						<View style={{ width: '100%', backgroundColor: '#A6BCAF', paddingHorizontal: 12, paddingTop: 20, paddingBottom: 14 }}>
							<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
								<View>
									<Text style={{ fontSize: 14, fontWeight: '600', color: '#18472f' }}>User#39239!</Text>
									<Text style={{ fontSize: 11, color: '#18472f', marginTop: 4 }}>Household</Text>
								</View>

								<View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
									<Image 
										source={{ uri: 'https://ui-avatars.com/api/?name=User&background=18472f&color=fff' }}
										style={{ width: '100%', height: '100%' }}
										resizeMode="cover"
									/>
								</View>
							</View>
						</View>

						{/* Divider */}
						<View style={tw`h-[1px] bg-[#264A3C] my-2`} />

						{/* Menu items */}
						<View style={tw`mt-2 px-2`}>
							<TouchableOpacity
								style={tw`flex-row items-center py-3 px-3 rounded`}
								onPress={() => {
									onNavigate?.('Rewards');
									onClose();
								}}
							>
								<Gift color="#E6F0E9" size={20} />
								<Text style={tw`text-[16px] text-[#E6F0E9] ml-3`}>Rewards</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={tw`flex-row items-center py-3 px-3 rounded`}
								onPress={() => {
									onNavigate?.('History');
									onClose();
								}}
							>
								<Clock color="#E6F0E9" size={20} />
								<Text style={tw`text-[16px] text-[#E6F0E9] ml-3`}>History</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={tw`flex-row items-center py-3 px-3 rounded`}
								onPress={() => {
									onNavigate?.('Map');
									onClose();
								}}
							>
								<MapPin color="#E6F0E9" size={20} />
								<Text style={tw`text-[16px] text-[#E6F0E9] ml-3`}>Map</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={tw`flex-row items-center py-3 px-3 rounded`}
								onPress={() => {
									onNavigate?.('Settings');
									onClose();
								}}
							>
								<Settings color="#E6F0E9" size={20} />
								<Text style={tw`text-[16px] text-[#E6F0E9] ml-3`}>Settings</Text>
							</TouchableOpacity>
						</View>

						<View style={{ flex: 1 }} />

						<View style={tw`px-4 pb-6`}>
							<TouchableOpacity
								onPress={() => {
									onClose();
								}}
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
	);
}
