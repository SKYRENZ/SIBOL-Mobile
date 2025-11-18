import { Platform, View, TouchableOpacity, Text } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

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

  useEffect(() => {
    let rafId: number | null = null;
    const scanFrame = () => {
      if (!hasPermission || !videoRef.current) {
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
  }, [hasPermission, onCapture]);

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

  // Mobile - return null, let native camera handle it
  return null;
};

// Export stubs for mobile
export const Camera = null;
export const getCameraPermissionStatus = async () => 'denied';
export const requestCameraPermission = async () => 'denied';
