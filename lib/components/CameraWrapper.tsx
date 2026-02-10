import { Platform, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import jsQR from 'jsqr';

// Import expo-camera for native platforms
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface CameraWrapperProps {
  onCapture: (payload: { qr: string; qrImage?: string }) => void;
  setSnackbar?: (snackbar: { visible: boolean; message: string; type: 'error' | 'success' | 'info' }) => void;
  isProcessingScan?: boolean;
  active?: boolean; // <-- add this
}

export const CameraWrapper = forwardRef(({ onCapture, setSnackbar, isProcessingScan, active }: CameraWrapperProps, ref) => {
  // Web refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasWebPermission, setHasWebPermission] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  // ✅ Add flag to prevent multiple scans
  const hasScannedRef = useRef(false);

  // Native camera refs
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // ✅ Reset scan flag on mount (works for both web & native)
  useEffect(() => {
    hasScannedRef.current = false;
  }, []);

  // Reset scan flag when scanner is (re)opened
  useEffect(() => {
    if (active) {
      hasScannedRef.current = false;
    }
  }, [active]);

  useImperativeHandle(ref, () => ({
    resetScan: () => {
      hasScannedRef.current = false;
    }
  }));
  
  useEffect(() => {
    if (Platform.OS === 'web' && active) {
      // Force clear previous stream before requesting a new one
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      requestWebCameraAccess();
    }
  }, [active]);

  useEffect(() => {
    if (!active && Platform.OS === 'web') {
      setIsVideoReady(false);
      setHasWebPermission(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [active]);

  const requestWebCameraAccess = async () => {
    try {
      console.log('[Camera] Requesting web camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      console.log('[Camera] Got stream:', stream);
      
      if (videoRef.current) {
        const video = videoRef.current as HTMLVideoElement;
        video.srcObject = stream;
        
        // ✅ Wait for video to be ready
        video.onloadedmetadata = () => {
          console.log('[Camera] Video metadata loaded');
          video.play().then(() => {
            console.log('[Camera] Video playing');
            setHasWebPermission(true);
            setIsVideoReady(true);
          }).catch(err => {
            console.error('[Camera] Failed to play video:', err);
          });
        };
      }
    } catch (err: any) {
      console.error('Camera access error:', err?.name, err?.message);
      
      if (err?.name === 'NotAllowedError') {
        alert('Camera permission denied. Please allow camera access in browser settings.');
      } else if (err?.name === 'NotFoundError') {
        alert('No camera found on this device.');
      } else if (err?.name === 'NotReadableError') {
        alert('Camera is already in use by another application.');
      } else {
        alert(`Camera error: ${err?.message}`);
      }
      
      setHasWebPermission(false);
    }
  };

  // Web QR scanning loop
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!isVideoReady) return;

    hasScannedRef.current = false;

    let rafId: number | null = null;
    const scanFrame = () => {
      // ✅ Stop scanning if already scanned
      if (hasScannedRef.current) {
        return;
      }

      if (!hasWebPermission || !videoRef.current) {
        rafId = requestAnimationFrame(scanFrame);
        return;
      }

      const video = videoRef.current;
      if (video.readyState < 2) {
        rafId = requestAnimationFrame(scanFrame);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || video.clientWidth;
      canvas.height = video.videoHeight || video.clientHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        if (code?.data) {
          // ✅ Mark as scanned to prevent duplicate scans
          hasScannedRef.current = true;
          console.log('✅ QR detected, stopping scan loop');
          // ✅ Pass decoded string and image data URL
          if (!isProcessingScan) {
            const qrImage = canvas.toDataURL('image/jpeg', 0.8);
            onCapture({ qr: code.data, qrImage });
          }
          return;
        }
      }
      rafId = requestAnimationFrame(scanFrame);
    };

    rafId = requestAnimationFrame(scanFrame);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      // ✅ Stop video stream and clear srcObject
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null; // <-- add this line
      }
    };
  }, [hasWebPermission, isVideoReady, onCapture, isProcessingScan]);

  // WEB PLATFORM
  if (Platform.OS === 'web') {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%',
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ 
            width: '100%', 
            height: '100%',
            objectFit: 'cover',
            display: isVideoReady ? 'block' : 'none'
          }}
        />
        
        {/* ✅ Show loading text while camera initializes */}
        {!isVideoReady && (
          <div style={{
            position: 'absolute',
            color: 'white',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            Initializing camera...
          </div>
        )}
        
        {/* ✅ Simple instruction text */}
        {isVideoReady && (
          <div style={{
            position: 'absolute',
            bottom: '120px',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            zIndex: 10
          }}>
            Position QR code in view
          </div>
        )}
      </div>
    );
  }

  // NATIVE PLATFORM (Android/iOS)
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission is required</Text>
        <TouchableOpacity 
          onPress={requestPermission}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        // use the correct prop name expected by the CameraView typings
        onBarcodeScanned={async (event: any) => {
          try {
            if (hasScannedRef.current) return;

            // Only handle QR codes
            const rawType = String(event?.type || event?.nativeEvent?.type || '').toLowerCase();
            if (!rawType.includes('qr')) return;

            const data = event?.data || event?.nativeEvent?.data;
            if (!data) return;

            hasScannedRef.current = true;
            console.log('[Camera] QR scanned:', data);
            let qrImage: string | undefined;
            try {
              const picture = await cameraRef.current?.takePictureAsync({
                // Capture a URI first; we'll resize/compress before base64 to keep payload small
                base64: false,
                quality: 0.2,
                skipProcessing: true,
                exif: false,
              });

              if (picture?.uri) {
                // Resize to a reasonable width and compress; base64 after manipulation is much smaller.
                const manipulated = await manipulateAsync(
                  picture.uri,
                  [{ resize: { width: 640 } }],
                  { compress: 0.25, format: SaveFormat.JPEG, base64: true }
                );

                if (manipulated?.base64) {
                  qrImage = `data:image/jpeg;base64,${manipulated.base64}`;
                }
              }
            } catch (captureErr) {
              console.warn('[Camera] takePictureAsync failed', captureErr);
            }
            onCapture({ qr: String(data), qrImage });
          } catch (e) {
            console.error('[Camera] onBarcodeScanned error', e);
          }
        }}
      />
      
      {/* ✅ Simple instruction text for native */}
      <View style={styles.instructionOverlay}>
        <Text style={styles.instructionText}>Position QR code in view</Text>
      </View>

      {/* Shutter removed: auto-capture when QR detected */}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  // captureButton styles kept for backward compatibility but shutter removed
  captureButton: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: '#fff',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderWidth: 4,
    borderColor: '#e0e0e0',
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  instructionOverlay: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    pointerEvents: 'none',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

// Export stubs for backwards compatibility
export const Camera = null;
export const getCameraPermissionStatus = async () => 'denied';
export const requestCameraPermission = async () => 'denied';
