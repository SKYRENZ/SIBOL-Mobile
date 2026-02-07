import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
import Container from '../components/primitives/Container';
import { Bell } from 'lucide-react-native';
import { CameraWrapper } from '../components/CameraWrapper';
import { decodeQrFromImage } from '../utils/qrDecoder';
import { scanQr } from '../services/apiClient';
import { getMyPoints } from '../services/profileService';
import ChangePasswordModal from '../components/ChangePasswordModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Snackbar from '../components/commons/Snackbar'; // adjust path if needed
import { useResponsiveContext } from '../utils/ResponsiveContext';
import { DeviceEventEmitter } from 'react-native';

export default function HDashboard(props: any) {
  const navigation = useNavigation<any>();
  const { isSm, isMd } = useResponsiveContext();

  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<{ awarded: number; totalPoints: number } | null>(null);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ Add state for QRMessage modal
  const [showQRMessage, setShowQRMessage] = useState(false);
  const [qrMessageType, setQRMessageType] = useState<'success' | 'error'>('success');
  const [qrMessageData, setQRMessageData] = useState<{ points?: number; total?: number; message?: string }>({});

  const [rewardPoints, setRewardPoints] = useState<number>(0);
  const [totalKg, setTotalKg] = useState<number>(0);
  const [pointsLoading, setPointsLoading] = useState<boolean>(true);
  const [displayName, setDisplayName] = useState<string>('User');

  const cameraRef = useRef<any>(null);

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
      setRewardPoints(Number(data.points ?? 0));
      setTotalKg(Number(data.totalContributions ?? 0));
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

  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'error' as 'error' | 'success' | 'info',
  });

  const handleCapture = useCallback(async (captured: string) => {
    setSnackbar((s) => ({ ...s, visible: false })); // Hide snackbar before processing
    setIsProcessingScan(true);
    try {
      const qrString =
        Platform.OS === 'web' && typeof captured === 'string' && captured.startsWith('data:')
          ? await decodeQrFromImage(captured)
          : captured;

      const weight = parseFloat(String(qrString));
      if (!Number.isFinite(weight) || weight <= 0) throw new Error('Invalid QR payload');

      // Send to backend
      const result = await scanQr(qrString, weight);

      // Show success modal and update points
      setQRMessageType('success');
      setQRMessageData({ points: result?.awarded, total: result?.totalPoints });
      setShowQRMessage(true);
      if (typeof result?.totalPoints === 'number') setRewardPoints(result.totalPoints);
      if (typeof result?.totalContributions === 'number') setTotalKg(result.totalContributions);

      // ✅ Only close scanner on success
      setShowScanner(false);
    } catch (err: any) {
      console.log('QR scan failed', err);
      setSnackbar({
        visible: true,
        message: err?.message || 'Scan failed',
        type: 'error',
      });
      // ✅ Do NOT close the scanner here
    } finally {
      setIsProcessingScan(false);
    }
  }, []);

  // ✅ Fetch points on focus
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const loadPoints = async () => {
        try {
          const data = await getMyPoints();
          if (mounted) {
            setRewardPoints(Number(data.points ?? 0));
            setTotalKg(Number(data.totalContributions ?? 0));
          }
        } catch (err) {
          console.error('[hDashboard] Failed to load points', err);
        } finally {
          if (mounted) setPointsLoading(false);
        }
      };
      loadPoints();
      return () => {
        mounted = false;
      };
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
        const name = (first || last) ? `${first} ${last}`.trim() : username || email || 'User';
        setDisplayName(name);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const handleErrorDismiss = () => {
    setSnackbar((s) => ({ ...s, visible: false }));
    if (cameraRef.current?.resetScan) {
      cameraRef.current.resetScan();
    }
  };

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

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

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('sibol:scanSuccess', (result: any) => {
      if (typeof result?.totalPoints === 'number') setRewardPoints(result.totalPoints);
      if (typeof result?.totalContributions === 'number') setTotalKg(result.totalContributions);
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={[tw`flex-1 bg-white`, isSm ? tw`pt-[55px]` : tw`pt-[70px]`]}>
      <View style={tw`flex-1`}>
        <Container style={tw`shrink-0`}>
          {/* Header */}
          <View style={[isSm ? tw`mx-4 mb-4` : tw`mx-6 mb-6`]}>
            <View style={tw`flex-row justify-between items-center`}>
              <View>
                <Text style={[tw`font-bold text-[#2E523A]`, isSm ? tw`text-[14px] mb-[2px]` : tw`text-[22px] mb-1`]}>
                  Hi, {displayName}!
                </Text>
                <Text style={[tw`font-bold text-[#2E523A]`, isSm ? tw`text-[11px]` : tw`text-[13px]`]}>
                  Welcome to SIBOL Community.
                </Text>
              </View>
              <TouchableOpacity style={tw`p-2`} accessibilityLabel="Notifications">
                <Bell color="#2E523A" size={22} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Banner */}
          <View
            style={[
              tw`bg-transparent overflow-hidden rounded-[15px] flex-row items-center relative self-stretch`,
              isSm ? tw`h-[140px] mx-4 mb-4` : isMd ? tw`h-[180px] mx-6 mb-6` : tw`h-[150px] mx-6 mb-6`,
            ]}
          >
            <Image source={require('../../assets/gradient-bg.png')} style={tw`absolute w-full h-full rounded-[15px]`} />

            <View style={[tw`flex-1 justify-center z-10`, isSm ? tw`px-4 py-3` : tw`px-5 py-4`]}>
              <Text style={[tw`font-bold text-white mb-1`, isSm ? tw`text-[18px] leading-[22px]` : tw`text-[20px] leading-[26px]`]}>
                Practice Food Waste Segregation
              </Text>
              <Text style={[tw`text-white/90`, isSm ? tw`text-[11px] leading-[14px]` : tw`text-[13px] leading-[16px]`]}>
                Let our household be the sprout of change in our environment.
              </Text>
            </View>

            <Image
              source={require('../../assets/trashcan.png')}
              resizeMode="contain"
              style={[
                tw`z-20 -rotate-[15deg]`,
                isSm ? tw`w-[90px] h-[90px] mr-[10px] ml-[-20px]` : tw`w-[120px] h-[120px] mr-[15px] ml-[-30px]`,
              ]}
            />
          </View>

          {/* View Map card */}
          <View
            style={[
              tw`bg-white rounded-[15px] border border-black/25 flex-row justify-between items-center shadow-md`,
              isSm ? tw`p-2.5 mx-4 mb-4` : tw`p-4 mx-6 mb-4`,
            ]}
          >
            <Text style={[tw`font-semibold text-[#6C8770] flex-1`, isSm ? tw`text-[14px]` : tw`text-[16px]`]}>
              View the waste containers near you
            </Text>

            <TouchableOpacity
              style={[tw`bg-[#2E523A] rounded-lg self-end`, isSm ? tw`py-2 px-2.5` : tw`py-2.5 px-3`]}
              onPress={() => navigation.navigate('HMap')}
            >
              <Text style={tw`text-[11px] font-semibold text-white font-inter`}>View Map</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={[tw`flex-row justify-around items-center`, isSm ? tw`gap-4 mx-4 mb-1` : tw`gap-4 mx-6 mb-1`]}>
            <View style={[tw`flex-1 bg-white rounded-[15px] items-center justify-center shadow-sm`, isSm ? tw`min-h-[110px] p-3` : tw`min-h-[130px] p-4`]}>
              <View style={[tw`flex-row justify-center items-center`, isSm ? tw`gap-2` : tw`gap-3`]}>
                <View style={[tw`justify-center items-center overflow-hidden`, isSm ? tw`w-[30px] h-[30px] rounded-lg` : tw`w-[40px] h-[40px] rounded-[10px]`]}>
                  <View style={tw`w-full h-full rounded-lg bg-green-light justify-center items-center`}>
                    <Image
                      source={require('../../assets/sibol-points.png')}
                      resizeMode="contain"
                      style={isSm ? tw`w-[18px] h-[18px]` : tw`w-[22px] h-[22px]`}
                    />
                  </View>
                </View>

                {pointsLoading ? (
                  <ActivityIndicator size="small" color="#2E523A" />
                ) : (
                  <Text style={[tw`font-bold text-[#2E523A]`, isSm ? tw`text-[28px] leading-[28px]` : tw`text-[38px] leading-[38px]`]}>
                    {formatKg(totalKg)}
                  </Text>
                )}
              </View>

              <Text style={[tw`text-[#2E523A] text-center font-medium`, isSm ? tw`text-[11px] leading-[14px] mt-2.5` : tw`text-[12px] leading-[16px] mt-3`]}>
                Your total contribution
              </Text>
            </View>

            <View style={[tw`flex-1 bg-white rounded-[15px] items-center justify-center shadow-sm`, isSm ? tw`min-h-[110px] p-3` : tw`min-h-[130px] p-4`]}>
              <View style={[tw`flex-row justify-center items-center`, isSm ? tw`gap-2` : tw`gap-3`]}>
                <View style={[tw`justify-center items-center overflow-hidden`, isSm ? tw`w-[30px] h-[30px] rounded-lg` : tw`w-[40px] h-[40px] rounded-[10px]`]}>
                  <View style={tw`w-full h-full rounded-lg bg-green-light justify-center items-center`}>
                    <Image
                      source={require('../../assets/contributions.png')}
                      resizeMode="contain"
                      style={isSm ? tw`w-[18px] h-[18px]` : tw`w-[22px] h-[22px]`}
                    />
                  </View>
                </View>

                <Text style={[tw`font-bold text-[#2E523A]`, isSm ? tw`text-[28px] leading-[28px]` : tw`text-[38px] leading-[38px]`]}>
                  {rewardPoints}
                </Text>
              </View>

              <Text style={[tw`text-[#2E523A] text-center font-medium`, isSm ? tw`text-[11px] leading-[14px] mt-2.5` : tw`text-[12px] leading-[16px] mt-3`]}>
                Your reward points
              </Text>
            </View>
          </View>

          <View style={tw`w-[305px] self-center border-b border-[#2E523A] opacity-30 mb-6 mt-4`} />
        </Container>

        {/* ✅ Refresh overlay */}
        {isRefreshing && (
          <View style={tw`absolute inset-0 bg-white bg-opacity-90 items-center justify-center z-50`}>
            <ActivityIndicator size="large" color="#2E523A" />
            <Text style={tw`text-[#2E523A] font-semibold text-base mt-2`}>Refreshing...</Text>
          </View>
        )}

        {/* ✅ Camera Modal with Processing Overlay */}
        <Modal visible={showScanner} animationType="slide" onRequestClose={handleCloseScanner}>
          <View style={tw`flex-1 bg-black`}>
            <CameraWrapper
              ref={cameraRef}
              onCapture={handleCapture}
              setSnackbar={setSnackbar}
              isProcessingScan={isProcessingScan}
              active={showScanner}
            />

            <Snackbar visible={snackbar.visible} message={snackbar.message} type={snackbar.type} onDismiss={handleErrorDismiss} />

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

        <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-[80px]`}>
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

      <ChangePasswordModal visible={showChangePassword} onClose={() => setShowChangePassword(false)} requireChange={isFirstLogin} />
    </SafeAreaView>
  );
}

// format kg: show no decimals for integers, otherwise show up to 2 decimals without trailing zeros
const formatKg = (value?: number) => {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return '0kg';
  if (Number.isInteger(n)) return `${n}kg`;
  const rounded = Math.round(n * 100) / 100;
  return `${rounded.toFixed(2).replace(/\.?0+$/, '')} kg`;
};
