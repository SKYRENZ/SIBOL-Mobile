import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Platform, PermissionsAndroid } from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import { connectToESP32 } from '../config/esp32Connection';
// use the React Native version of Lucide (renders native SVGs)
import { Wifi, ArrowLeft, Check } from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
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
  const [connecting, setConnecting] = React.useState(false);
  const [selectedNetwork, setSelectedNetwork] = React.useState('');
  const route = useRoute<any>();
  const [wifiNetworks, setWifiNetworks] = React.useState<{ name: string; strength: number }[]>([]);
  const [scanning, setScanning] = React.useState(false);
  const [scanError, setScanError] = React.useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = React.useState<boolean | null>(null);
  
  const connectToNetwork = async () => {
    if (!selectedNetwork) return;
    setScanError(null);
    setConnecting(true);
    try {
      await connectToESP32(selectedNetwork);
      setIsConnected(true);
      navigation.navigate('OMaintenance' as any, { connectedNetwork: selectedNetwork });
    } catch (e: any) {
      setScanError(e?.message ?? String(e));
    } finally {
      setConnecting(false);
    }
  };

  const handleNetworkSelect = (networkName: string) => {
    setSelectedNetwork(networkName);
  };

  const handleDone = () => {
    setIsConnected(false);
    navigation.goBack();
  };

  const requestAndroidLocation = async (): Promise<boolean> => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location required',
          message: 'Location permission is required to scan Wi‑Fi networks',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      return false;
    }
  };

  const scanForWifi = async () => {
    setScanError(null);
    if (Platform.OS === 'android') {
      const ok = await requestAndroidLocation();
      setPermissionGranted(ok);
      if (!ok) {
        setScanError('Location permission denied — cannot scan Wi‑Fi.');
        return;
      }
      try {
        setScanning(true);
        // reScanAndLoadWifiList triggers a fresh scan then returns list
        const list: any[] = await WifiManager.reScanAndLoadWifiList();
        // normalize list into {name, strength} — strength 1..3
        const networks = (Array.isArray(list) ? list : []).map((n: any) => {
          const ssid = n.SSID ?? n.ssid ?? n.Ssid ?? '';
          // `level` / `signal_level` / `rssi` may differ; fallback handling:
          const raw = n.level ?? n.signal_level ?? n.RSSI ?? n.rssi ?? n.signalStrength ?? 0;
          const level = typeof raw === 'number' ? raw : parseInt(String(raw || '0'), 10);
          // convert RSSI (~ -100..0) to 1..3 buckets
          const strength = level <= -80 ? 1 : level <= -50 ? 2 : 3;
          return { name: ssid, strength };
        }).filter((nw: any) => nw.name);
        setWifiNetworks(networks);
      } catch (e: any) {
        setScanError(e?.message ?? String(e));
        setWifiNetworks([]);
      } finally {
        setScanning(false);
      }
    } else {
      // iOS scanning is limited and typically requires entitlements / native support
      setScanError('Wi‑Fi scanning is not available on iOS in this app.');
    }
  };

  React.useEffect(() => {
    scanForWifi();
    // optionally re-scan when returning to this screen — keep minimal for now
  }, []);

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-8`}>
        <View style={tw`px-5 pt-8 pb-6`}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={tw`absolute left-5 top-8 z-10`}
          >
            <ArrowLeft size={24} color="#2E523A" />
          </TouchableOpacity>
          
          <View style={tw`items-center`}>
            <View style={tw`w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4`}>
              <Wifi size={40} color="#4F6853" />
            </View>
            <Text style={tw`text-2xl font-bold text-[#2E523A] text-center mb-2`}>
              Add Device
            </Text>
            <Text style={tw`text-center text-gray-600 mb-6 px-4`}>
              Select your Wi-Fi network to connect your SIBOL Machine
            </Text>
            
            <View style={tw`w-full bg-gray-100 rounded-lg p-4 mb-6`}>
              <View style={tw`flex-row items-center`}>
                <Wifi size={20} color="#4F6853" />
                <View style={tw`ml-3`}>
                  <Text style={tw`text-sm text-gray-500`}>Network Name</Text>
                  <Text style={tw`font-medium text-[#2E523A]`}>SIBOL_Rack_1002</Text>
                </View>
              </View>
            </View>
            
            <View style={tw`w-full`}>
              <View style={tw`flex-row justify-between items-center mb-3`}>
                <Text style={tw`text-sm font-medium text-gray-500`}>AVAILABLE NETWORKS</Text>
                <View style={tw`flex-row items-center`}>
                  <TouchableOpacity
                    onPress={scanForWifi}
                    style={tw`mr-3`}
                    disabled={scanning}
                  >
                    <Text style={tw`text-xs text-[#4F6853]`}>{scanning ? 'Scanning…' : 'Refresh'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {scanError ? (
                <Text style={tw`text-sm text-red-500 mb-3`}>{scanError}</Text>
              ) : null}
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
                    <Wifi
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
          onPress={connectToNetwork}
          disabled={!selectedNetwork || connecting}
          style={[
            tw`bg-[#4F6853] py-3 rounded-lg items-center`,
            (!selectedNetwork || connecting) && tw`opacity-50`
          ]}
        >
          <Text style={tw`text-white font-semibold text-base`}>
            {connecting ? 'Connecting…' : 'Connect'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Connection Success Popup */}
      {isConnected && (
        <View style={tw`absolute inset-0 bg-black bg-opacity-50 justify-center items-center`}>
          <View style={tw`bg-white rounded-xl p-6 w-5/6 max-w-sm`}>
            <View style={tw`items-center mb-4`}>
              <View style={tw`w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-3`}>
                <Check size={32} color="#4CAF50" />
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
