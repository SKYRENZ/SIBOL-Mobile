import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from '../utils/tailwind';
import { MapPin, Menu, MessageCircle, Home, Bell, ArrowLeft } from 'lucide-react-native';

type RootStackParamList = {
  HDashboard: undefined;
  HMap: undefined;
  ChatSupport: undefined;
  // Add other screen params as needed
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HMap = () => {
  const navigation = useNavigation<NavigationProp>();
  
  // Mock data for the nearest waste container
  const nearestContainer = {
    street: 'Petunia St.',
    distance: '0.5 km away',
    status: 'Available',
    nextPickup: 'Tomorrow, 8:00 AM'
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={[tw`px-5 pt-2 pb-3 border-b border-gray-200`]}>
        <View style={tw`flex-row items-center justify-between mb-2`}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={tw`p-2 -ml-2`}
          >
            <ArrowLeft size={24} color="#2E523A" />
          </TouchableOpacity>
          <Text style={tw`text-xl font-bold text-primary`}>Map Routes</Text>
          <View style={tw`w-8`} />
        </View>
        
        {/* Search/Address Bar */}
        <View style={tw`flex-row items-center bg-gray-100 rounded-lg px-3 py-2`}>
          <MapPin size={18} color="#6B7280" style={tw`mr-2`} />
          <Text style={tw`text-gray-700 flex-1`}>Cadena De Amor St.</Text>
        </View>
      </View>

      {/* Map Placeholder */}
      <View style={tw`flex-1 bg-gray-200 relative`}>
        {/* This would be replaced with an actual Map component */}
        <View style={[tw`absolute inset-0 items-center justify-center`]}>
          <Text style={tw`text-gray-500`}>Map View</Text>
          
          {/* Map markers */}
          <View style={[tw`absolute`, { top: '40%', left: '30%' }]}>
            <View style={[styles.marker, { backgroundColor: '#3B82F6' }]}>
              <Text style={tw`text-white font-bold`}>3</Text>
            </View>
          </View>
          
          <View style={[tw`absolute`, { top: '60%', left: '50%' }]}>
            <View style={[styles.marker, { backgroundColor: '#3B82F6' }]}>
              <Text style={tw`text-white font-bold`}>4</Text>
            </View>
          </View>
          
          <View style={[tw`absolute`, { top: '30%', right: '25%' }]}>
            <View style={[styles.marker, { backgroundColor: '#3B82F6' }]}>
              <Text style={tw`text-white font-bold`}>10</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Card */}
      <View style={[tw`mx-5 mb-5 p-4 bg-white rounded-xl shadow-lg border border-gray-100`]}>
        <View style={tw`flex-row items-center mb-3`}>
          <View style={tw`bg-blue-100 p-2 rounded-lg mr-3`}>
            <Image 
              source={require('../../assets/waste-truck.png')} 
              style={tw`w-6 h-6`} 
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={tw`text-sm text-gray-500`}>Nearest waste container is in</Text>
            <Text style={tw`font-bold text-lg text-primary`}>{nearestContainer.street}</Text>
          </View>
        </View>
        
        <View style={tw`flex-row justify-between mt-2`}>
          <View style={tw`items-center`}>
            <Text style={tw`text-xs text-gray-500`}>Distance</Text>
            <Text style={tw`font-medium`}>{nearestContainer.distance}</Text>
          </View>
          <View style={tw`items-center`}>
            <Text style={tw`text-xs text-gray-500`}>Status</Text>
            <Text style={[tw`font-medium`, { color: '#10B981' }]}>{nearestContainer.status}</Text>
          </View>
          <View style={tw`items-center`}>
            <Text style={tw`text-xs text-gray-500`}>Next Pickup</Text>
            <Text style={tw`font-medium`}>{nearestContainer.nextPickup}</Text>
          </View>
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={tw`flex-row justify-around items-center py-3 border-t border-gray-200 bg-white`}>
        <TouchableOpacity style={tw`items-center`}>
          <Menu size={24} color="#9CA3AF" />
          <Text style={tw`text-xs text-gray-500 mt-1`}>Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={tw`items-center`}
          onPress={() => navigation.navigate('ChatSupport')}
        >
          <MessageCircle size={24} color="#9CA3AF" />
          <Text style={tw`text-xs text-gray-500 mt-1`}>Chat Support</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={tw`items-center`}
          onPress={() => navigation.navigate('HDashboard')}
        >
          <View style={tw`bg-primary rounded-full p-3 -mt-8`}>
            <Home size={24} color="white" />
          </View>
          <Text style={tw`text-xs text-primary font-bold mt-1`}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tw`items-center`}>
          <Bell size={24} color="#9CA3AF" />
          <Text style={tw`text-xs text-gray-500 mt-1`}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={tw`items-center`}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#9CA3AF" />
          <Text style={tw`text-xs text-gray-500 mt-1`}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default HMap;