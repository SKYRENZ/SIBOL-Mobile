import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import tw from '../utils/tailwind';
import BottomNavbar from '../components/oBotNav';
import BottomNavSpacer from '../components/commons/BottomNavSpacer'; // ✅ add
import { MaterialIcons } from '@expo/vector-icons';
import Tabs from '../components/commons/Tabs';
import { useNavigation, useRoute } from '@react-navigation/native';
import { disconnectFromESP32 } from '../config/esp32Connection';
import ConnectNetworkModal from '../components/ConnectNetworkModal';

type TabType = 'Maintenance' | 'Additive' | 'Process';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  requestNumber: string;
  dateAssigned: string;
  dueDate: string;
  remarks: string;
}

export default function OMaintenance() {
  const [selectedTab, setSelectedTab] = useState<TabType>('Maintenance');

  // --- merged: keep both dropdown + connection state
  const [selectedMachine, setSelectedMachine] = useState('SIBOL Machine 1');
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);

  const [machineDropdownOpen, setMachineDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const buttonRef = useRef<View>(null);

  const [connectModalVisible, setConnectModalVisible] = useState(false);
  const [wifiConnecting, setWifiConnecting] = useState(false);

  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  React.useEffect(() => {
    const ssid = route.params?.connectedNetwork;
    if (ssid) {
      setSelectedMachine(String(ssid));
      setConnectedDevice(String(ssid));
    }
  }, [route.params?.connectedNetwork]);

  const machineOptions = ['SIBOL Machine 1', 'SIBOL Machine 2', 'SIBOL Machine 3', 'SIBOL Machine 4', 'SIBOL Machine 5'];

  const handleMachineSelect = (machine: string) => {
    setSelectedMachine(machine);
    setMachineDropdownOpen(false);
  };

  const openDropdown = () => {
    if (buttonRef.current) {
      buttonRef.current.measureInWindow((x, y, width, height) => {
        setDropdownPos({ x, y, width, height });
        setMachineDropdownOpen(true);
      });
    }
  };

  const handleDisconnect = async () => {
    if (!connectedDevice) return;
    try {
      await disconnectFromESP32(connectedDevice);
    } catch {
      // ignore for now
    } finally {
      setConnectedDevice(null);
      setSelectedMachine('SIBOL Machine 1');
    }
  };

  const handleConnect = () => {
    setConnectModalVisible(true);
  };

  const handleConnectWifiSubmit = async (ssid: string, password: string) => {
    if (!connectedDevice) return;

    setWifiConnecting(true);
    try {
      // TODO: call your ESP32 provisioning function here
      // await provisionESP32Wifi(connectedDevice, ssid, password);
      
      // Simulate successful connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConnectModalVisible(false);
    } catch (error) {
      console.error('WiFi connection failed:', error);
    } finally {
      setWifiConnecting(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-0`}>
        <View style={tw`px-4 pt-11`}>
          <Text style={tw`text-center text-[#6C8770] text-xl font-bold mb-6`}>
            SIBOL Machines
          </Text>

          <View style={tw`mb-6`}>
            <Tabs
              tabs={['Maintenance', 'Additive', 'Process']}
              activeTab={selectedTab}
              onTabChange={(val) => {
                if (val === 'Additive') {
                  navigation.navigate('OAdditive');
                } else if (val === 'Process') {
                  navigation.navigate('OProcess');
                } else {
                  setSelectedTab(val as TabType);
                }
              }}
            />
          </View>

          <View style={tw`flex-row items-center justify-between gap-2 mb-6`}>
            {/* machine dropdown */}
            <View ref={buttonRef}>
              <TouchableOpacity
                style={tw`bg-primary rounded-md px-2 py-1 flex-row items-center`}
                onPress={openDropdown}
              >
                <Text style={tw`text-white font-semibold text-[11px] mr-1`}>
                  {connectedDevice || selectedMachine}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={14} color="white" />
              </TouchableOpacity>
            </View>

            {/* Add Device */}
            <TouchableOpacity
              style={tw`bg-primary rounded-md px-2 py-1 flex-row items-center`}
              onPress={() => navigation.navigate('WiFiConnectivity' as any)}
            >
              <Text style={tw`text-white font-semibold text-[11px]`}>Add Device</Text>
            </TouchableOpacity>
          </View>

          {/* Connected device display */}
          {connectedDevice ? (
            <View style={tw`border border-[#88AB8E] rounded-[10px] bg-white p-4 mb-6`}>
              <Text style={tw`text-sm text-[#4F6853] font-semibold mb-1`}>Connected Device</Text>
              <Text style={tw`text-lg font-bold text-[#2E523A]`}>{connectedDevice}</Text>

              <View style={{ height: 1, backgroundColor: '#E5E7EB', marginTop: 12, marginBottom: 12 }} />

              <View style={tw`flex-row`}>
                <TouchableOpacity
                  onPress={handleDisconnect}
                  disabled={!connectedDevice}
                  style={[
                    tw`flex-1 py-2 mr-2 rounded-lg items-center`,
                    !connectedDevice ? tw`bg-gray-100 border border-gray-200` : tw`bg-white border border-[#E5E7EB]`,
                  ]}
                >
                  <Text style={tw`text-[#4F6853]`}>Disconnect</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConnect}
                  disabled={wifiConnecting}
                  style={[
                    tw`flex-1 py-2 ml-2 rounded-lg items-center bg-[#4F6853]`,
                    wifiConnecting ? tw`opacity-50` : null,
                  ]}
                >
                  <Text style={tw`text-white`}>{wifiConnecting ? 'Connecting…' : 'Connect to network'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

           
        </View>

        {/* ✅ allow scroll past bottom nav */}
        <BottomNavSpacer />
      </ScrollView>

      <View style={tw`absolute bottom-0 left-0 right-0`}>
        <BottomNavbar currentPage="Home" />
      </View>

      {/* Connect Network Modal
          Note: props may differ in your component; `as any` avoids TS prop mismatch during merge cleanup. */}
      <ConnectNetworkModal
        {...({
          visible: connectModalVisible,
          onClose: () => setConnectModalVisible(false),
          onSubmit: handleConnectWifiSubmit,
          loading: wifiConnecting,
        } as any)}
      />

      {/* Machine Dropdown Modal */}
      {machineDropdownOpen && (
        <Modal
          transparent
          animationType="none"
          visible={machineDropdownOpen}
          onRequestClose={() => setMachineDropdownOpen(false)}
        >
          <TouchableWithoutFeedback onPress={() => setMachineDropdownOpen(false)}>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  position: 'absolute',
                  top: dropdownPos.y + dropdownPos.height + 4,
                  left: dropdownPos.x,
                  width: 140,
                  zIndex: 100,
                }}
              >
                <View style={tw`bg-white rounded-md shadow-lg border border-gray-200`}>
                  {machineOptions.map((machine, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleMachineSelect(machine)}
                      style={tw`px-4 py-2.5 ${index === machineOptions.length - 1 ? '' : 'border-b border-gray-200'}`}
                    >
                      <Text
                        style={[
                          tw`text-[11px] font-medium`,
                          selectedMachine === machine ? tw`text-primary font-semibold` : tw`text-gray-700`,
                        ]}
                      >
                        {machine}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
}
