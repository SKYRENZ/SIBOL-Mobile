import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../utils/tailwind';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  ODashboard: undefined;
  // Add other screens here as needed
};

type WiFiConnectivityScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ODashboard'>;

export default function WiFiConnectivity() {
  const navigation = useNavigation<WiFiConnectivityScreenNavigationProp>();
  const [isConnected, setIsConnected] = React.useState(false);
  const [selectedNetwork, setSelectedNetwork] = React.useState('');
  
  const wifiNetworks = [
    { name: 'SIBOL_Rack_1002', strength: 3 },
    { name: 'MAGPA-LOAD KA', strength: 2 },
    { name: 'ZTe-kop4lQa', strength: 1 },
    { name: 'Angelo\'s iPhone', strength: 2 },
    { name: 'me', strength: 1 },
  ];

  const handleConnect = () => {
    // Show the success popup immediately
    setIsConnected(true);
  };

  const handleNetworkSelect = (networkName: string) => {
    setSelectedNetwork(networkName);
  };

  const handleDone = () => {
    setIsConnected(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-8`}>
        <View style={tw`px-5 pt-8 pb-6`}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={tw`absolute left-5 top-8 z-10`}
          >
            <MaterialIcons name="arrow-back" size={24} color="#2E523A" />
          </TouchableOpacity>
          
          <View style={tw`items-center`}>
            <View style={tw`w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4`}>
              <MaterialIcons name="wifi" size={40} color="#4F6853" />
            </View>
            <Text style={tw`text-2xl font-bold text-[#2E523A] text-center mb-2`}>
              Add your Wi-Fi
            </Text>
            <Text style={tw`text-center text-gray-600 mb-6 px-4`}>
              Select your Wi-Fi network to connect your SIBOL Machine
            </Text>
            
            <View style={tw`w-full bg-gray-100 rounded-lg p-4 mb-6`}>
              <View style={tw`flex-row items-center`}>
                <MaterialIcons name="wifi" size={20} color="#4F6853" />
                <View style={tw`ml-3`}>
                  <Text style={tw`text-sm text-gray-500`}>Network Name</Text>
                  <Text style={tw`font-medium text-[#2E523A]`}>SIBOL_Rack_1002</Text>
                </View>
              </View>
            </View>
            
            <View style={tw`w-full`}>
              <Text style={tw`text-sm font-medium text-gray-500 mb-3`}>AVAILABLE NETWORKS</Text>
              {wifiNetworks.map((network, index) => (
                <TouchableOpacity 
                  key={index}
                  onPress={() => handleNetworkSelect(network.name)}
                  style={[
                    tw`flex-row items-center justify-between py-3 border-b border-gray-100`,
                    selectedNetwork === network.name && tw`bg-gray-50`
                  ]}
                >
                  <View style={tw`flex-row items-center`}>
                    <MaterialIcons 
                      name="wifi" 
                      size={20} 
                      color={network.strength > 2 ? '#4F6853' : '#A0A0A0'} 
                    />
                    <Text style={tw`ml-3 text-[#2E523A]`}>{network.name}</Text>
                  </View>
                  <View style={tw`flex-row`}>
                    {[1, 2, 3].map((bar) => (
                      <View 
                        key={bar}
                        style={[
                          tw`w-1 h-3 mx-0.5 rounded-full`,
                          bar <= network.strength 
                            ? { backgroundColor: '#4F6853' } 
                            : { backgroundColor: '#E5E7EB' }
                        ]}
                      />
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={tw`px-5 py-4 border-t border-gray-200`}>
        <TouchableOpacity 
          onPress={handleConnect}
          disabled={!selectedNetwork}
          style={[
            tw`bg-[#4F6853] py-3 rounded-lg items-center`,
            !selectedNetwork && tw`opacity-50`
          ]}
        >
          <Text style={tw`text-white font-semibold text-base`}>Connect</Text>
        </TouchableOpacity>
      </View>

      {/* Connection Success Popup */}
      {isConnected && (
        <View style={tw`absolute inset-0 bg-black bg-opacity-50 justify-center items-center`}>
          <View style={tw`bg-white rounded-xl p-6 w-5/6 max-w-sm`}>
            <View style={tw`items-center mb-4`}>
              <View style={tw`w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-3`}>
                <MaterialIcons name="check" size={32} color="#4CAF50" />
              </View>
              <Text style={tw`text-xl font-bold text-gray-800 mb-1`}>Connected</Text>
              <Text style={tw`text-center text-gray-600`}>
                Successfully connected to {selectedNetwork || 'the network'}!
              </Text>
            </View>
            <TouchableOpacity 
              onPress={handleDone}
              style={tw`bg-[#4F6853] py-3 rounded-lg items-center mt-4`}
            >
              <Text style={tw`text-white font-semibold text-base`}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
