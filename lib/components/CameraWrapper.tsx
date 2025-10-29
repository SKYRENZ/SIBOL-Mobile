import React from 'react';
import { Platform, View, Text } from 'react-native';

let NativeModule: any = null;
if (Platform.OS !== 'web') {
  NativeModule = require('react-native-vision-camera');
}

const WebCamera: any = (props: any) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: '#333' }}>Camera not available on web</Text>
  </View>
);
WebCamera.getCameraPermissionStatus = async () => 'denied';
WebCamera.requestCameraPermission = async () => 'denied';

// Return an array from useCameraDevices on web so callers using .find won't crash
export const Camera = Platform.OS === 'web' ? WebCamera : NativeModule?.Camera;
export const useCameraDevices =
  Platform.OS === 'web'
    ? (() => [] as any[]) // <- empty array on web
    : NativeModule?.useCameraDevices;
export const getCameraPermissionStatus =
  Platform.OS === 'web' ? async () => 'denied' : NativeModule?.getCameraPermissionStatus;
export const requestCameraPermission =
  Platform.OS === 'web' ? async () => 'denied' : NativeModule?.requestCameraPermission;

export default {
  Camera,
  useCameraDevices,
  getCameraPermissionStatus,
  requestCameraPermission,
};