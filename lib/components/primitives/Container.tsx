import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useResponsive } from '../../utils/useResponsive';

type Props = ViewProps & {
  maxWidth?: number | string;
  center?: boolean;
};

export default function Container({ children, style, maxWidth = '100%', center = false, ...rest }: Props) {
  const { responsiveValue } = useResponsive();
  const horizontalPadding = responsiveValue({ sm: 16, md: 24, lg: 32 });

  return (
    <View
      {...rest}
      style={[{ paddingHorizontal: horizontalPadding, maxWidth: maxWidth as any }, center && { alignSelf: 'center' }, style]}
    >
      {children}
    </View>
  );
}