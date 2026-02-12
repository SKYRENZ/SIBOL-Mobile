import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HMenu from './hMenu';
import OMenu from './oMenu';
import { getMyProfile } from '../services/profileService';

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
  const [user, setUser] = useState<any | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    // Read stored user from AsyncStorage and determine role
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (!raw) {
          console.debug('MenuProvider: no stored user found');
          setRole(null);
          setUser(null);
          setResolved(false); // allow polling to run
          return;
        }

        const user = JSON.parse(raw);
        console.debug('MenuProvider: loaded user from storage', { user });

        // ensure we have latest profile image — if missing, fetch backend and merge
        const hasImage =
          user?.Profile_image_path ||
          user?.ProfileImage ||
          user?.Image_path ||
          user?.imagePath ||
          user?.image_path ||
          user?.profile_image_path;
        if (!hasImage) {
          try {
            const p = await getMyProfile();
            const img =
              p?.imagePath ||
              p?.raw?.Profile_image_path ||
              p?.raw?.Image_path ||
              p?.raw?.image_path ||
              null;
            if (img) {
              user.Profile_image_path = img;
              user.ProfileImage = img;
              user.Image_path = img;
              user.imagePath = img;
              user.image_path = img;
              user.profile_image_path = img;
              // persist merged user so subsequent opens use it immediately
              await AsyncStorage.setItem('user', JSON.stringify(user));
              console.debug('MenuProvider: merged profile image into stored user');
            }
          } catch (err) {
            console.debug('MenuProvider: failed to fetch profile for image merge', err);
          }
        }

        // store full user for menus to consume
        setUser(user);

        const r = user?.Roles ?? user?.role ?? null;
        const rnum = Number(r);
        if (!Number.isNaN(rnum)) {
          setRole(rnum === 3 ? 'operator' : 'household');
        } else if (String(r)?.toLowerCase?.() === 'operator') {
          setRole('operator');
        } else {
          setRole('household');
        }
        setResolved(true);
      } catch (err) {
        console.warn('MenuProvider: failed to read user role', err);
        setRole(null);
        setUser(null);
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
          // update stored user and role
          setUser(user);
          const r = user?.Roles ?? user?.role ?? null;
          const rnum = Number(r);
          console.debug('MenuProvider: detected delayed user', { user, r });
          if (!Number.isNaN(rnum)) {
            setRole(rnum === 3 ? 'operator' : 'household');
          } else if (String(r)?.toLowerCase?.() === 'operator') {
            setRole('operator');
          } else {
            setRole('household');
          }
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

  // Refresh role from storage when opening the menu so the menu matches the current user
  const openMenu = async () => {
    try {
      const raw = await AsyncStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        // if stored user has no image, fetch profile and merge (handles fresh login)
        const hasImage =
          user?.Profile_image_path ||
          user?.ProfileImage ||
          user?.Image_path ||
          user?.imagePath ||
          user?.image_path ||
          user?.profile_image_path;
        if (!hasImage) {
          try {
            const p = await getMyProfile();
            const img = p?.imagePath ?? p?.raw?.Profile_image_path ?? p?.raw?.Image_path ?? p?.raw?.image_path ?? null;
            if (img) {
              user.Profile_image_path = img;
              user.ProfileImage = img;
              user.Image_path = img;
              user.imagePath = img;
              user.image_path = img;
              user.profile_image_path = img;
              await AsyncStorage.setItem('user', JSON.stringify(user));
            }
          } catch (err) {
            console.debug('MenuProvider: openMenu failed to fetch profile image', err);
          }
        }
        setUser(user);
        const r = user?.Roles ?? user?.role ?? null;
        const rnum = Number(r);
        if (!Number.isNaN(rnum)) setRole(rnum === 3 ? 'operator' : 'household');
        else if (String(r)?.toLowerCase?.() === 'operator') setRole('operator');
        else setRole('household');
        setResolved(true);
      } else {
        setRole(null);
        setUser(null);
      }
    } catch (err) {
      console.warn('MenuProvider: openMenu failed to read user', err);
    } finally {
      console.debug('MenuProvider: openMenu called', { role, resolved });
      setIsOpen(true);
    }
  };

  const closeMenu = () => {
    console.debug('MenuProvider: closeMenu called');
    setIsOpen(false);
  };

  const toggleMenu = () => setIsOpen(v => !v);

  return (
    <MenuContext.Provider value={{ openMenu, closeMenu, toggleMenu, isOpen, role, setRole }}>
      {children}
      {/* Render the correct menu globally based on role. Skip until resolved. */}
      {resolved && role === 'household' && (
        <HMenu visible={isOpen} onClose={closeMenu} user={user} />
      )}

      {resolved && role === 'operator' && (
        <OMenu visible={isOpen} onClose={closeMenu} user={user} />
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
