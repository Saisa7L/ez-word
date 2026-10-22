import { Stack, usePathname } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFeedbackProvider } from '@/components/AppFeedbackProvider';
import { colors as defaultColors, type ThemeColors } from '@/constants/theme';
import { DATABASE_NAME, migrateDatabase } from '@/database/database';
import { DailyTaskProvider } from '@/features/daily-task/DailyTaskProvider';
import {
  ThemeProvider,
  useAppTheme,
  useOptionalAppTheme,
} from '@/features/theme/ThemeProvider';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  completeNavigationLock,
  isNavigationLocked,
} from '@/utils/backNavigation';
import { normalizeAppError } from '@/utils/appError';
import { logger } from '@/utils/logger';
import { backOnce, canGoBack } from '@/utils/navigationActions';

export default function RootLayout() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        onInit={migrateDatabase}
        useSuspense
      >
        <ThemeProvider>
          <DailyTaskProvider>
            <ThemedApp />
          </DailyTaskProvider>
        </ThemeProvider>
      </SQLiteProvider>
    </Suspense>
  );
}

function ThemedApp() {
  const { statusBarStyle } = useAppTheme();
  const reduceMotion = useReducedMotion();

  return (
    <>
      <StatusBar style={statusBarStyle} />
      <AppFeedbackProvider>
        <HardwareBackController />
        <Stack
          screenOptions={{
            animation: reduceMotion ? 'none' : 'default',
            headerShown: false,
          }}
        />
      </AppFeedbackProvider>
    </>
  );
}

function HardwareBackController() {
  const pathname = usePathname();

  useEffect(() => {
    completeNavigationLock();
  }, [pathname]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (isNavigationLocked()) {
          return true;
        }

        if (!canGoBack()) {
          return false;
        }

        backOnce();
        return true;
      },
    );

    return () => subscription.remove();
  }, [pathname]);

  return null;
}

function LoadingScreen() {
  const theme = useOptionalAppTheme();
  const colors = theme?.colors ?? defaultColors;
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator color={colors.accentText} size="large" />
      <Text style={styles.loadingText}>正在加载本地词库</Text>
    </View>
  );
}

type ErrorBoundaryProps = {
  error: Error;
  retry: () => Promise<void>;
};

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const theme = useOptionalAppTheme();
  const colors = theme?.colors ?? defaultColors;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const appError = normalizeAppError(error);

  useEffect(() => {
    logger.error('root.render_error', appError);
  }, [appError]);

  return (
    <SafeAreaView style={styles.errorScreen}>
      <View style={styles.errorCard}>
        <Text style={styles.errorTitle}>页面加载失败</Text>
        <Text style={styles.errorMessage}>{appError.message}</Text>
        <Text style={styles.errorCode}>错误代码：{appError.code}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void retry();
          }}
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.retryText}>重新加载</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    errorCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      maxWidth: 420,
      padding: 28,
      width: '86%',
    },
    errorCode: {
      color: colors.textMuted,
      fontSize: 14,
      marginTop: 10,
    },
    errorMessage: {
      color: colors.textSecondary,
      fontSize: 16,
      lineHeight: 24,
      marginTop: 12,
    },
    errorScreen: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flex: 1,
      justifyContent: 'center',
    },
    errorTitle: {
      color: colors.text,
      fontSize: 25,
      fontWeight: '700',
    },
    loadingScreen: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flex: 1,
      justifyContent: 'center',
    },
    loadingText: {
      color: colors.textSecondary,
      fontSize: 17,
      marginTop: 14,
    },
    pressed: {
      opacity: 0.68,
    },
    retryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 24,
      height: 56,
      justifyContent: 'center',
      marginTop: 24,
    },
    retryText: {
      color: colors.onPrimary,
      fontSize: 19,
      fontWeight: '700',
    },
  });
