import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import BottomNavbar from '../components/hBotNav';
import QRMessage from '../components/QRMessage';
import Leaderboard from '../components/Leaderboard';
import tw from '../utils/tailwind';
import { useResponsiveStyle, useResponsiveSpacing, useResponsiveFontSize } from '../utils/responsiveStyles';
import Container from '../components/primitives/Container';
import { Bell } from 'lucide-react-native';
import { CameraWrapper } from '../components/CameraWrapper';
import { decodeQrFromImage } from '../utils/qrDecoder';
import { scanQr } from '../services/apiClient';
import { getMyPoints } from '../services/profileService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HDashboard(props: any) {
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<{ awarded: number; totalPoints: number } | null>(null);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // ✅ Add state for QRMessage modal
  const [showQRMessage, setShowQRMessage] = useState(false);
  const [qrMessageType, setQRMessageType] = useState<'success' | 'error'>('success');
  const [qrMessageData, setQRMessageData] = useState<{ points?: number; total?: number; message?: string }>({});

  const [userPoints, setUserPoints] = useState<number>(0);
  const [pointsLoading, setPointsLoading] = useState<boolean>(true);
  const [displayName, setDisplayName] = useState<string>('User');

  const handleOpenScanner = async () => {
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await getMyPoints();
      setUserPoints(data.points);
    } catch (err) {
      console.error('[hDashboard] Failed to refresh points', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
    setIsProcessingScan(false);
  };

  const handleCapture = useCallback(async (captured: string) => {
    setIsProcessingScan(true);
    try {
      // If we ever receive an image dataURL (web legacy), decode it.
      // On native (expo camera) CameraWrapper already passes the decoded QR string.
      const qrString =
        Platform.OS === 'web' && typeof captured === 'string' && captured.startsWith('data:')
          ? await decodeQrFromImage(captured)
          : captured;

      // Parse QR payload (your QR contains weight "6")
      const weight = parseFloat(String(qrString));
      if (!Number.isFinite(weight) || weight <= 0) throw new Error('Invalid QR payload');

      // Send to backend
      const result = await scanQr(qrString, weight);

      // Show success modal and update points
      setQRMessageType('success');
      setQRMessageData({ points: result?.awarded, total: result?.totalPoints });
      setShowQRMessage(true);
      if (typeof result?.totalPoints === 'number') setUserPoints(result.totalPoints);
    } catch (err: any) {
      console.error('QR scan failed', err);
      setQRMessageType('error');
      setQRMessageData({ message: err?.message || 'Scan failed' });
      setShowQRMessage(true);
    } finally {
      setIsProcessingScan(false);
      setShowScanner(false);
    }
  }, [setIsProcessingScan, setShowScanner, setQRMessageType, setQRMessageData, setShowQRMessage, setUserPoints]);

  // ✅ Fetch points on mount
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const loadPoints = async () => {
        try {
          const data = await getMyPoints();
          // removed debug logs
          if (mounted) setUserPoints(Number(data.points ?? 0));
        } catch (err) {
          console.error('[hDashboard] Failed to load points', err);
        } finally {
          if (mounted) setPointsLoading(false);
        }
      };
      loadPoints();
      return () => { mounted = false; };
    }, [])
  );

  // Fetch display name on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (!raw) return;
        const u = JSON.parse(raw);
        const first = u?.FirstName ?? u?.firstName ?? '';
        const last = u?.LastName ?? u?.lastName ?? '';
        const username = u?.Username ?? u?.username ?? '';
        const email = u?.Email ?? u?.email ?? '';
        const name = (first || last) ? `${first} ${last}`.trim() : (username || email || 'User');
        setDisplayName(name);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const styles = useResponsiveStyle(({ isSm, isMd, isLg }) => ({
    safeArea: {
      flex: 1,
      backgroundColor: 'white',
      paddingTop: isSm ? 55 : 70,
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
      marginHorizontal: isSm ? useResponsiveSpacing('md') : useResponsiveSpacing('lg'),
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
      marginHorizontal: isSm ? useResponsiveSpacing('md') : useResponsiveSpacing('lg'),
      alignSelf: 'stretch',
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
      marginHorizontal: isSm ? useResponsiveSpacing('md') : useResponsiveSpacing('lg'),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: useResponsiveSpacing('md'),
      marginBottom: useResponsiveSpacing('xs'),
      marginHorizontal: isSm ? useResponsiveSpacing('md') : useResponsiveSpacing('lg'),
      paddingHorizontal: 0,
      alignItems: 'center', // center cards vertically
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
      flex: 1,
    },
    statCard: {
      flex: 1,
      backgroundColor: 'white',
      borderRadius: 15,
      minHeight: isSm ? 110 : 130, 
      padding: isSm ? 12 : 16,      // smaller padding
      alignItems: 'center',
      justifyContent: 'center', 
      borderWidth: 0,
      borderColor: 'transparent',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      flexDirection: 'column',
      position: 'relative',        // allow safe absolute positioning if needed
    },
    statContent: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: isSm ? 8 : 12,          // tighter gap so icons don't push text out
      marginBottom: 0,
    },
    statCardGreen: {
      backgroundColor: 'white',
      borderColor: 'transparent',
      borderWidth: 0,
    },
    medalIcon: {
      width: isSm ? 30 : 40,       // smaller icon container
      height: isSm ? 30 : 40,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',          // prevent image overflow
      borderRadius: isSm ? 8 : 10,
    },
    statIcon: {
      width: isSm ? 18 : 22,       // smaller icon size
      height: isSm ? 18 : 22,
      resizeMode: 'contain',
    },
    statNumber: {
      fontSize: isSm ? 28 : 38,    // reduced font sizes
      fontWeight: 'bold',
      color: '#2E523A',
      marginBottom: 2, 
      lineHeight: isSm ? 28 : 38,
    },
    statLabel: {
      fontSize: isSm ? 11 : 12,    // smaller label
      color: '#2E523A',
      textAlign: 'center',
      lineHeight: isSm ? 14 : 16,
      fontWeight: '500',
      marginTop: isSm ? 10 : 12, 
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



  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[tw`flex-1`]}>
        <Container style={styles.staticContainer}>
          <View style={styles.headerContainer}>
            <View style={tw`flex-row justify-between items-center`}>
              <View>
                <Text style={[tw`font-bold text-[#2E523A]`, styles.heading]}>Hi, {displayName}!</Text>
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
            <Text style={[tw`font-semibold text-[#6C8770]`, styles.scheduleText]}>
              View the waste containers near you
            </Text>
            <TouchableOpacity style={styles.mapButton}>
              <Text style={tw`text-[11px] font-semibold text-white font-inter`}>View Map</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={styles.medalIcon}>
                  <View style={[tw`rounded-lg bg-green-light justify-center items-center`, { width: '100%', height: '100%' }]}>
                    <Image
                      source={require('../../assets/sibol-points.png')}
                      style={[styles.statIcon, { resizeMode: 'contain' }]}
                    />
                  </View>
                </View>
                {/* ✅ Show live points or loading */}
                {pointsLoading ? (
                  <ActivityIndicator size="small" color="#2E523A" />
                ) : (
                  <Text style={styles.statNumber}>{userPoints.toFixed(2)}</Text>
                )}
              </View>
              <Text style={styles.statLabel}>Your total contribution</Text>
            </View>
            <View style={[styles.statCard, styles.statCardGreen]}>
              <View style={styles.statContent}>
                <View style={styles.medalIcon}>
                  <View style={[tw`rounded-lg bg-green-light justify-center items-center`, { width: '100%', height: '100%' }]}>
                    <Image
                      source={require('../../assets/contributions.png')}
                      style={[styles.statIcon, { resizeMode: 'contain' }]}
                    />
                  </View>
                </View>
                <Text style={styles.statNumber}>20</Text>
              </View>
              <Text style={styles.statLabel}>Your reward points</Text>
            </View>
          </View>

          <View style={tw`w-[305px] self-center border-b border-[#2E523A] opacity-30 mb-6 mt-4`} />
        </Container>

        {/* ✅ Refresh overlay */}
        {isRefreshing && (
          <View style={tw`absolute inset-0 bg-white bg-opacity-90 items-center justify-center z-50`}>
            <ActivityIndicator size="large" color="#2E523A" />
            <Text style={tw`text-[#2E523A] font-semibold text-base mt-2`}>
              Refreshing...
            </Text>
          </View>
        )}

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
          contentContainerStyle={tw`pb-[80px]`}
        >
          <Leaderboard
            brgyName="Brgy. 176-E"
            entries={[
              { rank: 1, name: 'Jacelyn Caratao', points: 120 },
              { rank: 2, name: 'Laurenz Listangco', points: 100 },
              { rank: 3, name: 'Karl Miranda', points: 95 },
            ]}
            userRank={1}
          />
        </ScrollView>
      </View>

      <View style={tw`absolute bottom-0 left-0 right-0 bg-white`}>
        <BottomNavbar onScan={handleOpenScanner} currentPage="Home" onRefresh={handleRefresh} />
      </View>
     </SafeAreaView>
   );
 }
