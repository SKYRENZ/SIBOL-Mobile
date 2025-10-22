import React from 'react';
import { Image, ImageProps, View, Dimensions } from 'react-native';

type Props = ImageProps & {
  aspectRatio?: number;
  maxWidthPercent?: number;
};

export default function ResponsiveImage({ 
  aspectRatio = 16/9, 
  maxWidthPercent = 100, 
  source,
  ...rest 
}: Props) {
  const screenWidth = Dimensions.get('window').width;
  const width = Math.floor((screenWidth * maxWidthPercent) / 100);
  const height = Math.floor(width / aspectRatio);

  console.log('ResponsiveImage props rest:', rest);
  return (
    <View style={{ width, height }}>
      <Image
        source={source}
        style={{ width, height }}
        resizeMode="contain"
        {...rest}
      />
    </View>
  );
}