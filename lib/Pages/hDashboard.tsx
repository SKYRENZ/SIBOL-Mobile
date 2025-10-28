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
import tw from '../utils/tailwind';
import { useResponsiveStyle, useResponsiveSpacing, useResponsiveFontSize } from '../utils/responsiveStyles';
import Container from '../components/primitives/Container';
import CarbonRichContent from '../components/categories/CarbonRichContent';
import NitrogenRichContent from '../components/categories/NitrogenRichContent';
import SibolBinContent from '../components/categories/SibolBinContent';
import { Search, Bell } from 'lucide-react-native';

// pang camera yung react-native-vision-camera
import { Camera, useCameraDevices } from 'react-native-vision-camera';

export default function Dashboard() {
  const [selectedCategory, setSelectedCategory] = useState('Carbon-rich');
  const [showScanner, setShowScanner] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

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
      paddingTop: isSm ? 25 : 40,
    },
    staticContainer: {
      flexShrink: 0,
    },
    scrollArea: {
      flex: 1,
      minHeight: 200,
    },
    headerContainer: {
      marginBottom: isSm ? useResponsiveSpacing('xs') : useResponsiveSpacing('sm'),
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
      marginBottom: isSm ? useResponsiveSpacing('xs') : useResponsiveSpacing('md'),
      alignSelf: 'stretch',
      width: '100%',
      overflow: 'hidden',
      borderRadius: 15,
      height: isSm ? 80 : isMd ? 150 : 90,
      aspectRatio: 15.5,
    },
    bannerImage: {
      width: '100%',
      height: '100%',
      borderRadius: 15,
      resizeMode: 'contain',
      transform: [{ scale: 0.95 }],
    },
    sectionTitle: {
      fontSize: isSm ? useResponsiveFontSize('lg') : isMd ? useResponsiveFontSize('xl') : useResponsiveFontSize('2xl'),
      fontWeight: 'bold',
      color: '#2E523A',
      textAlign: 'center',
      marginBottom: isSm ? useResponsiveSpacing('sm') : useResponsiveSpacing('md'),
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
    scheduleText: {
      fontSize: isSm ? 11 : 13,
    },
    mapButton: {
      backgroundColor: '#2E523A',
      borderRadius: 15,
      paddingVertical: isSm ? 6 : 8,
      paddingHorizontal: isSm ? 12 : 16,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: isSm ? 'nowrap' : 'wrap',
      justifyContent: 'center',
      gap: useResponsiveSpacing('md'),
      alignSelf: 'center',
      width: '100%',
      maxWidth: isSm ? '100%' : 900,
    },
    categoryItem: {
      width: isSm ? 110 : isMd ? 160 : 180,
      height: isSm ? 129 : isMd ? 150 : 170,
      marginHorizontal: isSm ? 0 : useResponsiveSpacing('sm'),
    },
    searchBar: {
      height: isSm ? 38 : 45,
      marginBottom: useResponsiveSpacing('sm'),
    },
  }));

  const categories = [
    {
      key: 'Carbon-rich',
      label: 'Carbon-rich\nfoods',
      icon: require('../../assets/carbon-rich.png'),
      large: false,
    },
    {
      key: 'Nitrogen-rich',
      label: 'Nitrogen-rich\nfoods',
      icon: require('../../assets/nitrogen-rich.png'),
      large: false,
    },
    {
      key: 'SIBOL',
      label: 'All about SIBOL\nBin',
      icon: require('../../assets/sibol-bin.png'),
      large: true,
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
              source={require('../../assets/segregation.png')}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.scheduleContainer}>
            <Text style={[tw`font-semibold text-[#6C8770] flex-1`, styles.scheduleText]}>
              View available waste containers near you!
            </Text>
            <TouchableOpacity style={styles.mapButton}>
              <Text style={tw`text-[11px] font-semibold text-white font-inter`}>View Map</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>What to put in SIBOL Bin?</Text>

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
        placeholder="Search your food waste's category"
        placeholderTextColor="rgba(0, 0, 0, 0.3)"
        />
           <Search size={16} color="black" strokeWidth={2} />
        </View>

          <View style={[tw`mb-6`, styles.categoryGrid]}>
            {categories.map((category) => {
              const isSelected = selectedCategory === category.key;
              return (
                <TouchableOpacity
                  key={category.key}
                  onPress={() => handleCategoryChange(category.key)}
                  style={[
                    tw.style(
                      'items-center bg-white rounded-[20px] py-[10px]',
                      isSelected && 'shadow-lg border border-[rgba(175,200,173,0.61)]'
                    ),
                    styles.categoryItem
                  ]}
                >
                  <View
                    style={tw.style(
                      'w-[89px] h-[77px] bg-[rgba(175,200,173,0.61)] rounded-[15px] justify-center items-center mb-2',
                      isSelected && 'border-2 border-[rgba(175,200,173,0.61)]'
                    )}
                  >
                    <Image
                      source={category.icon}
                      style={tw.style(
                        category.large ? 'w-[80%] h-[80%]' : 'w-[65%] h-[65%]'
                      )}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={tw`text-[11px] font-semibold text-[#2E523A] text-center leading-[14px]`}>{category.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={tw`w-[305px] self-center border-b border-[#2E523A] opacity-30 mb-5`} />
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

        <View style={[styles.scrollArea]}>
          <ScrollView 
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tw`pb-[80px]`} 
          >
            {selectedCategory === 'Carbon-rich' && <CarbonRichContent />}
            {selectedCategory === 'Nitrogen-rich' && <NitrogenRichContent />}
            {selectedCategory === 'SIBOL' && <SibolBinContent />}
          </ScrollView>
        </View>
      </View>

      <View style={tw`absolute bottom-0 left-0 right-0 bg-white`}>
        <BottomNavbar onScan={handleOpenScanner} />
      </View>
    </SafeAreaView>
  );
}
