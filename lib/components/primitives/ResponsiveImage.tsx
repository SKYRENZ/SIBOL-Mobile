import React from 'react';
import { Image, ImageProps, View, Dimensions } from 'react-native';
import { useResponsiveContext } from '../../utils/ResponsiveContext';

type Props = ImageProps & {
  aspectRatio?: number;
  maxWidthPercent?: number;
  heightAdjustment?: boolean;
  maxHeightPercent?: number;
  adaptToDeviceSize?: boolean;
};

export default function ResponsiveImage({ 
  aspectRatio = 16/9, 
  maxWidthPercent = 100, 
  heightAdjustment = false,
  maxHeightPercent = 30,
  adaptToDeviceSize = false,
  source,
  ...rest 
}: Props) {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  
  const { isSm, isMd, isLg } = useResponsiveContext();
  
  let finalWidthPercent = maxWidthPercent;
  let finalHeightPercent = maxHeightPercent;
  
  if (adaptToDeviceSize) {
    const isTallScreen = screenHeight > 800;
    const isVeryTallScreen = screenHeight > 850;
    const isTrulySmallDevice = isSm && screenHeight < 700;
    
    if (isSm) {
      finalWidthPercent = isTrulySmallDevice ? 30 : 40;
    } else if (isMd) {
      finalWidthPercent = isTallScreen ? 70 : 50;
    } else {
      finalWidthPercent = isTallScreen ? 65 : 55;
    }
    
    if (isTrulySmallDevice) {
      finalHeightPercent = 20;
    } else if (isVeryTallScreen) {
      finalHeightPercent = 25;
    } else if (isTallScreen) {
      finalHeightPercent = 35;
    } else {
      finalHeightPercent = 30;
    }
    
    heightAdjustment = true;
  }
  
  const widthByScreenWidth = Math.floor((screenWidth * finalWidthPercent) / 100);
  
  const heightByScreenHeight = heightAdjustment 
    ? Math.floor((screenHeight * finalHeightPercent) / 100) 
    : 0;
  
  const heightByAspectRatio = Math.floor(widthByScreenWidth / aspectRatio);
  
  const width = widthByScreenWidth;
  const height = heightAdjustment 
    ? Math.max(heightByAspectRatio, heightByScreenHeight)
    : heightByAspectRatio;

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