import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import tw from '../utils/tailwind';
import BottomNavbar from '../components/oBotNav';
import BottomNavSpacer from '../components/commons/BottomNavSpacer'; // ✅ added
import { useProcessAlert } from '../components/ProcessAlertProvider';
import { ChevronDown, Settings, Wifi, FileSearch, AlertCircle, X } from 'lucide-react-native';
import Tabs from '../components/commons/Tabs';
import OProcessSensors from '../components/oProcessSensors';
import OProcessDetails from '../components/oProcessDetails';
import OInputWaste from '../components/oInputWastemachine';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { createWasteInput, getWasteInputsByMachineId } from '../services/wasteInputService';
import { fetchMachines, fetchOperatorMachines, Machine } from '../services/machineService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type MainTabType = 'Maintenance' | 'Additive' | 'Process';
type ProcessTabType = 'Process Panel' | 'Process Sensors and Alerts' | 'Process Details';

export default function OProcess() {
  const [selectedMainTab, setSelectedMainTab] = useState<MainTabType>('Process');
  const [selectedProcessTab, setSelectedProcessTab] = useState<ProcessTabType>('Process Panel');
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machinesLoading, setMachinesLoading] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);
  const [machineDropdownOpen, setMachineDropdownOpen] = useState(false);
  const [machineModalVisible, setMachineModalVisible] = useState(false);
  const [inputWasteModalVisible, setInputWasteModalVisible] = useState(false);
  const [savingWaste, setSavingWaste] = useState(false);
  const [hasInputToday, setHasInputToday] = useState<boolean | null>(null);
  const [checkingInputToday, setCheckingInputToday] = useState(false);
  const [hasSensorAlerts, setHasSensorAlerts] = useState(false);
  const { setHasProcessAlert } = useProcessAlert();
  const navigation = useNavigation<any>();

  const selectedMachine = useMemo(() => {
    if (!selectedMachineId) return null;
    return machines.find((m) => m.machine_id === selectedMachineId) ?? null;
  }, [machines, selectedMachineId]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setMachinesLoading(true);
      try {
        // Get current operator ID
        const rawUser = await AsyncStorage.getItem('user');
        let operatorId: number | null = null;
        
        if (rawUser) {
          const user = JSON.parse(rawUser);
          console.log('User data from AsyncStorage:', user);
          operatorId = Number(user?.Account_id ?? user?.AccountId ?? user?.id);
          console.log('Extracted operator ID:', operatorId);
        } else {
          console.log('No user data found in AsyncStorage');
        }

        // Fetch machines based on operator
        let machineData: Machine[] = [];
        if (operatorId && Number.isFinite(operatorId)) {
          console.log('Fetching machines for operator:', operatorId);
          try {
            machineData = await fetchOperatorMachines(operatorId);
            console.log('Operator machines fetched:', machineData);
            
            // If no machines found for operator, try all machines as fallback
            if (!machineData || machineData.length === 0) {
              console.log('No machines found for operator, fetching all machines as fallback');
              machineData = await fetchMachines();
              console.log('All machines fetched:', machineData);
            }
          } catch (operatorError) {
            console.log('Error fetching operator machines, falling back to all machines:', operatorError);
            machineData = await fetchMachines();
          }
        } else {
          console.log('No valid operator ID, fetching all machines');
          // Fallback to all machines if no operator ID found
          machineData = await fetchMachines();
        }
        
        if (!mounted) return;
        setMachines(machineData || []);
        if (machineData?.length && !selectedMachineId) {
          setSelectedMachineId(machineData[0].machine_id);
        }
      } catch (error) {
        console.log('Error in machine fetching:', error);
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

  useEffect(() => {
    if (selectedMachineId) {
      checkIfInputToday();
    }
  }, [selectedMachineId]);

  // Refresh input status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (selectedMachineId) {
        checkIfInputToday();
      }
    }, [selectedMachineId])
  );

  const checkIfInputToday = async () => {
    if (!selectedMachineId) return;
    
    setCheckingInputToday(true);
    try {
      // Get current operator ID
      const rawUser = await AsyncStorage.getItem('user');
      let operatorId: number | null = null;
      
      if (rawUser) {
        const user = JSON.parse(rawUser);
        operatorId = Number(user?.Account_id ?? user?.AccountId ?? user?.id);
        console.log('Checking input today for operator:', operatorId, 'machine:', selectedMachineId);
      }

      const inputs = await getWasteInputsByMachineId(selectedMachineId);
      console.log('All inputs for machine:', inputs);
      
      if (inputs && inputs.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter inputs by current operator if operator ID is available
        const operatorInputs = operatorId 
          ? inputs.filter((input: any) => {
              const inputAccountId = Number(input.Account_id);
              console.log('Input account ID:', inputAccountId, 'operator ID:', operatorId, 'match:', inputAccountId === operatorId);
              return inputAccountId === operatorId;
            })
          : inputs;
        
        console.log('Operator inputs:', operatorInputs);
        
        const hasTodayInput = operatorInputs.some((input: any) => {
          // Check multiple date fields for compatibility
          const dateFields = [input.created_at, input.Input_datetime, input.Created_at];
          const inputDate = dateFields.find(field => field) ? new Date(dateFields.find(field => field)!) : null;
          
          if (inputDate) {
            inputDate.setHours(0, 0, 0, 0);
            const isToday = inputDate.getTime() === today.getTime();
            console.log('Input date:', inputDate.toDateString(), 'is today:', isToday);
            return isToday;
          }
          return false;
        });
        
        console.log('Has input today:', hasTodayInput);
        setHasInputToday(hasTodayInput);
      } else {
        console.log('No inputs found for machine');
        setHasInputToday(false);
      }
    } catch (err) {
      console.error('Failed to check today input:', err);
      setHasInputToday(null);
    } finally {
      setCheckingInputToday(false);
    }
  };

  useEffect(() => {
    const shouldShow = (!checkingInputToday && hasInputToday === false) || hasSensorAlerts;
    setHasProcessAlert(shouldShow);
  }, [checkingInputToday, hasInputToday, hasSensorAlerts, setHasProcessAlert]);

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
        return (
          <View style={tw`relative`}>
            <Settings color={iconColor} size={iconSize} strokeWidth={1.5} />
            {!checkingInputToday && hasInputToday === false && (
              <View style={tw`absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center`}>
                <AlertCircle color="white" size={12} strokeWidth={2} />
              </View>
            )}
          </View>
        );
      case 'Process Sensors and Alerts':
        return (
          <View style={tw`relative`}>
            <Wifi color={iconColor} size={iconSize} strokeWidth={1.5} />
            {hasSensorAlerts && (
              <View style={tw`absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center`}>
                <AlertCircle color="white" size={12} strokeWidth={2} />
              </View>
            )}
          </View>
        );
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
      // Refresh the today input check after successful save and wait for completion
      await checkIfInputToday();
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
        return (
          <OProcessSensors
            machineId={selectedMachineId}
            onAlertStatusChange={setHasSensorAlerts}
          />
        );

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
            indicators={{
              'Process': (!checkingInputToday && hasInputToday === false) || hasSensorAlerts
            }}
          />
        </View>

        <TouchableOpacity
          style={tw`bg-primary rounded-md px-4 py-3 flex-row items-center justify-between self-start mb-6`}
          onPress={() => setMachineModalVisible(true)}
        >
          <View style={tw`flex-1`}>
            <Text style={tw`text-white font-bold text-[11px]`}>
              {selectedMachine?.Name ?? (machinesLoading ? 'Loading...' : 'Select machine')}
            </Text>
            {selectedMachine && (
              <Text style={tw`text-white/80 text-[9px] mt-1`}>
                {selectedMachine.IsOnline ? '🟢 Online' : '🔴 Offline'} • {selectedMachine.Status || 'Active'}
              </Text>
            )}
          </View>
          <ChevronDown color="white" size={12} strokeWidth={2} />
        </TouchableOpacity>

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
        machineName={selectedMachine?.Name}
      />

      {/* Machine Selection Modal */}
      <Modal
        visible={machineModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMachineModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMachineModalVisible(false)}>
          <View style={tw`flex-1 bg-black/35 justify-center items-center px-6`}>
            <TouchableWithoutFeedback>
              <View style={tw`bg-white rounded-2xl w-full max-w-sm p-6 shadow-lg`}>
                {/* Header */}
                <View style={tw`flex-row justify-between items-center mb-6`}>
                  <Text style={tw`text-[#2E523A] text-xl font-bold`}>Select Machine</Text>
                  <TouchableOpacity
                    onPress={() => setMachineModalVisible(false)}
                    style={tw`p-2`}
                  >
                    <X color="#88AB8E" size={20} strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                {/* Machine List */}
                <ScrollView style={tw`max-h-80`} showsVerticalScrollIndicator={false}>
                  {machinesLoading ? (
                    <Text style={tw`text-center text-gray-500 py-4`}>Loading machines...</Text>
                  ) : machines.length === 0 ? (
                    <Text style={tw`text-center text-gray-500 py-4`}>No machines assigned to you</Text>
                  ) : (
                    machines.map((machine) => (
                      <TouchableOpacity
                        key={machine.machine_id}
                        style={[
                          tw`p-4 rounded-xl border-2 mb-3`,
                          selectedMachineId === machine.machine_id
                            ? tw`border-[#88AB8E] bg-[#88AB8E]/10`
                            : tw`border-gray-200 bg-white`
                        ]}
                        onPress={() => {
                          setSelectedMachineId(machine.machine_id);
                          setMachineModalVisible(false);
                        }}
                      >
                        <View style={tw`flex-row justify-between items-start`}>
                          <View style={tw`flex-1`}>
                            <Text style={tw`text-[#2E523A] font-semibold text-base mb-1`}>
                              {machine.Name}
                            </Text>
                            <Text style={tw`text-gray-600 text-sm`}>
                              {machine.IsOnline ? '🟢 Online' : '🔴 Offline'} • {machine.Status || 'Active'}
                            </Text>
                          </View>
                          {selectedMachineId === machine.machine_id && (
                            <View style={tw`w-6 h-6 rounded-full bg-[#88AB8E] items-center justify-center`}>
                              <Text style={tw`text-white text-xs font-bold`}>✓</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
