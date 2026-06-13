import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  darkColors,
  darkTiles,
  lightColors,
  lightTiles,
  type Palette,
  type TilePalette,
} from './index';

export type ThemeMode = 'light' | 'dark';

type ThemeState = {
  mode: ThemeMode;
  colors: Palette;
  tiles: TilePalette;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeState | undefined>(undefined);
const STORAGE_KEY = 'nabdh.theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'light' || v === 'dark') setMode(v);
    });
  }, []);

  const toggle = () => {
    setMode((m) => {
      const next = m === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  };

  const value: ThemeState = {
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
    tiles: mode === 'dark' ? darkTiles : lightTiles,
    toggle,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
