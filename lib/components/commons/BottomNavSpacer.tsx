import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Must match your nav visual height: tw`h-20` = 80
const BOTTOM_NAV_BAR_HEIGHT = 80;

export default function BottomNavSpacer({ extra = 0 }: { extra?: number }) {
  const insets = useSafeAreaInsets();

  // ✅ extra safe-area only appears on devices that report a bottom inset
  const safeBottom = Math.max(insets.bottom, 0);

  return <View style={{ height: BOTTOM_NAV_BAR_HEIGHT + safeBottom + extra }} />;
}