import React from 'react';
import { View, ViewProps } from 'react-native';

export default function Row({ children, style, ...rest }: ViewProps) {
  return (
    <View {...rest} style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {children}
    </View>
  );
}