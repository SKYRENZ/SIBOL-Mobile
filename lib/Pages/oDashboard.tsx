import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import tw from '../utils/tailwind';
import { MaterialIcons } from '@expo/vector-icons';
import BottomNavbar from '../components/oBotNav';
import OMenu from '../components/oMenu';
import ResponsiveTaskCard from '../components/primitives/ResponsiveTaskCard';
import ResponsiveImage from '../components/primitives/ResponsiveImage';
import { useResponsiveStyle, useResponsiveFontSize } from '../utils/responsiveStyles';
import { useResponsiveContext } from '../utils/ResponsiveContext';

const MachineStatusDropdown: React.FC = () => {
  return (
    <View style={tw`flex-row items-center bg-primary rounded-md px-2 py-1`}>
      <Text style={tw`text-white font-semibold text-[10px] mr-1`}>
        SIBOL Machine 2
      </Text>
      <MaterialIcons name="arrow-drop-down" size={12} color="white" />
    </View>
  );
};

export default function ODashboard() {
  const [menuVisible, setMenuVisible] = useState(false);
  const { isSm, isMd, isLg } = useResponsiveContext();
  const screenHeight = Dimensions.get('window').height;
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
        <View style={tw`px-5 pt-6`}>
          <Text style={[tw`text-left`, styles.heading]}>
            Hello, User#436262!
          </Text>
          <Text style={[tw`text-left mt-1`, styles.subHeading]}>
            Welcome to SIBOL maintenance app!
          </Text>
        </View>

        {isRefreshing ? (
          <View style={tw`items-center justify-center py-24`}>
            <ActivityIndicator size="large" color="#2E523A" />
            <Text style={tw`text-[#2E523A] font-semibold text-base mt-2`}>
              Refreshing...
            </Text>
          </View>
        ) : (
          <>
            <View style={tw`mt-6 px-5`}>
              <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={styles.sectionTitle}>
                  Tasks and Reminders
                </Text>
                <TouchableOpacity>
                  <Text style={tw`text-primary text-sm`}>See All</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={tw`-mx-1`}
                contentContainerStyle={tw`px-1`}
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

            <View style={tw`mt-8 px-5`}>
              <Text style={styles.sectionTitle}>
                SIBOL Machines
              </Text>

              <View style={[tw`rounded-2xl border-3 border-[#AFC8AD] bg-[rgba(175,200,173,0.32)] mt-4`, 
                           isTallScreen && !isTrulySmallDevice && tw`p-6`, 
                           (!isTallScreen || isTrulySmallDevice) && tw`p-5`]}>
                <View style={tw`items-center mb-3`}>
                  <MachineStatusDropdown />
                </View>

                <View style={styles.machineImageContainer}>
                  <ResponsiveImage
                    source={require('../../assets/sibol-process.png')}
                    aspectRatio={1}
                    adaptToDeviceSize={true} 
                  />
                </View>

                <Text style={styles.machineStatusText}>
                  Sibol Machine 2 is in Stage 2: Anaerobic Digester. No problems found.
                </Text>
              </View>
            </View>

            <View style={tw`h-24`} />
          </>
        )}
      </ScrollView>

      <BottomNavbar 
        currentPage="Home" 
        onRefresh={handleRefresh}
        onMenuPress={() => setMenuVisible(true)}
      />
      {/* render operator menu overlay at page level so it covers screen with dim overlay */}
      <OMenu visible={menuVisible} onClose={() => setMenuVisible(false)} onNavigate={(route) => {
        // handle navigation if needed
        setMenuVisible(false);
      }} />
    </SafeAreaView>
  );
}
