import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import tw from '../utils/tailwind';
import BottomNavbar from '../components/oBotNav';
import BottomNavSpacer from '../components/commons/BottomNavSpacer'; // ✅ added
import { ChevronDown, Settings, Wifi, FileSearch } from 'lucide-react-native';
import Tabs from '../components/commons/Tabs';
import OProcessSensors from '../components/oProcessSensors';
import OProcessDetails from '../components/oProcessDetails';
import OInputWaste from '../components/oInputWastemachine';
import { useNavigation } from '@react-navigation/native';
import { createWasteInput } from '../services/wasteInputService';
import { fetchMachines, Machine } from '../services/machineService';

type MainTabType = 'Maintenance' | 'Additive' | 'Process';
type ProcessTabType = 'Process Panel' | 'Process Sensors and Alerts' | 'Process Details';

export default function OProcess() {
  const [selectedMainTab, setSelectedMainTab] = useState<MainTabType>('Process');
  const [selectedProcessTab, setSelectedProcessTab] = useState<ProcessTabType>('Process Panel');
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machinesLoading, setMachinesLoading] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);
  const selectedMachine = useMemo(() => {
    if (!selectedMachineId) return null;
    return machines.find((m) => m.machine_id === selectedMachineId) ?? null;
  }, [machines, selectedMachineId]);
  const [machineDropdownOpen, setMachineDropdownOpen] = useState(false);
  const [inputWasteModalVisible, setInputWasteModalVisible] = useState(false);
  const [savingWaste, setSavingWaste] = useState(false);
  const navigation = useNavigation<any>();

  useEffect(() => {
    let mounted = true;

    (async () => {
      setMachinesLoading(true);
      try {
        const rows = await fetchMachines();
        if (!mounted) return;
        setMachines(rows || []);
        if (rows?.length && !selectedMachineId) {
          setSelectedMachineId(rows[0].machine_id);
        }
      } catch {
        if (!mounted) return;
        setMachines([]);
      } finally {
        if (!mounted) return;
        setMachinesLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

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

  const handleInputWasteSave = async (payload: {
    machineId: string;
    weightTotal: string;
    date: Date;
  }) => {
    setSavingWaste(true);
    try {
      await createWasteInput(payload.machineId, Number(payload.weightTotal));
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to save waste input.';
      Alert.alert('Save failed', String(msg));
      throw err;
    } finally {
      setSavingWaste(false);
    }
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
                <View
                  style={tw`h-5 rounded-2xl border-2 border-[#AFC8AD] bg-[#88AB8E] overflow-hidden`}
                >
                  <View
                    style={{ width: '50%', height: '100%', backgroundColor: '#FFFFFF', borderRadius: 999 }}
                  />
                </View>
              </View>

              <Text style={tw`text-[#6C8770] font-semibold text-[15px] text-center`}>
                This is the possible time frame
              </Text>
            </View>
          </View>
        );

      case 'Process Sensors and Alerts':
        return <OProcessSensors machineId={selectedMachineId} />;

      case 'Process Details':
        return <OProcessDetails machineId={selectedMachineId} machineName={selectedMachine?.Name} />;

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

        <TouchableOpacity
          style={tw`bg-primary rounded-md px-4 py-2 flex-row items-center justify-between self-start mb-6`}
          onPress={() => setMachineDropdownOpen(!machineDropdownOpen)}
        >
          <Text style={tw`text-white font-bold text-[10px] mr-2`}>
            {selectedMachine?.Name ?? (machinesLoading ? 'Loading machines...' : 'Select machine')}
          </Text>
          <ChevronDown color="white" size={12} strokeWidth={2} />
        </TouchableOpacity>

        {machineDropdownOpen && (
          <View style={tw`bg-white border border-[#E5E7EB] rounded-lg px-2 py-2 mb-4 shadow`}>
            {machinesLoading ? (
              <Text style={tw`text-xs text-gray-500 px-2 py-1`}>Loading...</Text>
            ) : machines.length === 0 ? (
              <Text style={tw`text-xs text-gray-500 px-2 py-1`}>No machines found</Text>
            ) : (
              machines.map((m) => (
                <TouchableOpacity
                  key={m.machine_id}
                  style={tw`px-2 py-2 rounded-md`}
                  onPress={() => {
                    setSelectedMachineId(m.machine_id);
                    setMachineDropdownOpen(false);
                  }}
                >
                  <Text style={tw`text-xs text-[#2E523A] font-semibold`}>{m.Name}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

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

        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-0`}>  {/* changed from pb-24 */}
          {renderProcessTabContent()}

          {/* ✅ allow scroll past bottom nav */}
          <BottomNavSpacer />
        </ScrollView>
      </View>

      <View style={tw`absolute bottom-0 left-0 right-0`}>
        <BottomNavbar currentPage="Home" />
      </View>

      <OInputWaste
        visible={inputWasteModalVisible}
        onClose={() => setInputWasteModalVisible(false)}
        onSave={handleInputWasteSave}
        loading={savingWaste}
        machineId={selectedMachineId ? String(selectedMachineId) : ''}
      />
    </View>
  );
}
