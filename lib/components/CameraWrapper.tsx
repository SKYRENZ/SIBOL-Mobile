import { Platform, View, TouchableOpacity, Text } from 'react-native';
import { useEffect, useRef, useState } from 'react';

interface CameraWrapperProps {
  onCapture: (imageData: string) => void;
}

export const CameraWrapper = ({ onCapture }: CameraWrapperProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState(false);

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
        setHasPermission(true);
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
      
      setHasPermission(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = (videoRef.current as HTMLVideoElement).videoWidth;
      canvas.height = (videoRef.current as HTMLVideoElement).videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current as HTMLVideoElement, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        onCapture(imageData);
      }
    }
  };

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
        <button 
          onClick={capturePhoto}
          style={{ 
            position: 'absolute',
            bottom: '30px',
            padding: '12px 24px',
            backgroundColor: '#2E523A',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Capture
        </button>
      </div>
    );
  }

  // Mobile - return null, let native camera handle it
  return null;
};

// Export stubs for mobile
export const Camera = null;
export const getCameraPermissionStatus = async () => 'denied';
export const requestCameraPermission = async () => 'denied';
