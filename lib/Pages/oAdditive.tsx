import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import tw from '../utils/tailwind';
import BottomNavbar from '../components/oBotNav';
import { ChevronDown, Plus } from 'lucide-react-native';
import Tabs from '../components/commons/Tabs';
import Button from '../components/commons/Button';
import AdditiveInput from '../components/AdditiveInput';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { createAdditive, fetchAdditives, AdditiveRow } from '../services/additivesService';
import { fetchMachines, Machine } from '../services/machineService';

type TabType = 'Maintenance' | 'Additive' | 'Process';
type AdditiveRequest = {
  id: string;
  title: string;
  units: string;
  values: number;
  date: string;
  time: string;
};
type DateFilter = 'All' | 'Weekly' | 'Monthly';

const formatDate = (isoDate: string) => {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export default function OAdditive() {
  const [selectedTab, setSelectedTab] = useState<TabType>('Additive');
  const [selectedMachine, setSelectedMachine] = useState('SIBOL Machine 1');
  const [machineDropdownOpen, setMachineDropdownOpen] = useState(false);
  const [additiveModalVisible, setAdditiveModalVisible] = useState(false);
  const navigation = useNavigation<any>();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);
  const [additives, setAdditives] = useState<AdditiveRow[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>('All');

  const loadMachines = async () => {
    try {
      const list = await fetchMachines();
      setMachines(list);
      if (list.length > 0 && !selectedMachineId) {
        setSelectedMachineId(list[0].machine_id);
        setSelectedMachine(list[0].Name);
      }
    } catch {
      setMachines([]);
    }
  };

  useEffect(() => {
    loadMachines();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadMachines();
    }, [])
  );

  useEffect(() => {
    if (!selectedMachineId) return;
    fetchAdditives(selectedMachineId)
      .then(setAdditives)
      .catch(() => setAdditives([]));
  }, [selectedMachineId]);

  const filteredAdditives = useMemo(() => {
    if (!additives.length) return [];
    const now = new Date();

    const withinRange = (d: Date) => {
      if (dateFilter === 'Weekly') {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        return d >= sevenDaysAgo && d <= now;
      }
      if (dateFilter === 'Monthly') {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return d >= thirtyDaysAgo && d <= now;
      }
      return true;
    };

    return additives
      .map((a) => {
        const dt = new Date(`${a.date}T${a.time}`);
        return { ...a, _dt: dt };
      })
      .filter((a) => withinRange(a._dt))
      .sort((a, b) => b._dt.getTime() - a._dt.getTime());
  }, [additives, dateFilter]);

  const additiveRequests: AdditiveRequest[] = [];

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

          <View style={tw`flex-row items-center gap-2 mb-4`}>
            {(['All', 'Weekly', 'Monthly'] as DateFilter[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={tw`${dateFilter === f ? 'bg-primary' : 'bg-white'} border border-[#88AB8E] px-3 py-1 rounded-full`}
                onPress={() => setDateFilter(f)}
              >
                <Text
                  style={tw`${dateFilter === f ? 'text-white' : 'text-[#4F6853]'} text-[11px] font-semibold`}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredAdditives.map((item) => (
            <View
              key={item.id}
              style={tw`border border-[#88AB8E] rounded-[10px] bg-white p-5 mb-4`}
            >
              <Text style={tw`text-primary font-bold text-[13px] mb-2`}>
                {item.additive_name ?? item.additive_input}
              </Text>

              <View
                style={[
                  tw`my-1`,
                  { height: 1, width: '99%', backgroundColor: '#88AB8E', alignSelf: 'center' },
                ]}
              />

              <View style={tw`mt-2`}>
                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={tw`text-[#4F6853] font-semibold text-[11px]`}>Units :</Text>
                  <Text style={tw`text-[#6C8770] font-semibold text-[11px]`}>{item.units}</Text>
                </View>
                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={tw`text-[#4F6853] font-semibold text-[11px]`}>Values :</Text>
                  <Text style={tw`text-[#6C8770] font-semibold text-[11px]`}>{item.value}</Text>
                </View>
                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={tw`text-[#4F6853] font-semibold text-[11px]`}>Date :</Text>
                  <Text style={tw`text-[#6C8770] font-semibold text-[11px]`}>
                    {formatDate(item.date)}
                  </Text>
                </View>
                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={tw`text-[#4F6853] font-semibold text-[11px]`}>Time :</Text>
                  <Text style={tw`text-[#6C8770] font-semibold text-[11px]`}>{item.time}</Text>
                </View>
                {item.operator_username ? (
                  <View style={tw`flex-row justify-between`}>
                    <Text style={tw`text-[#4F6853] font-semibold text-[11px]`}>Operator :</Text>
                    <Text style={tw`text-[#6C8770] font-semibold text-[11px]`}>{item.operator_username}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}

          {filteredAdditives.length === 0 ? (
            <Text style={tw`text-center text-[#6C8770] text-[11px] mt-2`}>
              No additive history.
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <AdditiveInput
        visible={additiveModalVisible}
        onClose={() => setAdditiveModalVisible(false)}
        onSave={async (payload) => {
          if (!selectedMachineId) return;
          await createAdditive({
            machine_id: selectedMachineId,
            additive_type_id: payload.additiveId,
            stage: 'N/A',
            value: Number(payload.value),
            units: payload.unit,
          });
        }}
      />

      <View style={tw`absolute bottom-0 left-0 right-0`}>
        <BottomNavbar currentPage="Home" />
      </View>
    </View>
  );
}
