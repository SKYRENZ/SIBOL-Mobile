import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import tw from '../utils/tailwind';
import { MaterialIcons } from '@expo/vector-icons';
import BottomNavbar from '../components/oBotNav';
import ResponsiveTaskCard from '../components/primitives/ResponsiveTaskCard';
import ResponsiveImage from '../components/primitives/ResponsiveImage';
import { useResponsiveStyle, useResponsiveFontSize } from '../utils/responsiveStyles';
import { useResponsiveContext } from '../utils/ResponsiveContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChangePasswordModal from '../components/ChangePasswordModal';

type RootStackParamList = {
  WiFiConnectivity: undefined;
  // Add other screens here as needed
};

interface MachineStatusDropdownProps {
  selectedMachine: string;
  onSelect: (machine: string) => void;
}

const MachineStatusDropdown: React.FC<MachineStatusDropdownProps> = ({ selectedMachine, onSelect }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const machineOptions = ['SIBOL Machine 2', 'SIBOL Machine 3', 'SIBOL Machine 4', 'SIBOL Machine 5'];
  const buttonRef = useRef<View>(null);
  const [dropdownPos, setDropdownPos] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });

  const handleSelect = (machine: string) => {
    onSelect(machine);
    setDropdownVisible(false);
  };

  const openDropdown = () => {
    if (buttonRef.current) {
      buttonRef.current.measureInWindow((x, y, width, height) => {
        setDropdownPos({ x, y, width, height });
        setDropdownVisible(true);
      });
    }
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <View
        ref={buttonRef}
        style={{ alignSelf: 'center' }}
      >
        <TouchableOpacity
          onPress={openDropdown}
          style={tw`flex-row items-center bg-primary rounded-md px-2 py-1`}
        >
          <Text style={tw`text-white font-semibold text-[11px] mr-1`}>
            {selectedMachine}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={14} color="white" />
        </TouchableOpacity>
      </View>
      {/* Use Modal for dropdown to overlay everything */}
      {dropdownVisible && (
        <Modal transparent animationType="none" visible={dropdownVisible} onRequestClose={() => setDropdownVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  position: 'absolute',
                  top: dropdownPos.y + dropdownPos.height,
                  left: dropdownPos.x,
                  width: dropdownPos.width,
                  zIndex: 100,
                }}
              >
                <View style={tw`bg-white rounded-md shadow-lg border border-gray-200`}>
                  {machineOptions.map((machine, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSelect(machine)}
                      style={tw`px-3 py-2 ${index === machineOptions.length - 1 ? '' : 'border-b border-gray-200'}`}
                    >
                      <Text
                        style={[
                          tw`text-[12px]`,
                          selectedMachine === machine
                            ? tw`text-primary`
                            : tw`text-gray-800`,
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
};

export default function ODashboard() {
  const [selectedMachine, setSelectedMachine] = useState('SIBOL Machine 2');
  const { isSm, isMd, isLg } = useResponsiveContext();
  const screenHeight = Dimensions.get('window').height;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showActivatePopup, setShowActivatePopup] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (!raw) return;
        const u = JSON.parse(raw);
        const first = u?.IsFirstLogin ?? u?.isFirstLogin ?? 0;
        if (first === 1 || first === '1' || first === true) {
          setIsFirstLogin(true);
          setShowChangePassword(true);
        }
      } catch (e) {}
    })();
  }, []);

  const isTallScreen = screenHeight > 800;
  const isTrulySmallDevice = isSm && screenHeight < 700;
  
  const styles = useResponsiveStyle(({ isSm, isMd, isLg }) => ({
    heading: {
      fontSize: isSm ? useResponsiveFontSize('lg') : useResponsiveFontSize('xl'),
      fontWeight: 'bold',
      color: '#4F6853',
    },
    subHeading: {
      fontSize: isSm ? useResponsiveFontSize('xs') : useResponsiveFontSize('sm'),
      fontWeight: '600',
      color: '#88AB8E',
    },
    sectionTitle: {
      fontSize: isSm ? useResponsiveFontSize('lg') : useResponsiveFontSize('xl'),
      fontWeight: 'bold',
      color: '#2E523A',
    },
    machineImageContainer: {
      alignItems: 'center',
      marginVertical: isTrulySmallDevice ? 2 : isTallScreen ? 24 : 14,
    },
    machineStatusText: {
      fontSize: isSm ? useResponsiveFontSize('xs') : isMd ? useResponsiveFontSize('sm') : useResponsiveFontSize('md'),
      fontWeight: 'bold',
      color: '#2E523A',
      textAlign: 'center',
      paddingHorizontal: isSm ? 16 : isMd ? 24 : 32,
      lineHeight: isSm ? 14 : isMd ? 18 : 22,
      paddingVertical: isTallScreen ? 12 : 0,
    },
    machineContainer: {
      rounded: true,
      borderWidth: 3,
      borderColor: '#AFC8AD',
      backgroundColor: 'rgba(175,200,173,0.32)',
      padding: isSm ? 16 : isTallScreen ? 24 : 20,
      marginTop: 16,
      height: isTallScreen ? 'auto' : undefined, 
    }
  }));
  
  const tasks = [
    {
      title: 'Change Filters',
      description: 'Change the stage 2 filters on SIBOL Machine 2',
      dueDate: 'Due: August 9, 2025',
    },
    {
      title: 'Change Sensor',
      description: 'Change the stage 2 filters on SIBOL Machine 2',
      dueDate: 'Due: August 9, 2025',
    },
    {
      title: 'Change Sensor',
      description: 'Change the stage 2 filters on SIBOL Machine 2',
      dueDate: 'Due: August 9, 2025',
    },
  ];

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        {/* Light green background section for header and tasks */}
        <View style={tw`bg-[#8FBB8F] px-5 pt-12 pb-6`}>
          <Text style={[tw`text-left text-white`, { fontSize: styles.heading.fontSize, fontWeight: 'bold' }]}>
            Hello, User#436262!
          </Text>
          <Text style={[tw`text-left mt-1 text-white`, { fontSize: styles.subHeading.fontSize, fontWeight: '600' }]}>
            Welcome to SIBOL maintenance app!
          </Text>
        </View>

        {isRefreshing ? (
          <View style={tw`items-center justify-center py-24 bg-[#8FBB8F]`}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={tw`text-white font-semibold text-base mt-2`}>
              Refreshing...
            </Text>
          </View>
        ) : (
          <>
            <View style={tw`bg-[#8FBB8F] px-5 pb-6`}>
              <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={[tw`text-white`, { fontSize: styles.sectionTitle.fontSize, fontWeight: 'bold' }]}>
                  Tasks and Reminders
                </Text>
                <TouchableOpacity>
                  <Text style={tw`text-white text-sm underline`}>See All</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={tw`mx-[-20px]`} 
                contentContainerStyle={tw`pl-5 pr-0`}
              >
                {tasks.map((task, index) => (
                  <ResponsiveTaskCard
                    key={index}
                    title={task.title}
                    description={task.description}
                    dueDate={task.dueDate}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={tw`w-full h-6 bg-white rounded-t-3xl`} />

            <View style={tw`bg-white pt-6 rounded-t-3xl self-center w-[94%]`}>
              <View style={tw`px-5 mb-4`}>
                <View style={tw`flex-row justify-between items-center w-full`}>
                  <Text style={[tw`text-[#2E523A]`, { fontSize: styles.sectionTitle.fontSize, fontWeight: 'bold' }]}>
                    SIBOL Machines
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setShowActivatePopup(true)}
                    style={tw`bg-primary p-2 rounded-full`}
                  >
                    <MaterialIcons name="add" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={tw`px-5 pt-4`}>
                <View style={tw`items-center mb-3`}>
                  <MachineStatusDropdown selectedMachine={selectedMachine} onSelect={setSelectedMachine} />
                </View>

                <View style={styles.machineImageContainer}>
                  <ResponsiveImage
                    source={require('../../assets/sibol-process.png')}
                    aspectRatio={1}
                    adaptToDeviceSize={true}
                  />
                </View>

                <Text style={styles.machineStatusText}>
                  {selectedMachine} is in Stage 2: Anaerobic Digester. No problems found.
                </Text>

                <View style={tw`h-24`} />
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <BottomNavbar
        currentPage="Home"
        onRefresh={handleRefresh}
      />

      {/* Activate SIBOL Machine Popup */}
      <Modal
        visible={showActivatePopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActivatePopup(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowActivatePopup(false)}>
          <View style={tw`flex-1 bg-black bg-opacity-50 justify-center items-center`}>
            <TouchableWithoutFeedback>
              <View style={tw`bg-white rounded-lg p-6 w-5/6 max-w-sm`}>
                <Text style={tw`text-lg font-semibold text-gray-800 mb-4 text-center`}>
                  Activate SIBOL Machine
                </Text>
                <Text style={tw`text-gray-600 mb-6 text-center`}>
                  Are you sure you want to activate a new SIBOL Machine?
                </Text>
                <View style={tw`flex-row justify-center space-x-4 mt-4`}>
                  <TouchableOpacity 
                    onPress={() => setShowActivatePopup(false)}
                    style={[
                      tw`px-6 py-2 rounded-md border border-gray-300 flex-1 max-w-[120px] items-center`,
                      { minWidth: 100 }
                    ]}
                  >
                    <Text style={tw`text-gray-700 font-medium`}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      setShowActivatePopup(false);
                      navigation.navigate('WiFiConnectivity');
                    }}
                    style={[
                      tw`bg-primary px-6 py-2 rounded-md flex-1 max-w-[120px] items-center`,
                      { minWidth: 100 }
                    ]}
                  >
                    <Text style={tw`text-white font-medium`}>Activate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        requireChange={isFirstLogin}
      />
    </SafeAreaView>
  );
}
