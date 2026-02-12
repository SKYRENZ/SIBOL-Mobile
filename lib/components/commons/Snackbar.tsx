import React, { useEffect } from 'react';
import { Animated, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Bell, AlertCircle, CheckCircle, Info } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SnackbarProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  type?: 'error' | 'success' | 'info';
  bottomOffset?: number; // ✅ add
}

const Snackbar: React.FC<SnackbarProps> = ({
  visible,
  message,
  onDismiss,
  duration = 3000,
  actionLabel,
  onAction,
  type = 'info',
  bottomOffset = 32, // ✅ add
}) => {
  const slideAnim = React.useRef(new Animated.Value(100)).current;

  // ✅ use safe-area insets to avoid being clipped by gesture / 3-button nav
  const insets = useSafeAreaInsets();
  // Provide a small Android fallback when inset is 0 (covers some 3-button nav cases)
  const androidFallback = Platform.OS === 'android' ? 12 : 0;
  const computedBottom = bottomOffset + Math.max(insets.bottom, androidFallback);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(slideAnim, { toValue: 100, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible, duration, onDismiss, slideAnim]);

  if (!visible) return null;

  let bgColor = '#323232';
  let IconComponent = Bell;
  if (type === 'error') { bgColor = '#E53935'; IconComponent = AlertCircle; }
  if (type === 'success') { bgColor = '#43A047'; IconComponent = CheckCircle; }
  if (type === 'info') { bgColor = '#323232'; IconComponent = Info; }

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: computedBottom, // ✅ use computed bottom that includes safe-area / android fallback
        left: 16,
        right: 16,
        backgroundColor: bgColor,
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 10,   // ✅ was 4
        transform: [{ translateY: slideAnim }],
        zIndex: 9999,    // ✅ was 1000
      }}
    >
      <IconComponent color="white" size={20} style={{ marginRight: 12 }} />
      <Text style={{ color: 'white', flex: 1 }}>
        {String(message || '')}
      </Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ color: '#FFD600', marginLeft: 16, fontWeight: 'bold' }}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export default Snackbar;