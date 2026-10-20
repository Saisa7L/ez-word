import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radii, spacing, type ThemeColors } from '@/constants/theme';
import { uiAssets } from '@/constants/uiAssets';
import { loadDailyTaskSelection } from '@/application/daily-task/startTaskSelection';
import type { DailyTaskSettings } from '@/database/settingsRepository';
import type { TaskWord } from '@/domain/word/taskWord';
import { useDailyTaskSession } from '@/features/daily-task/DailyTaskProvider';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';
import { returnToHome, type AppNavigation } from '@/utils/navigation';

export default function DailyTaskStartScreen() {
  const db = useSQLiteContext();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { startTask } = useDailyTaskSession();
  const navigation = useNavigation<AppNavigation>('/');
  const [availableWords, setAvailableWords] = useState<TaskWord[] | null>(null);
  const [taskSettings, setTaskSettings] = useState<DailyTaskSettings | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadAvailableWords() {
        try {
          const selection = await loadDailyTaskSelection(db);
          if (active) {
            setAvailableWords(selection.words);
            setTaskSettings(selection.settings);
          }
        } catch {
          if (active) {
            setAvailableWords([]);
            setTaskSettings(null);
          }
        }
      }

      void loadAvailableWords();

      return () => {
        active = false;
      };
    }, [db]),
  );

  function handleStart() {
    if (!availableWords || availableWords.length === 0 || !taskSettings) {
      return;
    }

    startTask(availableWords, taskSettings);
    router.push('/daily-task/learn');
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  function handleReturnHome() {
    returnToHome(navigation);
  }

  const wordCount = availableWords?.length ?? 0;
  const isEmpty = availableWords !== null && wordCount === 0;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="返回"
          accessibilityRole="button"
          hitSlop={12}
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ArrowLeft color={colors.accentText} size={34} strokeWidth={2.3} />
        </Pressable>
        <Text style={styles.headerTitle}>每日任务</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        <Image
          resizeMode="contain"
          source={uiAssets.dailyTask.start}
          style={styles.illustration}
        />
        {availableWords === null ? (
          <ActivityIndicator color={colors.accentText} size="large" />
        ) : (
          <>
            <Text style={styles.description}>
              {isEmpty
                ? '暂无可学习的新单词'
                : `今日 ${wordCount} 个新单词，一起开始吧`}
            </Text>
            {isEmpty ? (
              <Text style={styles.emptyHint}>
                请先导入单词，或等待已学单词进入复习
              </Text>
            ) : null}
          </>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={availableWords === null || taskSettings === null}
        onPress={isEmpty ? handleReturnHome : handleStart}
        style={({ pressed }) => [
          styles.startButton,
          (availableWords === null || taskSettings === null) &&
            styles.startButtonDisabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.startButtonText}>{isEmpty ? '返回主界面' : '开始'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 80,
    paddingHorizontal: 36,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 22,
    marginTop: 34,
    textAlign: 'center',
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 92,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  headerPlaceholder: {
    width: 48,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '700',
  },
  illustration: {
    height: 250,
    width: '100%',
  },
  pressed: {
    opacity: 0.7,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  startButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    height: 68,
    justifyContent: 'center',
    marginBottom: 20,
    marginHorizontal: spacing.lg,
  },
  startButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  startButtonText: {
    color: colors.onPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
});
