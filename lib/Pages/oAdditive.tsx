import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import tw from '../utils/tailwind';
import BottomNavbar from '../components/oBotNav';
import { ChevronDown, Plus } from 'lucide-react-native';
import Tabs from '../components/commons/Tabs';
import Button from '../components/commons/Button';
import AdditiveInput from '../components/AdditiveInput';
import { useNavigation } from '@react-navigation/native';

type TabType = 'Maintenance' | 'Additive' | 'Process';

interface AdditiveRequest {
  id: string;
  title: string;
  units: string;
  values: number;
  date: string;
  time: string;
}

export default function OAdditive() {
  const [selectedTab, setSelectedTab] = useState<TabType>('Additive');
  const [selectedMachine, setSelectedMachine] = useState('SIBOL Machine 1');
  const [machineDropdownOpen, setMachineDropdownOpen] = useState(false);
  const [additiveModalVisible, setAdditiveModalVisible] = useState(false);
  const navigation = useNavigation<any>();

  const additiveRequests: AdditiveRequest[] = [
    {
      id: '1',
      title: 'Water (H2O)',
      units: 'liters',
      values: 20,
      date: 'August 10, 2025',
      time: '11:00 AM',
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
                if (val === 'Maintenance') {
                  navigation.navigate('OMaintenance');
                } else if (val === 'Process') {
                  navigation.navigate('OProcess');
                } else {
                  setSelectedTab(val as TabType);
                }
              }}
            />
          </View>

          <View style={tw`flex-row items-center justify-between gap-2 mb-6`}>
            <TouchableOpacity
              style={tw`bg-primary rounded-md px-4 py-2 flex-row items-center justify-between self-start`}
              onPress={() => setMachineDropdownOpen(!machineDropdownOpen)}
            >
              <Text style={tw`text-white font-bold text-[10px] mr-2`}>
                {selectedMachine}
              </Text>
              <ChevronDown color="white" size={12} strokeWidth={2} />
            </TouchableOpacity>

            <Button
              title="Add"
              onPress={() => setAdditiveModalVisible(true)}
              variant="primary"
              style={tw`px-6 py-2`}
            />
          </View>

          {additiveRequests.map((request) => (
            <View
              key={request.id}
              style={tw`border border-[#88AB8E] rounded-[10px] bg-white p-5 mb-4`}
            >
              <Text style={tw`text-primary font-bold text-[13px] mb-2`}>
                {request.title}
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
                    Units :
                  </Text>
                  <Text style={tw`text-[#6C8770] font-semibold text-[11px]`}>
                    {request.units}
                  </Text>
                </View>

                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={tw`text-[#4F6853] font-semibold text-[11px]`}>
                    Values :
                  </Text>
                  <Text style={tw`text-[#6C8770] font-semibold text-[11px]`}>
                    {request.values}
                  </Text>
                </View>

                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={tw`text-[#4F6853] font-semibold text-[11px]`}>
                    Date :
                  </Text>
                  <Text style={tw`text-[#6C8770] font-semibold text-[11px]`}>
                    {request.date}
                  </Text>
                </View>

                <View style={tw`flex-row justify-between`}>
                  <Text style={tw`text-[#4F6853] font-semibold text-[11px]`}>
                    Time :
                  </Text>
                  <Text style={tw`text-[#6C8770] font-semibold text-[11px]`}>
                    {request.time}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <AdditiveInput
        visible={additiveModalVisible}
        onClose={() => setAdditiveModalVisible(false)}
        onSave={(payload) => {
          console.log('Additive saved:', payload);
          // Handle the additive data here - e.g., send to API
        }}
      />

      <View style={tw`absolute bottom-0 left-0 right-0`}>
        <BottomNavbar currentPage="Home" />
      </View>
    </View>
  );
}
