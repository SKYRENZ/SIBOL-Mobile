import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Alert, ActivityIndicator, Modal, Platform, Text, View, DeviceEventEmitter } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import tw from '../utils/tailwind';
import { CameraWrapper } from './CameraWrapper';
import Snackbar from './commons/Snackbar';
import QRMessage from './QRMessage';
import { scanQr } from '../services/apiClient';

type ScanResultPayload = {
  awarded?: number;
  totalPoints?: number;
  totalContributions?: number;
};

type ScanContextValue = {
  openScanner: () => Promise<void>;
  closeScanner: () => void;
  isOpen: boolean;
};

const ScanContext = createContext<ScanContextValue | null>(null);

export function useScan() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScan must be used inside <ScanProvider>');
  return ctx;
}

/**
 * Global scanner modal (openable from any screen).
 * Emits DeviceEventEmitter event: 'sibol:scanSuccess' with backend response payload.
 */
export default function ScanProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessingScan, setIsProcessingScan] = useState(false);

  const cameraRef = useRef<any>(null);

  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'error' as 'error' | 'success' | 'info',
  });

  const [showQRMessage, setShowQRMessage] = useState(false);
  const [qrMessageType, setQRMessageType] = useState<'success' | 'error'>('success');
  const [qrMessageData, setQRMessageData] = useState<{ points?: number; total?: number; message?: string }>({});

  const openScanner = useCallback(async () => {
    if (Platform.OS === 'android') {
      const result = await request(PERMISSIONS.ANDROID.CAMERA);
      if (result !== RESULTS.GRANTED) {
        Alert.alert('Permission Required', 'Camera permission is needed to scan QR codes.');
        return;
      }
    }
    setIsOpen(true);
  }, []);

  const closeScanner = useCallback(() => {
    setIsOpen(false);
    setIsProcessingScan(false);
  }, []);

  const handleErrorDismiss = useCallback(() => {
    setSnackbar((s) => ({ ...s, visible: false }));
    if (cameraRef.current?.resetScan) cameraRef.current.resetScan();
  }, []);

  const handleCapture = useCallback(async (captured: { qr: string; qrImage?: string }) => {
    setSnackbar((s) => ({ ...s, visible: false }));
    setIsProcessingScan(true);

    try {
      const qrString = captured?.qr;
      const qrImage = captured?.qrImage;

      if (!qrString) throw new Error('Invalid QR payload');

      if (typeof __DEV__ !== 'undefined' ? __DEV__ : false) {
        console.log('[scan] captured', {
          qr: qrString,
          qrImage: qrImage ? { hasImage: true, length: qrImage.length } : { hasImage: false, length: 0 },
          platform: Platform.OS,
        });
      }

      const result: ScanResultPayload = await scanQr(qrString, undefined, qrImage, qrString);

      if (typeof __DEV__ !== 'undefined' ? __DEV__ : false) {
        console.log('[scan] backend response', result);
      }

      setQRMessageType('success');
      setQRMessageData({ points: result?.awarded, total: result?.totalPoints });
      setShowQRMessage(true);

      // Let screens update their UI if they want (dashboard points, etc.)
      DeviceEventEmitter.emit('sibol:scanSuccess', result);

      // close scanner on success
      setIsOpen(false);
    } catch (err: any) {
      if (typeof __DEV__ !== 'undefined' ? __DEV__ : false) {
        console.log('[scan] error', {
          message: err?.message,
          status: err?.status,
          payload: err?.payload,
        });
      }
      setSnackbar({
        visible: true,
        message: err?.message || 'Scan failed',
        type: 'error',
      });
      // keep scanner open on error
    } finally {
      setIsProcessingScan(false);
    }
  }, []);

  const value = useMemo<ScanContextValue>(
    () => ({ openScanner, closeScanner, isOpen }),
    [openScanner, closeScanner, isOpen]
  );

  return (
    <ScanContext.Provider value={value}>
      {children}

      <Modal visible={isOpen} animationType="slide" onRequestClose={closeScanner}>
        <View style={tw`flex-1 bg-black`}>
          <CameraWrapper
            ref={cameraRef}
            onCapture={handleCapture}
            setSnackbar={setSnackbar}
            isProcessingScan={isProcessingScan}
            active={isOpen}
          />

          <Snackbar
            visible={snackbar.visible}
            message={snackbar.message}
            type={snackbar.type}
            onDismiss={handleErrorDismiss}
          />

          {isProcessingScan && (
            <View style={tw`absolute inset-0 bg-black/75 items-center justify-center`}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={tw`text-white text-lg mt-4`}>Processing QR code...</Text>
            </View>
          )}

          <View style={tw`absolute top-12 right-6 z-50`}>
            <Text onPress={closeScanner} style={tw`bg-white px-4 py-2 rounded-full font-semibold`}>
              Close
            </Text>
          </View>
        </View>
      </Modal>

      <QRMessage
        visible={showQRMessage}
        type={qrMessageType}
        points={qrMessageData.points}
        total={qrMessageData.total}
        message={qrMessageData.message}
        onClose={() => setShowQRMessage(false)}
      />
    </ScanContext.Provider>
  );
}