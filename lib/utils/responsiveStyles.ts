import { StyleSheet } from 'react-native';
import { useResponsiveContext } from './ResponsiveContext';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export function useResponsiveStyle<T extends StyleSheet.NamedStyles<T>>(
  styleFactory: (props: { isSm: boolean; isMd: boolean; isLg: boolean }) => T
): T {
  const { isSm, isMd, isLg } = useResponsiveContext();
  return StyleSheet.create(styleFactory({ isSm, isMd, isLg }));
}

export function useResponsiveValue<T>(options: { sm: T; md?: T; lg?: T }): T {
  const { responsiveValue } = useResponsiveContext();
  return responsiveValue(options);
}

export function useResponsiveSpacing(size: keyof typeof spacing = 'md') {
  const { responsiveValue } = useResponsiveContext();
  const value = spacing[size];
  return responsiveValue({
    sm: value,
    md: value * 1.25,
    lg: value * 1.5,
  });
}

export function useResponsiveFontSize(size: keyof typeof fontSizes = 'md') {
  const { responsiveValue } = useResponsiveContext();
  const value = fontSizes[size];
  return responsiveValue({
    sm: value,
    md: value * 1.1,
    lg: value * 1.2,
  });
}
