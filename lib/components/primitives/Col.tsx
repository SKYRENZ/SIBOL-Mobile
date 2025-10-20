import React from 'react';
import { View, ViewProps } from 'react-native';

export default function Col({ children, style, ...rest }: ViewProps) {
  return (
    <View {...rest} style={[{ flexDirection: 'column' }, style]}>
      {children}
    </View>
  );
}