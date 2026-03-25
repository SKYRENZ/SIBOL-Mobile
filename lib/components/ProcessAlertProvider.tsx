import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProcessAlertContextValue {
  hasProcessAlert: boolean;
  setHasProcessAlert: (value: boolean) => void;
}

const ProcessAlertContext = createContext<ProcessAlertContextValue | null>(null);

export function ProcessAlertProvider({ children }: { children: ReactNode }) {
  const [hasProcessAlert, setHasProcessAlert] = useState(false);
  return (
    <ProcessAlertContext.Provider value={{ hasProcessAlert, setHasProcessAlert }}>
      {children}
    </ProcessAlertContext.Provider>
  );
}

export function useProcessAlert() {
  const context = useContext(ProcessAlertContext);
  if (!context) {
    throw new Error('useProcessAlert must be used within ProcessAlertProvider');
  }
  return context;
}
