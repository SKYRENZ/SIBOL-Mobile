import React, { useEffect } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

interface SnackbarProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  duration?: number; // ms
  actionLabel?: string;
  onAction?: () => void;
  type?: 'error' | 'success' | 'info';
}

const Snackbar: React.FC<SnackbarProps> = ({
  visible,
  message,
  onDismiss,
  duration = 3000,
  actionLabel,
  onAction,
  type = 'info',
}) => {
  const slideAnim = React.useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        onDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  let bgColor = '#323232';
  if (type === 'error') bgColor = '#E53935';
  if (type === 'success') bgColor = '#43A047';
  if (type === 'info') bgColor = '#323232';

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 32,
        left: 16,
        right: 16,
        backgroundColor: bgColor,
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 4,
        transform: [{ translateY: slideAnim }],
        zIndex: 1000,
      }}
    >
      <Text style={{ color: 'white', flex: 1 }}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ color: '#FFD600', marginLeft: 16, fontWeight: 'bold' }}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export default Snackbar;