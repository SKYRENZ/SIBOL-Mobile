import { Platform, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

// Import expo-camera for native platforms
import { CameraView, useCameraPermissions } from 'expo-camera';

interface CameraWrapperProps {
  onCapture: (imageData: string) => void;
}

export const CameraWrapper = ({ onCapture }: CameraWrapperProps) => {
  // Web refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasWebPermission, setHasWebPermission] = useState(false);

  // Native camera refs
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (Platform.OS === 'web') {
      requestWebCameraAccess();
    }
  }, []);

  const requestWebCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      if (videoRef.current) {
        (videoRef.current as HTMLVideoElement).srcObject = stream;
        setHasWebPermission(true);
      }
    } catch (err: any) {
      console.error('Camera access error:', err?.name, err?.message);
      
      if (err?.name === 'NotAllowedError') {
        alert('Camera permission denied. Please allow camera access in browser settings.');
      } else if (err?.name === 'NotFoundError') {
        alert('No camera found on this device.');
      } else if (err?.name === 'NotReadableError') {
        alert('Camera is already in use by another application.');
      }
      
      setHasWebPermission(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || video.clientWidth;
    const height = video.videoHeight || video.clientHeight;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/png');
    onCapture(dataUrl);
  };

  // Web QR scanning loop
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let rafId: number | null = null;
    const scanFrame = () => {
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
          onCapture(canvas.toDataURL('image/png'));
          return;
        }
      }
      rafId = requestAnimationFrame(scanFrame);
    };

    rafId = requestAnimationFrame(scanFrame);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [hasWebPermission, onCapture]);

  // Native camera handler
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ 
          base64: true 
        });
        if (photo?.base64) {
          onCapture(`data:image/jpeg;base64,${photo.base64}`);
        }
      } catch (error) {
        console.error('Failed to take picture:', error);
      }
    }
  };

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
        backgroundColor: '#000'
      }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ 
            width: '100%', 
            height: '100%',
            objectFit: 'cover'
          }}
        />
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
      />
      
      <TouchableOpacity
        style={styles.captureButton}
        onPress={takePicture}
      >
        <View style={styles.captureButtonInner} />
      </TouchableOpacity>
    </View>
  );
};

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
});

// Export stubs for backwards compatibility
export const Camera = null;
export const getCameraPermissionStatus = async () => 'denied';
export const requestCameraPermission = async () => 'denied';
