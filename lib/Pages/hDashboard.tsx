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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import BottomNavbar from '../components/hBotNav';
import HRewards from '../components/hRewards';
import QRMessage from '../components/QRMessage'; // ✅ Import QRMessage
import tw from '../utils/tailwind';
import { useResponsiveStyle, useResponsiveSpacing, useResponsiveFontSize } from '../utils/responsiveStyles';
import Container from '../components/primitives/Container';
import { Search, Bell } from 'lucide-react-native';
import { CameraWrapper } from '../components/CameraWrapper';
import HMenu from '../components/hMenu';
import { scanQr } from '../services/apiClient';
import { decodeQrFromImage } from '../utils/qrDecoder';
import useRewards from '../hooks/useRewards';

export default function Dashboard() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<{ awarded: number; totalPoints: number } | null>(null);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);
  
  // ✅ Add state for QRMessage modal
  const [showQRMessage, setShowQRMessage] = useState(false);
  const [qrMessageType, setQRMessageType] = useState<'success' | 'error'>('success');
  const [qrMessageData, setQRMessageData] = useState<{ points?: number; total?: number; message?: string }>({});

  // track which reward/category is selected (used by handleCategoryChange)
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  const handleOpenScanner = async () => {
    console.log('Opening scanner...');
    
    // Request camera permission on Android
    if (Platform.OS === 'android') {
      const result = await request(PERMISSIONS.ANDROID.CAMERA);
      if (result !== RESULTS.GRANTED) {
        Alert.alert('Permission Required', 'Camera permission is needed to scan QR codes.');
        return;
      }
    }
    
    setShowScanner(true);
  };

  const handleCloseScanner = () => {
    console.log('Closing scanner modal');
    setShowScanner(false);
    setIsProcessingScan(false);
  };

  const handleCapture = async (imageData: string) => {
    setIsProcessingScan(true);
    try {
      const decodedQr = await decodeQrFromImage(imageData);
      
      // ✅ Parse weight from QR code
      const weight = parseFloat(decodedQr);
      
      if (isNaN(weight) || weight <= 0) {
        throw new Error('Invalid QR code: must contain a positive number');
      }
      
      const response = await scanQr(decodedQr, weight);
      
      setScanResult({ awarded: response.awarded, totalPoints: response.totalPoints });
      
      // ✅ Close scanner and show success message
      handleCloseScanner();
      
      setTimeout(() => {
        setQRMessageType('success');
        setQRMessageData({ 
          points: response.awarded, 
          total: response.totalPoints 
        });
        setShowQRMessage(true);
      }, 300);
      
    } catch (error: any) {
      console.error('QR scan failed', error);
      handleCloseScanner();
      
      setTimeout(() => {
        const isDuplicate = error?.message?.includes('already scanned') || 
                           error?.payload?.message?.includes('already scanned');
        
        // ✅ Show error message in modal
        setQRMessageType('error');
        setQRMessageData({ 
          message: isDuplicate 
            ? 'This QR code has already been used. Each QR can only be scanned once.'
            : error?.message || 'Unable to process QR code. Please try again.'
        });
        setShowQRMessage(true);
      }, 300);
    } finally {
      setIsProcessingScan(false);
    }
  };

  const styles = useResponsiveStyle(({ isSm, isMd, isLg }) => ({
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

  // replace static rewards with live data
  const { rewards: liveRewards, loading: rewardsLoading, refresh: refreshRewards, redeem } = useRewards();

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
              View the waste containers near you
            </Text>
            <TouchableOpacity style={styles.mapButton}>
              <Text style={tw`text-[11px] font-semibold text-white font-inter`}>View Map</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{scanResult?.totalPoints?.toFixed(2) || '115.00'}</Text>
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

          <View style={tw`w-[305px] self-center border-b border-[#2E523A] opacity-30 mb-1 mt-4`} />

          <Text style={styles.sectionTitle}>Claim your rewards</Text>

          <View
            style={[
              tw`bg-[rgba(217,217,217,0.65)] rounded-[10px] flex-row items-center px-[15px]`,
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

        {/* ✅ Camera Modal with Processing Overlay */}
        <Modal 
          visible={showScanner} 
          animationType="slide" 
          onRequestClose={handleCloseScanner}
        >
          <View style={tw`flex-1 bg-black`}>
            <CameraWrapper onCapture={handleCapture} />
            
            {/* ✅ Processing overlay */}
            {isProcessingScan && (
              <View style={tw`absolute inset-0 bg-black bg-opacity-75 items-center justify-center`}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={tw`text-white text-lg mt-4`}>Processing QR code...</Text>
              </View>
            )}
            
            <TouchableOpacity 
              onPress={handleCloseScanner}
              style={tw`absolute top-12 right-6 bg-white px-4 py-2 rounded-full z-50`}
              disabled={isProcessingScan}
            >
              <Text style={tw`text-[14px] font-semibold text-black`}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* ✅ QR Message Modal (Success/Error) */}
        <QRMessage
          visible={showQRMessage}
          type={qrMessageType}
          points={qrMessageData.points}
          total={qrMessageData.total}
          message={qrMessageData.message}
          onClose={() => setShowQRMessage(false)}
        />

        <ScrollView 
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-[80px] px-4`} 
        >
          {/* pass live rewards and loading state */}
          <HRewards 
            rewards={liveRewards} 
            loading={rewardsLoading} 
            onRedeem={async (id: number, qty = 1) => {
              try {
                const res = await redeem(id, qty);
                // option: show toast/modal for success using res
                console.log('Redeem success', res);
                // refresh was performed in hook, but ensure UI refresh
                refreshRewards();
              } catch (err: any) {
                console.error('Redeem failed', err);
                // option: show error UI
              }
            }}
          />
        </ScrollView>
      </View>

      <View style={tw`absolute bottom-0 left-0 right-0 bg-white`}>
        <BottomNavbar onScan={handleOpenScanner} onMenuPress={() => setMenuVisible(true)} />
      </View>

      {/* HMenu overlay rendered at page level so it covers full screen */}
      <HMenu visible={menuVisible} onClose={() => setMenuVisible(false)} onNavigate={(route) => {
        // handle page navigation here if you have navigation available
        setMenuVisible(false);
      }} />
     </SafeAreaView>
   );
 }
