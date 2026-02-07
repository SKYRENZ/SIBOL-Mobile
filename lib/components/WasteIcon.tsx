import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface WasteIconProps {
  size?: number;
  color?: string;
}

const WasteIcon: React.FC<WasteIconProps> = ({ size = 28, color = '#355842' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      fill={color}
      d="M9 2L8 3H4V5H20V3H16L15 2H9ZM5 7V21C5 22.1 5.9 23 7 23H17C18.1 23 19 22.1 19 21V7H5ZM9 9H11V21H9V9ZM13 9H15V21H13V9Z"
    />
  </Svg>
);

export default WasteIcon;
