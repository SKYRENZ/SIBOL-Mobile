import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
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
          // don't mark resolved yet — start polling to pick up a user saved shortly after mount
          setResolved(false);
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
        setResolved(false);
      }
    })();
  }, []);

  // Poll for user if not resolved (handles case where login writes user after provider mounted)
  useEffect(() => {
    if (resolved) return;
    let attempts = 0;
    const maxAttempts = 20; // 20 * 500ms = 10s
    const id = setInterval(async () => {
      attempts += 1;
      try {
        const raw = await AsyncStorage.getItem('user');
        if (raw) {
          const user = JSON.parse(raw);
          const rnum = user?.Roles ?? user?.role ?? null;
          console.debug('MenuProvider: detected delayed user', { user, rnum });
          if (rnum === 3 || String(rnum).toLowerCase() === 'operator') setRole('operator');
          else setRole('household');
          setResolved(true);
          clearInterval(id);
        } else if (attempts >= maxAttempts) {
          console.debug('MenuProvider: polling gave up, no user found');
          setResolved(true);
          clearInterval(id);
        }
      } catch (e) {
        console.warn('MenuProvider: polling error', e);
        if (attempts >= maxAttempts) {
          setResolved(true);
          clearInterval(id);
        }
      }
    }, 500);

    return () => clearInterval(id);
  }, [resolved]);

  const openMenu = () => {
    console.debug('MenuProvider: openMenu called', { role, resolved });
    setIsOpen(true);
  };

  const closeMenu = () => {
    console.debug('MenuProvider: closeMenu called');
    setIsOpen(false);
  };

  const toggleMenu = () => setIsOpen(v => !v);

  const navigation = useNavigation();

  // Auto-close menu when navigation happens to avoid menu overlaying new screens
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      setIsOpen(false);
    });
    return unsubscribe;
  }, [navigation]);

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
