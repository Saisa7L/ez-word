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

import { f3Assets } from '@/constants/f3Assets';
import { colors, radii, spacing } from '@/constants/theme';
import {
  getDailyTaskSettings,
  type DailyTaskSettings,
} from '@/database/settingsRepository';
import {
  listUnlearnedActiveWords,
  type WordRecord,
} from '@/database/wordsRepository';
import { useDailyTask } from '@/features/daily-task/DailyTaskProvider';
import { returnToHome, type AppNavigation } from '@/utils/navigation';

export default function DailyTaskStartScreen() {
  const db = useSQLiteContext();
  const { startTask } = useDailyTask();
  const navigation = useNavigation<AppNavigation>('/');
  const [availableWords, setAvailableWords] = useState<WordRecord[] | null>(null);
  const [taskSettings, setTaskSettings] = useState<DailyTaskSettings | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadAvailableWords() {
        try {
          const settings = await getDailyTaskSettings(db);
          const words = await listUnlearnedActiveWords(
            db,
            settings.dailyWordLimit,
            settings.randomWordSelection,
          );
          if (active) {
            setAvailableWords(words);
            setTaskSettings(settings);
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
          <ArrowLeft color={colors.primary} size={34} strokeWidth={2.3} />
        </Pressable>
        <Text style={styles.headerTitle}>每日任务</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        <Image
          resizeMode="contain"
          source={f3Assets.taskStart}
          style={styles.illustration}
        />
        {availableWords === null ? (
          <ActivityIndicator color={colors.primary} size="large" />
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

const styles = StyleSheet.create({
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
    backgroundColor: '#B9C0CA',
  },
  startButtonText: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: '700',
  },
});
