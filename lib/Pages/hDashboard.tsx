import React, { useState, useEffect } from 'react';
import { 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TextInput, 
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import BottomNavbar from '../components/hBotNav';
import HRewards from '../components/hRewards';
import tw from '../utils/tailwind';
import { useResponsiveStyle, useResponsiveSpacing, useResponsiveFontSize } from '../utils/responsiveStyles';
import Container from '../components/primitives/Container';
import { Search, Bell } from 'lucide-react-native';

// pang camera yung react-native-vision-camera
import { Camera, useCameraDevices } from 'react-native-vision-camera';

export default function Dashboard() {
  const [showScanner, setShowScanner] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const devices = useCameraDevices();
  const device = devices?.find(d => d.position === 'back') ?? devices?.[0];

  // checking ng camera permission upon load ng app
    useEffect(() => {
      checkPermission();
    }, []);
  
    // logs pangdebug lang this
    const checkPermission = async () => {
      const statusRaw = await Camera.getCameraPermissionStatus();
      const status = String(statusRaw);
      console.log('Current camera permission status:', statusRaw);
      setHasPermission(status === 'granted' || status === 'authorized');
    };

  const openDeviceSettings = async () => {
    if (Platform.OS === 'android') {
      // pangopen ng settings sa android
      await Linking.openSettings();
    }
  };

  const requestCameraPermission = async () => {
    try {
      const result = await request(PERMISSIONS.ANDROID.CAMERA);
      
      if (result === RESULTS.GRANTED) {
        setHasPermission(true);
        setShowScanner(true);
        setScannerActive(true);
        return true;
      } else if (result === RESULTS.DENIED) {

        setHasPermission(false);
        return false;
      } else if (result === RESULTS.BLOCKED) {

        Alert.alert(
          'Permission Required',
          'Camera access is blocked. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }
    } catch (error) {
      console.log('Permission request error:', error);
      return false;
    }
  };

    const handleOpenScanner = async () => {
      console.log('Opening scanner...');
      
      if (hasPermission === true) {
        setShowScanner(true);
        setScannerActive(true);
        return;
      }
      
      await requestCameraPermission();
    };

  const styles = useResponsiveStyle (({ isSm, isMd, isLg }) => ({
    safeArea: {
      flex: 1,
      backgroundColor: 'white',
      paddingTop: isSm ? 35 : 50,
    },
    staticContainer: {
      flexShrink: 0,
    },
    scrollArea: {
      flex: 1,
      minHeight: 200,
    },
    headerContainer: {
      marginBottom: isSm ? useResponsiveSpacing('md') : useResponsiveSpacing('lg'),
    },
    heading: {
      fontSize: isSm ? useResponsiveFontSize('sm') : useResponsiveFontSize('xl'),
      marginBottom: isSm ? 2 : useResponsiveSpacing('xs'),
    },
    subheading: {
      fontSize: isSm ? useResponsiveFontSize('xs') : useResponsiveFontSize('sm'),
    },
    bannerContainer: {
      backgroundColor: 'transparent',
      marginBottom: isSm ? useResponsiveSpacing('md') : useResponsiveSpacing('lg'),
      alignSelf: 'stretch',
      width: '100%',
      overflow: 'hidden',
      borderRadius: 15,
      height: isSm ? 140 : isMd ? 180 : 150,
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    },
    bannerImage: {
      width: '100%',
      height: '100%',
      borderRadius: 15,
      resizeMode: 'cover',
      position: 'absolute',
    },
    bannerContent: {
      flex: 1,
      paddingHorizontal: isSm ? 16 : 20,
      paddingVertical: isSm ? 12 : 16,
      justifyContent: 'center',
      zIndex: 1,
    },
    bannerTitle: {
      fontSize: isSm ? useResponsiveFontSize('md') : useResponsiveFontSize('lg'),
      fontWeight: 'bold',
      color: 'white',
      marginBottom: 6,
      lineHeight: isSm ? 22 : 26,
    },
    bannerSubtitle: {
      fontSize: isSm ? useResponsiveFontSize('xs') : useResponsiveFontSize('sm'),
      color: 'rgba(255,255,255,0.9)',
      lineHeight: isSm ? 14 : 16,
    },
    bannerIcon: {
      width: isSm ? 90 : 120,
      height: isSm ? 90 : 120,
      marginRight: isSm ? 10 : 15,
      marginLeft: isSm ? -20 : -30,
      zIndex: 2,
      transform: [{ rotate: '-15deg' }],
    },
    scheduleContainer: {
      backgroundColor: 'white',
      borderRadius: 15,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.25)',
      padding: isSm ? 10 : 15,
      marginBottom: useResponsiveSpacing('md'),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: useResponsiveSpacing('md'),
      marginBottom: useResponsiveSpacing('xs'),
      paddingHorizontal: isSm ? useResponsiveSpacing('sm') : 0,
      height: isSm ? 120 : 140,
    },
    sectionTitle: {
      fontSize: isSm ? useResponsiveFontSize('2xl') : isMd ? useResponsiveFontSize('3xl') : useResponsiveFontSize('4xl'),
      fontWeight: 'bold',
      color: '#2E523A',
      textAlign: 'center',
      marginBottom: isSm ? useResponsiveSpacing('md') : useResponsiveSpacing('lg'),
      marginTop: useResponsiveSpacing('md'),
    },
    scheduleText: {
      fontSize: isSm ? useResponsiveFontSize('sm') : useResponsiveFontSize('md'),
      color: '#6C8770',
      fontWeight: '600',
    },
    statCard: {
      flex: 1,
      backgroundColor: 'white',
      borderRadius: 15,
      padding: isSm ? 10 : 14,
      alignItems: 'stretch',
      justifyContent: 'center',
      borderWidth: 0,
      borderColor: 'transparent',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
      flexDirection: 'row',
    },
    statContent: {
      flex: 1,
      justifyContent: 'flex-start',
      paddingVertical: isSm ? 18 : 22,
    },
    statCardGreen: {
      backgroundColor: '#E8F0E6',
      borderColor: 'transparent',
      borderWidth: 0,
    },
    medalIcon: {
      width: isSm ? 50 : 60,
      height: isSm ? 50 : 60,
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
    },
    statNumber: {
      fontSize: isSm ? 40 : 48,
      fontWeight: 'bold',
      color: '#2E523A',
      marginBottom: 4,
      lineHeight: isSm ? 40 : 48,
    },
    statLabel: {
      fontSize: isSm ? useResponsiveFontSize('xs') : useResponsiveFontSize('xs'),
      color: '#6C8770',
      textAlign: 'left',
      lineHeight: isSm ? 14 : 18,
    },
    searchBar: {
      height: isSm ? 38 : 45,
      marginBottom: useResponsiveSpacing('md'),
    },
    mapButton: {
      backgroundColor: '#2E523A',
      paddingVertical: isSm ? 8 : 10,
      paddingHorizontal: isSm ? 10 : 12,
      borderRadius: 8,
      alignSelf: 'flex-end',
    },
  }));

  const rewards = [
    {
      id: 1,
      title: 'Organic Groceries Package',
      description: '50 points required',
      image: require('../../assets/grocery-package.png'),
    },
    {
      id: 2,
      title: 'Organic Groceries Package',
      description: '50 points required',
      image: require('../../assets/grocery-package.png'),
    },
    {
      id: 3,
      title: 'Organic Groceries Package',
      description: '50 points required',
      image: require('../../assets/grocery-package.png'),
    },
    {
      id: 4,
      title: 'Organic Groceries Package',
      description: '50 points required',
      image: require('../../assets/grocery-package.png'),
    },
    {
      id: 5,
      title: 'Organic Groceries Package',
      description: '50 points required',
      image: require('../../assets/grocery-package.png'),
    },
    {
      id: 6,
      title: 'Organic Groceries Package',
      description: '50 points required',
      image: require('../../assets/grocery-package.png'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[tw`flex-1`]}>
        <Container style={styles.staticContainer}>
          <View style={styles.headerContainer}>
            <View style={tw`flex-row justify-between items-center`}>
              <View>
                <Text style={[tw`font-bold text-[#2E523A]`, styles.heading]}>Hi, User#39239!</Text>
                <Text style={[tw`font-bold text-[#2E523A]`, styles.subheading]}>Welcome to SIBOL Community.</Text>
              </View>
              <TouchableOpacity style={tw`p-2`} accessibilityLabel="Notifications">
                <Bell color="#2E523A" size={22} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bannerContainer}>
            <Image
              source={require('../../assets/gradient-bg.png')}
              style={styles.bannerImage}
            />
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Practice Food Waste Segregation</Text>
              <Text style={styles.bannerSubtitle}>Let our household be the sprout of change in our environment.</Text>
            </View>
            <Image
              source={require('../../assets/trashcan.png')}
              style={styles.bannerIcon}
              resizeMode="contain"
            />
          </View>

          <View style={styles.scheduleContainer}>
            <Text style={[tw`font-semibold text-[#6C8770] flex-1`, styles.scheduleText]}>
              Practice Food Waste Segregation
            </Text>
            <TouchableOpacity style={styles.mapButton}>
              <Text style={tw`text-[11px] font-semibold text-white font-inter`}>Go Now</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>115</Text>
                <Text style={styles.statLabel}>Sibol Points</Text>
              </View>
              <View style={styles.medalIcon}>
                <Image
                  source={require('../../assets/medal.png')}
                  style={tw`w-full h-full`}
                  resizeMode="contain"
                />
              </View>
            </View>
            <View style={[styles.statCard, styles.statCardGreen]}>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>20</Text>
                <Text style={styles.statLabel}>Contributions</Text>
              </View>
              <View style={styles.medalIcon}>
                <Image
                  source={require('../../assets/medal.png')}
                  style={tw`w-full h-full`}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Claim your rewards</Text>

          <View
            style={[
              tw`bg-[rgba(217,217,217,0.65)] rounded-[15px] flex-row items-center px-[15px]`,
              styles.searchBar,
            ]}
          >
            <TextInput
              style={[
                tw`flex-1 font-semibold text-black`,
                { fontSize: useResponsiveFontSize('xs') },
              ]}
              placeholder="Search rewards"
              placeholderTextColor="rgba(0, 0, 0, 0.3)"
            />
            <Search size={16} color="black" strokeWidth={2} />
          </View>

          <View style={tw`w-[305px] self-center border-b border-[#2E523A] opacity-30 mb-8`} />
        </Container>

        <Modal 
          visible={showScanner} 
          animationType="slide" 
          onRequestClose={() => {
            console.log('Closing scanner modal');
            setShowScanner(false);
            setScannerActive(false);
          }}
        >
          <View style={tw`flex-1 bg-black`}>
            {device ? (
              <Camera
                style={tw`flex-1`}
                device={device}
                isActive={scannerActive}
                enableZoomGesture
              />
            ) : (
              <View style={tw`flex-1 justify-center items-center p-4`}>
                <Text style={tw`text-white text-center mb-4`}>
                  Camera initializing...
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              onPress={() => {
                setShowScanner(false);
                setScannerActive(false);
              }}
              style={tw`absolute top-6 right-6 bg-white p-2 rounded-full`}
            >
              <Text style={tw`text-[14px] font-semibold`}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <ScrollView 
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-[80px] px-4`} 
        >
          <HRewards rewards={rewards} />
        </ScrollView>
      </View>

      <View style={tw`absolute bottom-0 left-0 right-0 bg-white`}>
        <BottomNavbar onScan={handleOpenScanner} />
      </View>
    </SafeAreaView>
  );
}
