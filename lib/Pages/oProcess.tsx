import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Modal, TouchableWithoutFeedback } from 'react-native';
import tw from '../utils/tailwind';
import BottomNavbar from '../components/oBotNav';
import { MaterialIcons } from '@expo/vector-icons';
import { Settings, Wifi, FileSearch } from 'lucide-react-native';
import Tabs from '../components/commons/Tabs';
import OProcessSensors from '../components/oProcessSensors';
import OProcessDetails from '../components/oProcessDetails';
import OInputWaste from '../components/oInputWaste';
import { useNavigation } from '@react-navigation/native';

type MainTabType = 'Maintenance' | 'Additive' | 'Process';
type ProcessTabType = 'Process Panel' | 'Process Sensors and Alerts' | 'Process Details';

export default function OProcess() {
  const [selectedMainTab, setSelectedMainTab] = useState<MainTabType>('Process');
  const [selectedProcessTab, setSelectedProcessTab] = useState<ProcessTabType>('Process Panel');
  const [selectedMachine, setSelectedMachine] = useState('SIBOL Machine 2');
  const [machineDropdownOpen, setMachineDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });
  const buttonRef = useRef<View>(null);
  const [inputWasteModalVisible, setInputWasteModalVisible] = useState(false);
  const navigation = useNavigation<any>();

  const machineOptions = ['SIBOL Machine 2', 'SIBOL Machine 3', 'SIBOL Machine 4', 'SIBOL Machine 5'];

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

  const handleMainTabChange = (tab: string) => {
    if (tab === 'Maintenance') {
      navigation.navigate('OMaintenance');
    } else if (tab === 'Additive') {
      navigation.navigate('OAdditive');
    } else {
      setSelectedMainTab(tab as MainTabType);
    }
  };

  const renderProcessTabIcon = (tabName: ProcessTabType) => {
    const isSelected = selectedProcessTab === tabName;
    const iconColor = '#2E523A';
    const iconSize = 40;

    switch (tabName) {
      case 'Process Panel':
        return <Settings color={iconColor} size={iconSize} strokeWidth={1.5} />;
      case 'Process Sensors and Alerts':
        return <Wifi color={iconColor} size={iconSize} strokeWidth={1.5} />;
      case 'Process Details':
        return <FileSearch color={iconColor} size={iconSize} strokeWidth={1.5} />;
      default:
        return null;
    }
  };

  const handleInputWasteSave = (payload: {
    machineId: string;
    weightTotal: string;
    date: Date;
  }) => {
    console.log('Input Waste Data:', payload);
    // TODO: Implement save logic here
  };

  const renderProcessTabContent = () => {
    switch (selectedProcessTab) {
      case 'Process Panel':
        return (
          <View style={tw`mt-6 px-4`}>
            <TouchableOpacity
              style={tw`bg-[#24492A] rounded-2xl py-3 mb-6`}
              onPress={() => setInputWasteModalVisible(true)}
            >
              <Text style={tw`text-white font-bold text-base text-center`}>
                Input Waste
              </Text>
            </TouchableOpacity>

            <View
              style={tw`border-3 border-[#F2F1EB] bg-white rounded-2xl p-6 shadow-lg mb-6`}
            >
              <Text style={tw`text-[#6C8770] font-bold text-xl text-center mb-4`}>
                Process Panel
              </Text>

              <View style={tw`items-center my-4`}>
                <Image
                  source={require('../../assets/sibol-process.png')}
                  style={{ width: 200, height: 200 }}
                  resizeMode="contain"
                />
              </View>

              <Text style={tw`text-[#2E523A] font-medium text-[10px] text-center mt-2`}>
                Sibol Machine 2 is in Stage 2: Anaerobic Digester. No problems found.
              </Text>
            </View>

            <View
              style={tw`border-3 border-[#F2F1EB] bg-white rounded-2xl p-5 shadow-lg`}
            >
              <View style={tw`bg-[#88AB8E] rounded-xl py-2 mb-4`}>
                <Text style={tw`text-white font-bold text-base text-center`}>
                  Stage 3: Anaerobic Digestion
                </Text>
              </View>

              <Text style={tw`text-[#6C8770] font-bold text-6xl text-center my-4`}>
                50%
              </Text>

              <View style={tw`flex-row justify-between items-center mb-2`}>
                <Text style={tw`text-[#AFC8AD] font-bold text-xs`}>
                  September 1
                </Text>
                <Text style={tw`text-[#AFC8AD] font-bold text-xs`}>
                  September 30
                </Text>
              </View>

              <View style={tw`mb-3`}>
                <View style={tw`h-5 rounded-2xl border-2 border-[#AFC8AD] bg-[#88AB8E] overflow-hidden`}>
                  <View style={{ width: '50%', height: '100%', backgroundColor: '#FFFFFF', borderRadius: 999 }} />
                </View>
              </View>

              <Text style={tw`text-[#6C8770] font-semibold text-[15px] text-center`}>
                This is the possible time frame
              </Text>
            </View>
          </View>
        );

      case 'Process Sensors and Alerts':
        return <OProcessSensors />;

      case 'Process Details':
        return <OProcessDetails machineId={selectedMachine} />;

      default:
        return null;
    }
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      <View style={tw`px-4 pt-11 flex-1`}>
        <Text style={tw`text-center text-[#6C8770] text-xl font-bold mb-6`}>
          SIBOL Machines
        </Text>

        <View style={tw`mb-6`}>
          <Tabs
            tabs={['Maintenance', 'Additive', 'Process']}
            activeTab={selectedMainTab}
            onTabChange={handleMainTabChange}
          />
        </View>

        <View style={tw`flex-row items-center justify-between gap-2 mb-6`}>
          <View ref={buttonRef}>
            <TouchableOpacity
              style={tw`bg-primary rounded-md px-2 py-1 flex-row items-center`}
              onPress={openDropdown}
            >
              <Text style={tw`text-white font-semibold text-[11px] mr-1`}>
                {selectedMachine}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={14} color="white" />
            </TouchableOpacity>
          </View>
          <View style={tw`w-20`} />
        </View>

        <View style={tw`flex-row justify-between mb-2`}>
          {(['Process Panel', 'Process Sensors and Alerts', 'Process Details'] as ProcessTabType[]).map(
            (tab) => {
              const isSelected = selectedProcessTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    tw`flex-1 mx-1 rounded-2xl bg-white items-center py-3`,
                    isSelected
                      ? tw`border border-[rgba(175,200,173,0.61)] shadow-lg`
                      : tw`border border-transparent`,
                  ]}
                  onPress={() => setSelectedProcessTab(tab)}
                >
                  <View
                    style={[
                      tw`w-20 h-20 rounded-2xl items-center justify-center mb-2`,
                      tw`bg-[rgba(175,200,173,0.61)]`,
                    ]}
                  >
                    {renderProcessTabIcon(tab)}
                  </View>
                  <Text
                    style={tw`text-[#2E523A] font-semibold text-[11px] text-center px-1`}
                    numberOfLines={2}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>

        <View style={tw`border-b border-[#6C8770] my-4 mx-2`} />

        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-24`}>
          {renderProcessTabContent()}
        </ScrollView>
      </View>

      <View style={tw`absolute bottom-0 left-0 right-0`}>
        <BottomNavbar currentPage="Home" />
      </View>

      <OInputWaste
        visible={inputWasteModalVisible}
        onClose={() => setInputWasteModalVisible(false)}
        onSave={handleInputWasteSave}
      />

      {/* Machine Dropdown Modal */}
      {machineDropdownOpen && (
        <Modal transparent animationType="none" visible={machineDropdownOpen} onRequestClose={() => setMachineDropdownOpen(false)}>
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
