import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { ArrowLeft, Gauge, Play, RotateCcw, Square } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
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
import { ScrollIndicator } from '@/components/ScrollIndicator';
import { TaskErrorModal } from '@/components/TaskErrorModal';
import { colors, radii, shadow } from '@/constants/theme';
import { useDailyTask } from '@/features/daily-task/DailyTaskProvider';
import { useDailyTaskExitGuard } from '@/hooks/useDailyTaskExitGuard';
import { playWordSequence } from '@/services/speech';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatSpeed(speed: number): string {
  return Number.isInteger(speed) ? `${speed.toFixed(1)}x` : `${speed}x`;
}

export default function ListeningScreen() {
  const {
    listeningAnswers,
    listeningWrongWordIds,
    finishTask,
    setListeningAnswer,
    setListeningWrongWordIds,
    words,
  } = useDailyTask();
  const exitGuard = useDailyTaskExitGuard();
  const stopPlaybackRef = useRef<(() => void) | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRead, setCurrentRead] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [errorWordIds, setErrorWordIds] = useState<number[]>([]);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [answerViewportHeight, setAnswerViewportHeight] = useState(0);
  const [answerContentHeight, setAnswerContentHeight] = useState(0);
  const [answerScrollY, setAnswerScrollY] = useState(0);

  useEffect(() => {
    if (words.length === 0) {
      router.replace('/daily-task');
    }
  }, [words.length]);

  useEffect(
    () => () => {
      stopPlaybackRef.current?.();
    },
    [],
  );

  if (words.length === 0) {
    return null;
  }

  const totalReads = words.length * 2;
  const currentWordIndex = Math.min(
    words.length,
    Math.floor(currentRead / 2) + 1,
  );
  const allAnswered = words.every((word) => listeningAnswers[word.id]?.trim());
  const progress = words.length === 0 ? 0 : (currentWordIndex / words.length) * 100;

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
        Alert.alert('朗读失败', error.message);
      },
      onFinished: () => {
        setIsPlaying(false);
        setCurrentRead(totalReads);
      },
      onWordStart: (readIndex) => setCurrentRead(readIndex),
      rate: playbackSpeed,
      startReadIndex,
      words,
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
    const currentIndex = SPEEDS.indexOf(speed);
    const nextSpeed = SPEEDS[(currentIndex + 1) % SPEEDS.length];
    setSpeed(nextSpeed);

    if (isPlaying) {
      void startPlayback(currentRead, nextSpeed);
    }
  }

  function handleSubmit() {
    const wrongIds = words
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

    stopPlayback();
    finishTask();
    router.push('/daily-task/complete');
  }

  function handleErrorConfirm() {
    setListeningWrongWordIds(errorWordIds);
    setErrorModalVisible(false);
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
        <Text style={styles.headerTitle}>每日任务-听力测试</Text>
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
            <RotateCcw color={colors.primary} size={28} strokeWidth={2.2} />
          </Pressable>
          <Pressable
            accessibilityLabel={isPlaying ? '停止' : '播放'}
            accessibilityRole="button"
            onPress={handlePlayPause}
            style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}
          >
            {isPlaying ? (
              <Square color={colors.surface} fill={colors.surface} size={32} />
            ) : (
              <Play color={colors.surface} fill={colors.surface} size={44} />
            )}
          </Pressable>
          <Pressable
            accessibilityLabel="切换倍速"
            accessibilityRole="button"
            onPress={handleSpeedChange}
            style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
          >
            <Gauge color={colors.primary} size={25} strokeWidth={2.2} />
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

      <View
        onLayout={(event) => setAnswerViewportHeight(event.nativeEvent.layout.height)}
        style={styles.answerCard}
      >
        <ScrollView
          contentContainerStyle={styles.answerContent}
          onContentSizeChange={(_, height) => setAnswerContentHeight(height)}
          onScroll={(event) => setAnswerScrollY(event.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {words.map((word, index) => {
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

      <Pressable
        accessibilityRole="button"
        disabled={!allAnswered}
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.submitButton,
          !allAnswered && styles.submitButtonDisabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.submitText}>提交</Text>
      </Pressable>

      <TaskErrorModal
        errorCount={errorWordIds.length}
        onConfirm={handleErrorConfirm}
        visible={errorModalVisible}
      />
      <ExitTaskModal
        onCancel={exitGuard.cancelExit}
        onConfirm={exitGuard.confirmExit}
        visible={exitGuard.visible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    paddingBottom: 40,
    paddingRight: 38,
    paddingTop: 40,
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
    borderBottomColor: colors.primary,
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
    backgroundColor: colors.primary,
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
    backgroundColor: colors.primary,
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
  speedText: {
    color: colors.primary,
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
    backgroundColor: '#B9C0CA',
  },
  submitText: {
    color: colors.surface,
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
