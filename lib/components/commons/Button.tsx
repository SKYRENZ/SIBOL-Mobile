import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import tw from '../../utils/tailwind';

interface ButtonProps {
  title?: string;
  onPress?: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  testID?: string;
}

const variantStyles = {
  primary: {
    container: tw`bg-primary py-4 rounded-[10px] items-center justify-center border-2 border-primary`,
    text: tw`text-[#FFFDF4] font-bold`,
    indicatorColor: '#FFFDF4',
  },
  ghost: {
    container: tw`bg-transparent py-4.5 rounded-[40px] items-center justify-center`,
    text: tw`text-primary font-medium`,
    indicatorColor: '#2E523A',
  },
  outline: {
    container: tw`border border-[#CBCAD7] py-4.5 rounded-[40px] items-center justify-center`,
    text: tw`text-primary font-medium`,
    indicatorColor: '#2E523A',
  },
  danger: {
    container: tw`bg-red-500 py-4.5 rounded-[40px] items-center justify-center`,
    text: tw`text-white font-medium`,
    indicatorColor: '#FFFFFF',
  },
};

export default function Button({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
  textStyle,
  testID,
}: ButtonProps) {
  const v = variantStyles[variant] ?? variantStyles.primary;
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.8}
      style={[
        v.container,
        isDisabled ? { opacity: 0.6 } : null,
        style as any,
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, // Ensure row layout
      ]}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
    >
      <Text style={[v.text, textStyle as any]}>
        {title}
      </Text>
      {loading ? (
        <ActivityIndicator color={v.indicatorColor} style={{ marginLeft: 8 }} />
      ) : null}
    </TouchableOpacity>
  );
}
