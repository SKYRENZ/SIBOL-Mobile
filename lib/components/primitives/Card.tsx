import React from 'react';
import { View, ViewProps } from 'react-native';
import tw from '../../utils/tailwind';

export default function Card({ children, style, ...rest }: ViewProps) {
  return (
    <View {...rest} style={[tw`bg-white rounded-lg p-4 shadow`, style]}>
      {children}
    </View>
  );
}