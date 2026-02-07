import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TouchableWithoutFeedback } from 'react-native';
import tw from '../utils/tailwind';
import BottomNavbar from '../components/oBotNav';
import { MaterialIcons } from '@expo/vector-icons';
import Tabs from '../components/commons/Tabs';
import { useNavigation } from '@react-navigation/native';

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
  const [selectedMachine, setSelectedMachine] = useState('SIBOL Machine 2');
  const [machineDropdownOpen, setMachineDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });
  const buttonRef = useRef<View>(null);
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

  const maintenanceRequests: MaintenanceRequest[] = [
    {
      id: '1',
      title: 'Change filters',
      description: 'Change the stage 2 filters on SIBOL Machine 2',
      requestNumber: '112103',
      dateAssigned: 'August 10, 2025',
      dueDate: 'August 10, 2025',
      remarks: 'Change filter',
    },
  ];

  return (
    <View style={tw`flex-1 bg-white`}>
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-20`}>
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
            {/* machine dropdown - uniform style matching home page */}
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

            {/* Add Device - uniform style matching home page */}
            <TouchableOpacity
              style={tw`bg-primary rounded-md px-2 py-1 flex-row items-center`}
              onPress={() => navigation.navigate('WiFiConnectivity' as any)}
            >
              <Text style={tw`text-white font-semibold text-[11px]`}>
                Add Device
              </Text>
            </TouchableOpacity>
          </View>

          {maintenanceRequests.map((request) => (
            <View
              key={request.id}
              style={tw`border border-[#88AB8E] rounded-[10px] bg-white p-5 mb-4`}
            >
              <Text style={tw`text-primary font-bold text-[13px] mb-2`}>
                {request.title}
              </Text>
              <Text style={tw`text-[#6C8770] font-semibold text-[10px] mb-3`}>
                {request.description}
              </Text>

              <View
                style={[
                  tw`my-1`,
                  {
                    height: 1,
                    width: '99%',
                    backgroundColor: '#88AB8E',
                    alignSelf: 'center',
                  },
                ]}
              />

              <View style={tw`mt-2`}>
                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={tw`text-[#4F6853] font-semibold text-[11px]`}>
                    Request number:
                  </Text>
                  <Text style={tw`text-[#6C8770] font-semibold text-[11px]`}>
                    {request.requestNumber}
                  </Text>
                </View>

                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={tw`text-[#4F6853] font-semibold text-[11px]`}>
                    Date Assigned:
                  </Text>
                  <Text style={tw`text-[#6C8770] font-semibold text-[11px]`}>
                    {request.dateAssigned}
                  </Text>
                </View>

                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={tw`text-[#4F6853] font-semibold text-[11px]`}>
                    Due Date:
                  </Text>
                  <Text style={tw`text-[#6C8770] font-semibold text-[11px]`}>
                    {request.dueDate}
                  </Text>
                </View>

                <View style={tw`flex-row justify-between`}>
                  <Text style={tw`text-[#4F6853] font-semibold text-[11px]`}>
                    Remarks from brgy :
                  </Text>
                  <Text style={tw`text-[#6C8770] font-semibold text-[11px]`}>
                    {request.remarks}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={tw`absolute bottom-0 left-0 right-0`}>
        <BottomNavbar currentPage="Home" />
      </View>

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
