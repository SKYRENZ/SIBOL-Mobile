import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import tw from '../utils/tailwind';
import { Menu, MessageSquare, Home as HomeIcon, ArrowLeft, QrCode } from 'lucide-react-native';

export default function BottomNavbar({ onScan, onMenuPress }: { onScan?: () => void; onMenuPress?: () => void }) {
	return (
		<>
			<View style={tw.style(`h-22 flex-row justify-around items-end bg-primary relative`, Platform.OS === 'android' ? 'pb-8' : 'pb-4')}>
				<TouchableOpacity style={tw`items-center min-w-[60px]`} onPress={onMenuPress}>
					<Menu color="white" size={22} />
					<Text style={tw`text-[11px] font-semibold text-white mt-1 font-inter`}>Menu</Text>
				</TouchableOpacity>
				<TouchableOpacity style={tw`items-center min-w-[60px]`}>
					<MessageSquare color="white" size={22} />
					<Text style={tw`text-[11px] font-semibold text-white mt-1 font-inter`}>Chat Support</Text>
				</TouchableOpacity>
				<View style={tw`items-center min-w-[60px] relative -bottom-3`}>
					<View style={tw`w-[72px] h-[72px] rounded-full bg-primary border-2 border-white justify-center items-center`}>
						<HomeIcon color="white" size={22} />
					</View>
					<View style={tw`items-center`}>
						<Text style={tw`text-[11px] font-semibold text-white mt-1 font-inter`}>Home</Text>
						<View style={tw`w-[14px] h-[1.2px] bg-white mt-[1px] rounded-[1px]`} />
					</View>
				</View>

				<TouchableOpacity style={tw`items-center min-w-[60px]`} onPress={onScan}>
					<QrCode color="white" size={22} />
					<Text style={tw`text-[11px] font-semibold text-white mt-1 font-inter`}>Scan QR</Text>
				</TouchableOpacity>

				<TouchableOpacity style={tw`items-center min-w-[60px]`}>
					<ArrowLeft color="white" size={22} />
					<Text style={tw`text-[11px] font-semibold text-white mt-1 font-inter`}>Back</Text>
				</TouchableOpacity>
			</View>
		</>
	);
}
