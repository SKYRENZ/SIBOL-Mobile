import React, { createContext, useContext } from 'react';
import { useResponsive } from './useResponsive';

type ResponsiveContextType = ReturnType<typeof useResponsive>;

const ResponsiveContext = createContext<ResponsiveContextType | null>(null);

export function ResponsiveProvider({ children }: { children: React.ReactNode }) {
  const responsive = useResponsive();
  return (
    <ResponsiveContext.Provider value={responsive}>
      {children}
    </ResponsiveContext.Provider>
  );
}

export function useResponsiveContext() {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsiveContext must be used within a ResponsiveProvider');
  }
  return context;
}