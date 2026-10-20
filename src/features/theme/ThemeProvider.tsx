import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  createThemeColors,
  DEFAULT_THEME_PRIMARY_COLOR,
  DEFAULT_THEME_MODE,
  type ThemeColors,
  type ThemeMode,
} from '@/constants/theme';
import {
  getThemeSettings,
  saveThemeSettings,
} from '@/database/themeRepository';

type ThemeContextValue = {
  colors: ThemeColors;
  isReady: boolean;
  mode: ThemeMode;
  primaryColor: string;
  reloadTheme: () => Promise<void>;
  saveTheme: (mode: ThemeMode, primaryColor: string) => Promise<void>;
  statusBarStyle: 'dark' | 'light';
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const db = useSQLiteContext();
  const [mode, setMode] = useState<ThemeMode>(DEFAULT_THEME_MODE);
  const [primaryColor, setPrimaryColor] = useState(
    DEFAULT_THEME_PRIMARY_COLOR,
  );
  const [isReady, setIsReady] = useState(false);

  const reloadTheme = useCallback(async () => {
    const settings = await getThemeSettings(db);
    setMode(settings.mode);
    setPrimaryColor(settings.primaryColor);
    setIsReady(true);
  }, [db]);

  useEffect(() => {
    let active = true;

    getThemeSettings(db)
      .then((settings) => {
        if (active) {
          setMode(settings.mode);
          setPrimaryColor(settings.primaryColor);
        }
      })
      .catch(() => {
        if (active) {
          setMode(DEFAULT_THEME_MODE);
          setPrimaryColor(DEFAULT_THEME_PRIMARY_COLOR);
        }
      })
      .finally(() => {
        if (active) {
          setIsReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, [db]);

  const saveTheme = useCallback(
    async (
      nextMode: ThemeMode,
      nextPrimaryColor: string,
    ) => {
      await saveThemeSettings(db, {
        mode: nextMode,
        primaryColor: nextPrimaryColor,
      });
      setMode(nextMode);
      setPrimaryColor(nextPrimaryColor);
    },
    [db],
  );

  const colors = useMemo(
    () => createThemeColors(mode, primaryColor),
    [mode, primaryColor],
  );
  const value = useMemo<ThemeContextValue>(
    () => ({
      colors,
      isReady,
      mode,
      primaryColor,
      reloadTheme,
      saveTheme,
      statusBarStyle: mode === 'night' ? 'light' : 'dark',
    }),
    [
      colors,
      isReady,
      mode,
      primaryColor,
      reloadTheme,
      saveTheme,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used inside ThemeProvider');
  }
  return context;
}

export function useOptionalAppTheme(): ThemeContextValue | null {
  return useContext(ThemeContext);
}

export function useThemedStyles<T>(
  factory: (colors: ThemeColors) => T,
): T {
  const { colors } = useAppTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
