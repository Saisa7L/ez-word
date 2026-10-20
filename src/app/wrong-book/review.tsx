import { useFocusEffect } from 'expo-router';
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

import { useAppFeedback } from '@/components/AppFeedbackProvider';
import { radii, spacing, type ThemeColors } from '@/constants/theme';
import { uiAssets } from '@/constants/uiAssets';
import { loadWrongReviewSelection } from '@/application/daily-task/startTaskSelection';
import type { DailyTaskSettings } from '@/database/settingsRepository';
import type { TaskWord } from '@/domain/word/taskWord';
import { useDailyTaskSession } from '@/features/daily-task/DailyTaskProvider';
import { useSafeBackNavigation } from '@/hooks/useSafeBackNavigation';
import { useAppTheme, useThemedStyles } from '@/features/theme/ThemeProvider';
import { pushOnce } from '@/utils/navigationActions';

export default function WrongBookReviewStartScreen() {
  const db = useSQLiteContext();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { showNotice } = useAppFeedback();
  const { startTask } = useDailyTaskSession();
  const handleBack = useSafeBackNavigation();
  const [wrongCount, setWrongCount] = useState<number | null>(null);
  const [taskSettings, setTaskSettings] = useState<DailyTaskSettings | null>(
    null,
  );
  const [loadError, setLoadError] = useState(false);
  const [loadRevision, setLoadRevision] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [reviewWords, setReviewWords] = useState<TaskWord[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const requestedRevision = loadRevision;
      setLoadError(false);

      async function loadWrongWords() {
        try {
          const selection = await loadWrongReviewSelection(db);
          if (!active || requestedRevision !== loadRevision) {
            return;
          }

          setTaskSettings(selection.settings);
          setReviewWords(selection.words);
          setWrongCount(selection.words.length);
        } catch {
          if (active) {
            setTaskSettings(null);
            setWrongCount(null);
            setLoadError(true);
            setReviewWords([]);
          }
        }
      }

      void loadWrongWords();

      return () => {
        active = false;
      };
    }, [db, loadRevision]),
  );

  async function handleStart() {
    if (!wrongCount || !taskSettings || isStarting) {
      return;
    }

    setIsStarting(true);
    try {
      pushOnce('/daily-task/learn', () =>
        startTask(reviewWords, taskSettings, 'wrongReview'),
      );
    } catch {
      showNotice('无法开始回顾', '请稍后重试');
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="返回"
          accessibilityRole="button"
          hitSlop={12}
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft color={colors.accentText} size={34} strokeWidth={2.3} />
        </Pressable>
        <Text style={styles.headerTitle}>错题回顾</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        <Image
          resizeMode="contain"
          source={uiAssets.wrongBook.reviewStart}
          style={styles.illustration}
        />
        {loadError ? (
          <>
            <Text style={styles.description}>错题读取失败</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setLoadRevision((current) => current + 1)}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.retryText}>重新加载</Text>
            </Pressable>
          </>
        ) : wrongCount === null ? (
          <ActivityIndicator color={colors.accentText} size="large" />
        ) : (
          <>
            <Text style={styles.description}>
              {wrongCount === 0
                ? '暂无可回顾的错题'
                : `本次将从错题本回顾 ${wrongCount} 个单词`}
            </Text>
            {wrongCount === 0 ? (
              <Text style={styles.emptyHint}>
                完成每日任务后，填空和听写错误会进入错题本
              </Text>
            ) : null}
          </>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={
          loadError || wrongCount === null || wrongCount === 0 || isStarting
        }
        onPress={() => {
          void handleStart();
        }}
        style={({ pressed }) => [
          styles.startButton,
          (loadError ||
            wrongCount === null ||
            wrongCount === 0 ||
            isStarting) &&
            styles.startButtonDisabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.startButtonText}>开始</Text>
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
      aspectRatio: 382 / 354,
      maxHeight: 300,
      width: '100%',
    },
    pressed: {
      opacity: 0.7,
    },
    retryButton: {
      alignItems: 'center',
      borderColor: colors.accentText,
      borderRadius: 22,
      borderWidth: 1.5,
      height: 48,
      justifyContent: 'center',
      marginTop: 22,
      paddingHorizontal: 28,
    },
    retryText: {
      color: colors.accentText,
      fontSize: 18,
      fontWeight: '700',
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    startButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: radii.xl,
      justifyContent: 'center',
      marginBottom: 20,
      marginHorizontal: spacing.lg,
      minHeight: 68,
      paddingHorizontal: 18,
      paddingVertical: 12,
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
