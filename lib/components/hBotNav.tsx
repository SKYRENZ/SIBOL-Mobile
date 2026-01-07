import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import tw from '../utils/tailwind';
import { Menu, MessageSquare, Home as HomeIcon, ArrowLeft, QrCode } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useMenu } from './MenuProvider';

interface BottomNavbarProps {
	onScan?: () => void;
	currentPage?: 'Menu' | 'Chat' | 'Home' | 'Scan' | 'Back';
	onRefresh?: () => void;
}

export default function BottomNavbar({ onScan, currentPage, onRefresh }: BottomNavbarProps) {
	const navigation = useNavigation<any>();
	const { openMenu } = useMenu();

	const handleNavigation = (page: string) => {
		if (page === currentPage) {
			if (onRefresh) {
				onRefresh();
			} else if (page === 'Scan') {
				if (onScan) onScan();
			}
		} else {
			switch (page) {
				case 'Menu':
					openMenu();
					break;
				case 'Chat':
					navigation.navigate('ChatSupport');
					break;
				case 'Home':
					navigation.navigate('HDashboard' as never);
					break;
				case 'Scan':
					if (onScan) onScan();
					break;
				case 'Back':
					navigation.goBack();
					break;
			}
		}
	};

	return (
		<>
			<View style={tw.style(`h-22 flex-row justify-around items-end bg-primary relative`, Platform.OS === 'android' ? 'pb-8' : 'pb-4')}>
				<TouchableOpacity style={tw`items-center min-w-[60px]`} onPress={() => handleNavigation('Menu')}>
					<Menu color="white" size={22} />
					<Text style={tw`text-[11px] font-semibold text-white mt-1 font-inter`}>Menu</Text>
				</TouchableOpacity>
				<TouchableOpacity style={tw`items-center min-w-[60px]`} onPress={() => handleNavigation('Chat')}>
					<MessageSquare color="white" size={22} />
					<Text style={tw`text-[11px] font-semibold text-white mt-1 font-inter`}>Chat Support</Text>
				</TouchableOpacity>
				<View style={tw`items-center min-w-[60px] relative -bottom-3`}>
					<TouchableOpacity
						style={tw`w-[72px] h-[72px] rounded-full bg-primary border-2 border-white justify-center items-center`}
						onPress={() => handleNavigation('Home')}
					>
						<HomeIcon color="white" size={22} />
					</TouchableOpacity>
					<View style={tw`items-center`}>
						<Text style={tw`text-[11px] font-semibold text-white mt-1 font-inter`}>Home</Text>
						<View style={tw`w-[14px] h-[1.2px] bg-white mt-[1px] rounded-[1px]`} />
					</View>
				</View>

				<TouchableOpacity style={tw`items-center min-w-[60px]`} onPress={() => handleNavigation('Scan')}>
					<QrCode color="white" size={22} />
					<Text style={tw`text-[11px] font-semibold text-white mt-1 font-inter`}>Scan QR</Text>
				</TouchableOpacity>

				<TouchableOpacity style={tw`items-center min-w-[60px]`} onPress={() => handleNavigation('Back')}>
					<ArrowLeft color="white" size={22} />
					<Text style={tw`text-[11px] font-semibold text-white mt-1 font-inter`}>Back</Text>
				</TouchableOpacity>
			</View>
		</>
	);
}
