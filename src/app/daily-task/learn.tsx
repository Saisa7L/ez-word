import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { ArrowLeft, Volume2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExitTaskModal } from '@/components/ExitTaskModal';
import { colors, radii, shadow } from '@/constants/theme';
import { useDailyTask } from '@/features/daily-task/DailyTaskProvider';
import { useDailyTaskExitGuard } from '@/hooks/useDailyTaskExitGuard';

export default function LearnWordsScreen() {
  const { taskMode, words } = useDailyTask();
  const [index, setIndex] = useState(0);
  const exitGuard = useDailyTaskExitGuard();

  useEffect(() => {
    if (words.length === 0) {
      router.replace('/daily-task');
    }
  }, [words.length]);

  if (words.length === 0) {
    return null;
  }

  const word = words[index];
  const progress = ((index + 1) / words.length) * 100;
  const isLast = index === words.length - 1;
  const taskTitle =
    taskMode === 'wrongReview' ? '错题回顾' : '每日任务';

  function speakWord() {
    void Speech.stop();
    Speech.speak(word.word, {
      language: 'en-US',
      rate: 0.85,
    });
  }

  function handleNext() {
    if (isLast) {
      router.push('/daily-task/fill-blank');
      return;
    }
    setIndex((current) => current + 1);
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="返回"
          accessibilityRole="button"
          hitSlop={12}
          onPress={exitGuard.requestExit}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ArrowLeft color={colors.primary} size={34} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{taskTitle}-认识单词</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.wordCard}>
          <Text style={styles.word}>{word.word}</Text>
          <Text style={styles.meaning}>{word.meaning}</Text>
          <Text style={styles.phonetic}>{word.phonetic || '暂无音标'}</Text>
          <Pressable
            accessibilityLabel="播放发音"
            accessibilityRole="button"
            onPress={speakWord}
            style={({ pressed }) => [styles.speakerButton, pressed && styles.pressed]}
          >
            <Volume2 color={colors.surface} size={42} strokeWidth={2.4} />
          </Pressable>
        </View>

        <Text style={styles.counter}>
          {index + 1}/{words.length}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` as DimensionValue }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={index === 0}
          onPress={() => setIndex((current) => Math.max(0, current - 1))}
          style={({ pressed }) => [
            styles.actionButton,
            index === 0 && styles.actionButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.actionButtonText}>上一个</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={handleNext}
          style={({ pressed }) => [
            styles.actionButton,
            styles.nextButton,
            isLast && styles.nextButtonPrimary,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.actionButtonText,
              isLast && styles.actionButtonTextPrimary,
            ]}
          >
            {isLast ? '开始填空' : '下一个'}
          </Text>
        </Pressable>
      </View>

      <ExitTaskModal
        onCancel={exitGuard.cancelExit}
        onConfirm={exitGuard.confirmExit}
        taskLabel={taskTitle}
        visible={exitGuard.visible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 28,
    flex: 1,
    height: 58,
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionButtonText: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '600',
  },
  actionButtonTextPrimary: {
    color: colors.surface,
  },
  actions: {
    flexDirection: 'row',
    gap: 18,
    paddingBottom: 12,
    paddingHorizontal: 24,
  },
  backButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 24,
  },
  counter: {
    color: colors.textSecondary,
    fontSize: 20,
    marginTop: 34,
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
    fontSize: 24,
    fontWeight: '700',
  },
  meaning: {
    color: colors.textSecondary,
    fontSize: 25,
    marginTop: 26,
  },
  nextButton: {
    backgroundColor: colors.surface,
  },
  nextButtonPrimary: {
    backgroundColor: colors.primary,
  },
  phonetic: {
    color: colors.textMuted,
    fontSize: 20,
    marginTop: 14,
  },
  pressed: {
    opacity: 0.68,
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 20,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: 19,
    marginTop: 8,
  },
  progressTrack: {
    backgroundColor: colors.border,
    borderRadius: 8,
    height: 20,
    marginTop: 12,
    overflow: 'hidden',
    width: '100%',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  speakerButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginTop: 38,
    width: 80,
  },
  word: {
    color: colors.text,
    fontSize: 54,
    fontWeight: '800',
  },
  wordCard: {
    ...shadow,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    marginTop: 18,
    minHeight: 400,
    paddingHorizontal: 26,
    paddingTop: 62,
    width: '100%',
  },
});
