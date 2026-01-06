import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HMenu from './hMenu';
import OMenu from './oMenu';

type MenuRole = 'household' | 'operator' | null;

type MenuContextValue = {
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  isOpen: boolean;
  role: MenuRole;
  setRole: (r: MenuRole) => void;
};

const MenuContext = createContext<MenuContextValue | undefined>(undefined);

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<MenuRole>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    // Read stored user from AsyncStorage and determine role
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (!raw) {
          console.debug('MenuProvider: no stored user found');
          setRole(null);
          setResolved(true);
          return;
        }

        const user = JSON.parse(raw);
        const rnum = user?.Roles ?? user?.role ?? null;
        console.debug('MenuProvider: loaded user from storage', { user, rnum });

        // Heuristic: if numeric Roles === 3 treat as operator, otherwise household
        // Adjust mapping here if your roles use different ids.
        if (rnum === 3 || String(rnum).toLowerCase() === 'operator') setRole('operator');
        else setRole('household');
        setResolved(true);
      } catch (err) {
        console.warn('MenuProvider: failed to read user role', err);
        setRole(null);
        setResolved(true);
      }
    })();
  }, []);

  const openMenu = () => setIsOpen(true);
  const closeMenu = () => setIsOpen(false);
  const toggleMenu = () => setIsOpen(v => !v);

  return (
    <MenuContext.Provider value={{ openMenu, closeMenu, toggleMenu, isOpen, role, setRole }}>
      {children}
      {/* Render the correct menu globally based on role. Skip until resolved. */}
      {resolved && role === 'household' && (
        <HMenu visible={isOpen} onClose={closeMenu} />
      )}

      {resolved && role === 'operator' && (
        <OMenu visible={isOpen} onClose={closeMenu} />
      )}
    </MenuContext.Provider>
  );
};

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu must be used within MenuProvider');
  return ctx;
}

export default MenuProvider;
