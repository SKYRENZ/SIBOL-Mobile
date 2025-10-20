import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

type BreakpointKeys = 'sm' | 'md' | 'lg';

const breakpoints: Record<BreakpointKeys, number> = {
  sm: 0,      // phones
  md: 768,    // tablets / large phones in landscape
  lg: 1024,   // large tablets
};

export function useResponsive() {
  const [width, setWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const handler = ({ window }: { window: { width: number } }) => setWidth(window.width);
    const subscription = Dimensions.addEventListener ? Dimensions.addEventListener('change', handler) : undefined;

    return () => {
      if (subscription && typeof (subscription as any).remove === 'function') {
        (subscription as any).remove();
      } else if ((Dimensions as any).removeEventListener) {
        (Dimensions as any).removeEventListener('change', handler);
      }
    };
  }, []);

  const isSm = width < breakpoints.md;
  const isMd = width >= breakpoints.md && width < breakpoints.lg;
  const isLg = width >= breakpoints.lg;

  function getBreakpoint(): BreakpointKeys {
    if (isLg) return 'lg';
    if (isMd) return 'md';
    return 'sm';
  }

  function responsiveValue<T>(values: Partial<Record<BreakpointKeys, T>> & { sm: T }): T {
    const bp = getBreakpoint();
    if (values[bp] !== undefined) return values[bp] as T;
    // fallback order: md -> lg -> sm
    if (bp === 'md' && values.sm !== undefined) return values.sm;
    if (bp === 'lg' && values.md !== undefined) return values.md!;
    return values.sm;
  }

  return { width, isSm, isMd, isLg, getBreakpoint, responsiveValue };
}