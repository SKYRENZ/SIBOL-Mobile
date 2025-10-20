import React from 'react';
import { View, Image, ImageProps, StyleSheet } from 'react-native';

type Props = ImageProps & {
  aspectRatio?: number;
  maxWidthPercent?: number; 
};

export default function ResponsiveImage({ aspectRatio = 16/9, style, maxWidthPercent = 100, ...rest }: Props) {
  return (
    <View style={[{ width: `${maxWidthPercent}%`, aspectRatio }]}>
      <Image {...rest} style={[StyleSheet.absoluteFill, { width: undefined, height: undefined }, style]} resizeMode="contain" />
    </View>
  );
}