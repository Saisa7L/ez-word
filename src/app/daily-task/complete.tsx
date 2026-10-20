import { useFocusEffect, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SurfaceCard } from '@/components/SurfaceCard';
import { shadow, type ThemeColors } from '@/constants/theme';
import { uiAssets } from '@/constants/uiAssets';
import { completeTaskSession } from '@/database/taskCompletionRepository';
import {
  useDailyTaskAnswers,
  useDailyTaskSession,
} from '@/features/daily-task/DailyTaskProvider';
import { getTaskTitle } from '@/features/daily-task/taskPresentation';
import { useDailyTaskPhaseGuard } from '@/hooks/useDailyTaskPhaseGuard';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';
import {
  returnToHome,
  type AppNavigation,
} from '@/utils/navigation';

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}分${seconds}秒`;
}

export default function DailyTaskCompleteScreen() {
  const db = useSQLiteContext();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {
    durationSeconds,
    resetTask,
    taskMode,
    taskSettings,
    words,
  } = useDailyTaskSession();
  const {
    fillMistakeWordIds,
    listeningMistakeWordIds,
    wrongWordIds,
  } = useDailyTaskAnswers();
  const navigation = useNavigation<AppNavigation>('/');
  const taskReady = useDailyTaskPhaseGuard('completed');
  const completionStartedRef = useRef(false);
  const [completionState, setCompletionState] = useState<
    'error' | 'saved' | 'saving'
  >('saving');
  const taskTitle = getTaskTitle(taskMode);
  const learnedLabel =
    taskMode === 'daily'
      ? '本次学习单词'
      : taskMode === 'wrongReview'
        ? '本次回顾单词'
        : '本次练习单词';

  const saveCompletion = useCallback(async () => {
    if (completionStartedRef.current || words.length === 0) {
      return;
    }

    completionStartedRef.current = true;
    try {
      await completeTaskSession(db, {
        autoRemoveCorrectWrongReview:
          taskSettings.autoRemoveCorrectWrongReview,
        fillWrongWordIds: [...fillMistakeWordIds],
        listeningWrongWordIds: [...listeningMistakeWordIds],
        mode: taskMode,
        wordIds: words.map((word) => word.id),
      });
      setCompletionState('saved');
    } catch {
      completionStartedRef.current = false;
      setCompletionState('error');
    }
  }, [
    db,
    fillMistakeWordIds,
    listeningMistakeWordIds,
    taskMode,
    taskSettings.autoRemoveCorrectWrongReview,
    words,
  ]);

  const handleHome = useCallback(() => {
    if (completionState === 'saving') {
      return;
    }

    returnToHome(navigation);
    resetTask();
  }, [completionState, navigation, resetTask]);

  useEffect(() => {
    if (!taskReady) {
      return;
    }

    const timer = setTimeout(() => {
      void saveCompletion();
    }, 0);
    return () => clearTimeout(timer);
  }, [saveCompletion, taskReady]);

  useFocusEffect(
    useCallback(() => {
      if (!taskReady) {
        return;
      }

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (completionState === 'saving') {
            return true;
          }
          handleHome();
          return true;
        },
      );

      return () => subscription.remove();
    }, [completionState, handleHome, taskReady]),
  );

  if (!taskReady) {
    return null;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="返回首页"
          accessibilityRole="button"
          disabled={completionState === 'saving'}
          hitSlop={12}
          onPress={handleHome}
          style={({ pressed }) => [
            styles.backButton,
            completionState === 'saving' && styles.disabled,
            pressed && completionState !== 'saving' && styles.pressed,
          ]}
        >
          <ArrowLeft color={colors.accentText} size={34} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{taskTitle}-完成</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        {completionState === 'saving' ? (
          <View style={styles.statusContent}>
            <ActivityIndicator color={colors.accentText} size="large" />
            <Text style={styles.statusTitle}>正在保存学习记录</Text>
          </View>
        ) : completionState === 'error' ? (
          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>保存失败</Text>
            <Text style={styles.statusMessage}>
              本次学习尚未写入，单词状态没有改变。
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setCompletionState('saving');
                void saveCompletion();
              }}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.retryButtonText}>重试保存</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={handleHome}
              style={({ pressed }) => [
                styles.discardButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.discardButtonText}>返回主界面</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.title}>完成</Text>
            <Image
              source={uiAssets.dailyTask.complete}
              style={styles.illustration}
            />

            <SurfaceCard style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{learnedLabel}</Text>
                <Text style={styles.summaryValue}>
                  {Math.max(0, words.length - wrongWordIds.size)}/{words.length}
                </Text>
              </View>
              {taskMode === 'daily' ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>本次错题</Text>
                  <Text style={styles.summaryValue}>
                    {wrongWordIds.size}/{words.length}
                  </Text>
                </View>
              ) : null}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>学习时长</Text>
                <Text style={styles.summaryValue}>
                  {formatDuration(durationSeconds)}
                </Text>
              </View>
            </SurfaceCard>
          </>
        )}
      </View>

      {completionState === 'saved' ? (
        <Pressable
          accessibilityRole="button"
          onPress={handleHome}
          style={({ pressed }) => [styles.homeButton, pressed && styles.pressed]}
        >
          <Text style={styles.homeButtonText}>返回主界面</Text>
        </Pressable>
      ) : null}
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
    paddingHorizontal: 20,
  },
  discardButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 48,
  },
  discardButtonText: {
    color: colors.textSecondary,
    fontSize: 17,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.4,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 88,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  headerPlaceholder: {
    width: 48,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '700',
  },
  homeButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 62,
    justifyContent: 'center',
    marginBottom: 18,
    marginHorizontal: 28,
  },
  homeButtonText: {
    color: colors.onPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  illustration: {
    height: 250,
    marginTop: 8,
    width: 250,
  },
  pressed: {
    opacity: 0.7,
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    justifyContent: 'center',
    marginTop: 26,
    minHeight: 58,
    paddingHorizontal: 40,
  },
  retryButtonText: {
    color: colors.onPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  summaryCard: {
    ...shadow,
    marginTop: 18,
    paddingHorizontal: 24,
    paddingVertical: 20,
    width: '100%',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 20,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  statusContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 80,
    paddingHorizontal: 18,
  },
  statusMessage: {
    color: colors.textSecondary,
    fontSize: 18,
    lineHeight: 28,
    marginTop: 14,
    textAlign: 'center',
  },
  statusTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '800',
  },
});
