import * as Speech from 'expo-speech';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExitTaskModal } from '@/components/ExitTaskModal';
import { useAppFeedback } from '@/components/AppFeedbackProvider';
import { Button } from '@/components/Button';
import { TaskPhasePlaceholder } from '@/components/TaskPhasePlaceholder';
import { TaskErrorModal } from '@/components/TaskErrorModal';
import { type ThemeColors } from '@/constants/theme';
import { LISTENING_RATES } from '@/database/settingsRepository';
import {
  useDailyTaskMistakes,
  useDailyTaskSession,
} from '@/features/daily-task/DailyTaskProvider';
import {
  getTaskTitle,
  resolveListeningSpeed,
} from '@/features/daily-task/taskPresentation';
import { ListeningAnswerList } from '@/features/daily-task/listening/ListeningAnswerList';
import { ListeningPlayerCard } from '@/features/daily-task/listening/ListeningPlayerCard';
import { useDailyTaskExitGuard } from '@/hooks/useDailyTaskExitGuard';
import { useDailyTaskPhaseGuard } from '@/hooks/useDailyTaskPhaseGuard';
import { useTaskPhaseNavigation } from '@/hooks/useTaskPhaseNavigation';
import { useAppTheme, useThemedStyles } from '@/features/theme/ThemeProvider';
import { playWordSequence } from '@/services/speech';

export default function ListeningScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { showNotice } = useAppFeedback();
  const { finishTask, listeningWords, startedAt, taskMode, taskSettings } =
    useDailyTaskSession();
  const { recordListeningMistakes } = useDailyTaskMistakes();
  const exitGuard = useDailyTaskExitGuard();
  const taskReady = useDailyTaskPhaseGuard('listening');
  const navigateToTaskPhase = useTaskPhaseNavigation();
  const stopPlaybackRef = useRef<(() => void) | null>(null);
  const finishingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRead, setCurrentRead] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [wrongWordIds, setWrongWordIds] = useState<Set<number>>(new Set());
  const [speedOverride, setSpeedOverride] = useState<{
    speed: number;
    startedAt: number | null;
  } | null>(null);
  const [errorWordIds, setErrorWordIds] = useState<number[]>([]);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const speed = resolveListeningSpeed(
    taskSettings.listeningDefaultRate,
    startedAt,
    speedOverride,
  );

  useEffect(
    () => () => {
      stopPlaybackRef.current?.();
    },
    [],
  );

  if (!taskReady || listeningWords.length === 0) {
    return <TaskPhasePlaceholder />;
  }

  const totalReads = listeningWords.length * 2;
  const currentWordIndex = Math.min(
    listeningWords.length,
    Math.floor(currentRead / 2) + 1,
  );
  const allAnswered = listeningWords.every((word) => answers[word.id]?.trim());
  const progress =
    listeningWords.length === 0
      ? 0
      : (currentWordIndex / listeningWords.length) * 100;
  const taskTitle = getTaskTitle(taskMode);

  function stopPlayback() {
    stopPlaybackRef.current?.();
    stopPlaybackRef.current = null;
    setIsPlaying(false);
  }

  async function startPlayback(startReadIndex = 0, playbackSpeed = speed) {
    try {
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
    } catch (error) {
      stopPlayback();
      showNotice(
        '朗读失败',
        error instanceof Error ? error.message : '无法播放听力内容',
      );
    }
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
      Math.max(0, listeningWords.length - 1),
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
    setSpeedOverride({ speed: nextSpeed, startedAt });

    if (isPlaying) {
      void startPlayback(currentRead, nextSpeed);
    }
  }

  function handleSubmit() {
    const wrongIds = listeningWords
      .filter(
        (word) =>
          answers[word.id]?.trim().toLocaleLowerCase('en-US') !==
          word.word.toLocaleLowerCase('en-US'),
      )
      .map((word) => word.id);

    if (wrongIds.length > 0) {
      setWrongWordIds(new Set(wrongIds));
      setErrorWordIds(wrongIds);
      setErrorModalVisible(true);
      return;
    }

    setWrongWordIds(new Set());
    goToComplete();
  }

  function goToComplete() {
    if (finishingRef.current) {
      return;
    }

    finishingRef.current = true;
    setIsSubmitting(true);
    stopPlayback();
    finishTask();
    navigateToTaskPhase('completed', { replace: true });
  }

  function handleErrorConfirm() {
    recordListeningMistakes(errorWordIds);
    setWrongWordIds(new Set(errorWordIds));
    setErrorModalVisible(false);
    if (taskSettings.advanceOnMistakes) {
      goToComplete();
    }
  }

  function handleAnswerChange(wordId: number, answer: string) {
    setAnswers((current) => {
      const next = { ...current };
      if (answer) {
        next[wordId] = answer;
      } else {
        delete next[wordId];
      }
      return next;
    });
    setWrongWordIds((current) => {
      const next = new Set(current);
      next.delete(wordId);
      return next;
    });
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="返回"
          accessibilityRole="button"
          hitSlop={12}
          onPress={exitGuard.requestExit}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft color={colors.accentText} size={34} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{taskTitle}-听力测试</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ListeningPlayerCard
        currentRead={currentRead}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onRewind={handleRewind}
        onSpeedChange={handleSpeedChange}
        progress={progress}
        speed={speed}
        totalWords={listeningWords.length}
      />

      <ListeningAnswerList
        answers={answers}
        onChangeAnswer={handleAnswerChange}
        words={listeningWords}
        wrongWordIds={wrongWordIds}
      />

      <Button
        disabled={!allAnswered || isSubmitting}
        onPress={handleSubmit}
        style={styles.submitButton}
        textStyle={styles.submitText}
      >
        {isSubmitting ? '保存中...' : '提交'}
      </Button>

      <TaskErrorModal
        errorCount={errorWordIds.length}
        onConfirm={handleErrorConfirm}
        onDismiss={() => setErrorModalVisible(false)}
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
    pressed: {
      opacity: 0.7,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    submitButton: {
      height: 60,
      marginBottom: 16,
      marginHorizontal: 24,
      marginTop: 18,
    },
    submitText: {
      fontSize: 22,
    },
  });
