import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import tw from '../utils/tailwind';

type Props = {
  isActive: boolean;
  onClose: () => void;
};

function CameraNative({ isActive }: { isActive: boolean }) {
  // lazy-require so this module isn't imported on web
  // @ts-ignore
  const VC = require('react-native-vision-camera');
  const Camera = VC.Camera;
  const useCameraDevices = VC.useCameraDevices;
  const devices = useCameraDevices();
  const device = devices?.back ?? devices?.[0];

  if (!device) {
    return (
      <View style={tw`flex-1 justify-center items-center p-4`}>
        <Text style={tw`text-white`}>Camera initializing...</Text>
      </View>
    );
  }

  // @ts-ignore
  return <Camera style={tw`flex-1`} device={device} isActive={isActive} enableZoomGesture />;
}

function CameraWeb({ onClose }: { onClose: () => void }) {
  return (
    <View style={tw`flex-1 justify-center items-center p-6 bg-black`}>
      <Text style={tw`text-white mb-4 text-center`}>
        Camera not available via VisionCamera on web. Use the button below to take or upload a photo.
      </Text>
      {/* @ts-ignore: using native DOM input in react-native-web */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e: any) => {
          console.log('selected file', e?.target?.files?.[0]);
          // forward file to app logic if needed
        }}
        style={{ display: 'block', marginBottom: 12 }}
      />
      <TouchableOpacity onPress={onClose} style={tw`bg-white p-2 rounded`}>
        <Text style={tw`font-semibold`}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CameraWrapper({ isActive, onClose }: Props) {
  if (Platform.OS === 'web') {
    return <CameraWeb onClose={onClose} />;
  }
  return <CameraNative isActive={isActive} />;
}