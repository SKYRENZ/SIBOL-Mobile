import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import tw from '../utils/tailwind';
import BottomNavbar from '../components/oBotNav';
import { ChevronDown } from 'lucide-react-native';
import Tabs from '../components/commons/Tabs';
import { useNavigation } from '@react-navigation/native';

type TabType = 'Maintenance' | 'Chemical' | 'Process';

interface ChemicalRequest {
  id: string;
  title: string;
  description: string;
  requestNumber: string;
  dateAssigned: string;
  dueDate: string;
  remarks: string;
}

export default function OChemical() {
  const [selectedTab, setSelectedTab] = useState<TabType>('Chemical');
  const [selectedMachine, setSelectedMachine] = useState('SIBOL Machine 1');
  const [machineDropdownOpen, setMachineDropdownOpen] = useState(false);
  const navigation = useNavigation<any>();

  const chemicalRequests: ChemicalRequest[] = [
    {
      id: '1',
      title: 'Stage 2: Water (H2O)',
      description: 'Add water to stage 2',
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
              tabs={['Maintenance', 'Chemical', 'Process']}
              activeTab={selectedTab}
              onTabChange={(val) => {
                if (val === 'Maintenance') {
                  navigation.navigate('oMaintenance');
                } else if (val === 'Process') {
                  navigation.navigate('oProcess');
                } else {
                  setSelectedTab(val as TabType);
                }
              }}
            />
          </View>

          <TouchableOpacity
            style={tw`bg-primary rounded-md px-4 py-2 flex-row items-center justify-between self-start mb-6`}
            onPress={() => setMachineDropdownOpen(!machineDropdownOpen)}
          >
            <Text style={tw`text-white font-bold text-[10px] mr-2`}>
              {selectedMachine}
            </Text>
            <ChevronDown color="white" size={12} strokeWidth={2} />
          </TouchableOpacity>

          {chemicalRequests.map((request) => (
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
    </View>
  );
}
