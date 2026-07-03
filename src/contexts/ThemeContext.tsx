import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';

import {
  themes,
  type ThemeColors,
  type ThemeMode,
  type ThemeName,
} from '../theme';

const THEME_NAME_KEY = 'st_theme_name';
const THEME_MODE_KEY = 'st_theme_mode';

interface ThemeContextValue {
  themeName: ThemeName;
  themeMode: ThemeMode;
  colors: ThemeColors;
  toggleThemeName: () => Promise<void>;
  toggleThemeMode: () => Promise<void>;
  setThemeName: (themeName: ThemeName) => Promise<void>;
  setThemeMode: (themeMode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isThemeName(value: string | null): value is ThemeName {
  return value === 'ocean' || value === 'nature';
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>('ocean');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    async function loadTheme() {
      const storedThemeName = await SecureStore.getItemAsync(THEME_NAME_KEY);
      const storedThemeMode = await SecureStore.getItemAsync(THEME_MODE_KEY);

      if (isThemeName(storedThemeName)) {
        setThemeNameState(storedThemeName);
      }

      if (isThemeMode(storedThemeMode)) {
        setThemeModeState(storedThemeMode);
      }
    }

    void loadTheme();
  }, []);

  const setThemeName = async (nextThemeName: ThemeName) => {
    setThemeNameState(nextThemeName);
    await SecureStore.setItemAsync(THEME_NAME_KEY, nextThemeName);
  };

  const setThemeMode = async (nextThemeMode: ThemeMode) => {
    setThemeModeState(nextThemeMode);
    await SecureStore.setItemAsync(THEME_MODE_KEY, nextThemeMode);
  };

  const toggleThemeName = async () => {
    await setThemeName(themeName === 'ocean' ? 'nature' : 'ocean');
  };

  const toggleThemeMode = async () => {
    await setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeName,
      themeMode,
      colors: themes[themeName][themeMode],
      toggleThemeName,
      toggleThemeMode,
      setThemeName,
      setThemeMode,
    }),
    [themeName, themeMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
}