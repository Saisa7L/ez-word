import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Speech from 'expo-speech';
import { ArrowLeft, Gauge, Play, RotateCcw, Square } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type DimensionValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExitTaskModal } from '@/components/ExitTaskModal';
import { useAppFeedback } from '@/components/AppFeedbackProvider';
import { ScrollIndicator } from '@/components/ScrollIndicator';
import { TaskErrorModal } from '@/components/TaskErrorModal';
import { radii, shadow, type ThemeColors } from '@/constants/theme';
import { LISTENING_RATES } from '@/database/settingsRepository';
import { recordTaskCompletion } from '@/database/studyRepository';
import {
  recordWrongWords,
  resolveWrongBookRemoval,
} from '@/database/wrongBookRepository';
import { useDailyTask } from '@/features/daily-task/DailyTaskProvider';
import { useDailyTaskExitGuard } from '@/hooks/useDailyTaskExitGuard';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';
import { playWordSequence } from '@/services/speech';

function formatSpeed(speed: number): string {
  return Number.isInteger(speed) ? `${speed.toFixed(1)}x` : `${speed}x`;
}

export default function ListeningScreen() {
  const db = useSQLiteContext();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { showNotice } = useAppFeedback();
  const {
    listeningAnswers,
    listeningWords,
    listeningWrongWordIds,
    finishTask,
    setListeningAnswer,
    setListeningWrongWordIds,
    taskMode,
    taskSettings,
    words,
    wrongWordIds,
  } = useDailyTask();
  const exitGuard = useDailyTaskExitGuard();
  const stopPlaybackRef = useRef<(() => void) | null>(null);
  const savingMistakesRef = useRef(false);
  const submittingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRead, setCurrentRead] = useState(0);
  const [speed, setSpeed] = useState<number>(
    taskSettings.listeningDefaultRate,
  );
  const [errorWordIds, setErrorWordIds] = useState<number[]>([]);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [answerViewportHeight, setAnswerViewportHeight] = useState(0);
  const [answerContentHeight, setAnswerContentHeight] = useState(0);
  const [answerScrollY, setAnswerScrollY] = useState(0);

  useEffect(() => {
    if (listeningWords.length === 0) {
      router.replace('/daily-task');
    }
  }, [listeningWords.length]);

  useEffect(
    () => () => {
      stopPlaybackRef.current?.();
    },
    [],
  );

  if (listeningWords.length === 0) {
    return null;
  }

  const totalReads = listeningWords.length * 2;
  const currentWordIndex = Math.min(
    listeningWords.length,
    Math.floor(currentRead / 2) + 1,
  );
  const allAnswered = listeningWords.every(
    (word) => listeningAnswers[word.id]?.trim(),
  );
  const progress =
    listeningWords.length === 0
      ? 0
      : (currentWordIndex / listeningWords.length) * 100;
  const taskTitle =
    taskMode === 'wrongReview'
      ? '错题回顾'
      : taskMode === 'wordReview'
        ? '单词再练'
        : '每日任务';

  function stopPlayback() {
    stopPlaybackRef.current?.();
    stopPlaybackRef.current = null;
    setIsPlaying(false);
  }

  async function startPlayback(startReadIndex = 0, playbackSpeed = speed) {
    stopPlayback();
    await Speech.stop();
    setIsPlaying(true);
    stopPlaybackRef.current = playWordSequence({
      onError: (error) => {
        setIsPlaying(false);
        showNotice('朗读失败', error.message);
      },
      onFinished: () => {
        setIsPlaying(false);
        setCurrentRead(totalReads);
      },
      onWordStart: (readIndex) => setCurrentRead(readIndex),
      rate: playbackSpeed,
      startReadIndex,
      wordGapMs: taskSettings.listeningWordIntervalSeconds * 1000,
      words: listeningWords,
    });
  }

  function handlePlayPause() {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    void startPlayback(currentRead >= totalReads ? 0 : currentRead);
  }

  function handleRewind() {
    const currentWordZeroBased = Math.min(
      Math.max(0, words.length - 1),
      Math.floor(currentRead / 2),
    );
    const targetRead = Math.max(0, currentWordZeroBased - 1) * 2;
    setCurrentRead(targetRead);

    if (isPlaying) {
      void startPlayback(targetRead);
    }
  }

  function handleSpeedChange() {
    const currentIndex = LISTENING_RATES.indexOf(
      speed as (typeof LISTENING_RATES)[number],
    );
    const nextSpeed =
      LISTENING_RATES[(currentIndex + 1) % LISTENING_RATES.length];
    setSpeed(nextSpeed);

    if (isPlaying) {
      void startPlayback(currentRead, nextSpeed);
    }
  }

  function handleSubmit() {
    const wrongIds = listeningWords
      .filter(
        (word) =>
          listeningAnswers[word.id]?.trim().toLocaleLowerCase('en-US') !==
          word.word.toLocaleLowerCase('en-US'),
      )
      .map((word) => word.id);

    if (wrongIds.length > 0) {
      setErrorWordIds(wrongIds);
      setErrorModalVisible(true);
      return;
    }

    setListeningWrongWordIds([]);
    void completeTask([]);
  }

  async function completeTask(wrongIds: number[]) {
    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    stopPlayback();

    const combinedWrongIds = new Set([...wrongWordIds, ...wrongIds]);

    try {
      if (taskMode === 'daily') {
        await recordTaskCompletion(db, {
          wordIds: words.map((word) => word.id),
          wrongCount: combinedWrongIds.size,
          wrongWordIds: [...combinedWrongIds],
        });
      } else if (
        taskMode === 'wrongReview' &&
        taskSettings.autoRemoveCorrectWrongReview
      ) {
        const correctWordIds = words
          .filter((word) => !combinedWrongIds.has(word.id))
          .map((word) => word.id);
        await resolveWrongBookRemoval(db, correctWordIds, 'learned');
      }
      finishTask();
      router.push('/daily-task/complete');
    } catch {
      submittingRef.current = false;
      setIsSubmitting(false);
      showNotice('保存失败', '无法保存本次学习记录，请稍后重试');
    }
  }

  function handleErrorConfirm() {
    void recordMistakesAndContinue();
  }

  async function recordMistakesAndContinue() {
    if (savingMistakesRef.current) {
      return;
    }

    savingMistakesRef.current = true;
    try {
      await recordWrongWords(db, errorWordIds, 'listening');
      setListeningWrongWordIds(errorWordIds);
      setErrorModalVisible(false);
      if (taskSettings.advanceOnMistakes) {
        void completeTask(errorWordIds);
      }
    } catch {
      showNotice('保存失败', '无法将错题加入错题本，请稍后重试');
    } finally {
      savingMistakesRef.current = false;
    }
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
          <ArrowLeft color={colors.accentText} size={34} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{taskTitle}-听力测试</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.playerCard}>
        <View style={styles.playerControls}>
          <Pressable
            accessibilityLabel="倒退5秒"
            accessibilityRole="button"
            onPress={handleRewind}
            style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
          >
            <RotateCcw color={colors.accentText} size={28} strokeWidth={2.2} />
          </Pressable>
          <Pressable
            accessibilityLabel={isPlaying ? '停止' : '播放'}
            accessibilityRole="button"
            onPress={handlePlayPause}
            style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}
          >
            {isPlaying ? (
              <Square
                color={colors.accentText}
                fill={colors.accentText}
                size={32}
              />
            ) : (
              <Play
                color={colors.accentText}
                fill={colors.accentText}
                size={44}
              />
            )}
          </Pressable>
          <Pressable
            accessibilityLabel="切换倍速"
            accessibilityRole="button"
            onPress={handleSpeedChange}
            style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
          >
            <Gauge color={colors.accentText} size={25} strokeWidth={2.2} />
            <Text style={styles.speedText}>{formatSpeed(speed)}</Text>
          </Pressable>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%` as DimensionValue },
            ]}
          />
        </View>
        <Text style={styles.positionText}>
          {currentWordIndex}/{words.length}
        </Text>
      </View>

      <View style={styles.answerCard}>
        <View
          onLayout={(event) => setAnswerViewportHeight(event.nativeEvent.layout.height)}
          style={styles.scrollViewport}
        >
          <ScrollView
            contentContainerStyle={styles.answerContent}
            onContentSizeChange={(_, height) => setAnswerContentHeight(height)}
            onScroll={(event) => setAnswerScrollY(event.nativeEvent.contentOffset.y)}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
          >
            {listeningWords.map((word, index) => {
              const isWrong = listeningWrongWordIds.has(word.id);
              return (
                <View key={word.id} style={styles.answerRow}>
                  <Text style={styles.answerNumber}>{index + 1}.</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={(value) => setListeningAnswer(word.id, value)}
                    spellCheck={false}
                    style={[styles.input, isWrong && styles.inputWrong]}
                    value={listeningAnswers[word.id] ?? ''}
                  />
                </View>
              );
            })}
          </ScrollView>
          <ScrollIndicator
            contentHeight={answerContentHeight}
            scrollY={answerScrollY}
            viewportHeight={answerViewportHeight}
          />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!allAnswered || isSubmitting}
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.submitButton,
          (!allAnswered || isSubmitting) && styles.submitButtonDisabled,
          pressed && !isSubmitting && styles.pressed,
        ]}
      >
        <Text style={styles.submitText}>
          {isSubmitting ? '保存中...' : '提交'}
        </Text>
      </Pressable>

      <TaskErrorModal
        errorCount={errorWordIds.length}
        onConfirm={handleErrorConfirm}
        visible={errorModalVisible}
      />
      <ExitTaskModal
        onCancel={exitGuard.cancelExit}
        onConfirm={exitGuard.confirmExit}
        taskLabel={taskTitle}
        visible={exitGuard.visible}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  answerCard: {
    ...shadow,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    flex: 1,
    marginHorizontal: 18,
    minHeight: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  answerContent: {
    paddingBottom: 16,
    paddingRight: 38,
    paddingTop: 16,
    paddingLeft: 24,
  },
  answerNumber: {
    color: colors.text,
    fontSize: 21,
    width: 34,
  },
  answerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 20,
  },
  backButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
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
  input: {
    backgroundColor: colors.graySoft,
    borderBottomColor: colors.accentText,
    borderBottomWidth: 1.5,
    borderRadius: 4,
    color: colors.text,
    flex: 1,
    fontSize: 20,
    height: 50,
    paddingHorizontal: 14,
  },
  inputWrong: {
    backgroundColor: colors.redSoft,
    borderBottomColor: colors.red,
    color: colors.red,
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: colors.graySoft,
    borderRadius: 55,
    height: 110,
    justifyContent: 'center',
    width: 110,
  },
  playerCard: {
    ...shadow,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    marginBottom: 20,
    marginHorizontal: 18,
    padding: 22,
  },
  playerControls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.7,
  },
  progressFill: {
    backgroundColor: colors.accentText,
    borderRadius: 5,
    height: 10,
  },
  progressTrack: {
    backgroundColor: colors.border,
    borderRadius: 5,
    height: 10,
    marginTop: 24,
    overflow: 'hidden',
  },
  roundButton: {
    alignItems: 'center',
    backgroundColor: colors.mint,
    borderRadius: 42,
    height: 84,
    justifyContent: 'center',
    width: 84,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewport: {
    flex: 1,
    marginVertical: 24,
    position: 'relative',
  },
  speedText: {
    color: colors.accentText,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 60,
    justifyContent: 'center',
    marginBottom: 16,
    marginHorizontal: 24,
    marginTop: 18,
  },
  submitButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  submitText: {
    color: colors.onPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  positionText: {
    color: colors.textSecondary,
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
});
