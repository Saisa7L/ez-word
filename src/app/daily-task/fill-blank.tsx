import { ArrowLeft } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExitTaskModal } from '@/components/ExitTaskModal';
import { Button } from '@/components/Button';
import { TaskPhasePlaceholder } from '@/components/TaskPhasePlaceholder';
import { TaskErrorModal } from '@/components/TaskErrorModal';
import { type ThemeColors } from '@/constants/theme';
import {
  useDailyTaskMistakes,
  useDailyTaskSession,
} from '@/features/daily-task/DailyTaskProvider';
import { FillBlankQuestionCard } from '@/features/daily-task/fill-blank/FillBlankQuestionCard';
import { FillBlankWordBank } from '@/features/daily-task/fill-blank/FillBlankWordBank';
import { getTaskTitle } from '@/features/daily-task/taskPresentation';
import { useDailyTaskExitGuard } from '@/hooks/useDailyTaskExitGuard';
import { useDailyTaskPhaseGuard } from '@/hooks/useDailyTaskPhaseGuard';
import { useTaskPhaseNavigation } from '@/hooks/useTaskPhaseNavigation';
import { useAppTheme, useThemedStyles } from '@/features/theme/ThemeProvider';

export default function FillBlankScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { questions, taskMode, taskSettings, wordBank, words } =
    useDailyTaskSession();
  const { recordFillMistakes } = useDailyTaskMistakes();
  const exitGuard = useDailyTaskExitGuard();
  const taskReady = useDailyTaskPhaseGuard('filling');
  const navigateToTaskPhase = useTaskPhaseNavigation();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);
  const [wrongWordIds, setWrongWordIds] = useState<Set<number>>(new Set());
  const [errorWordIds, setErrorWordIds] = useState<number[]>([]);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const usedWordIds = useMemo(() => new Set(Object.values(answers)), [answers]);

  if (!taskReady) {
    return <TaskPhasePlaceholder />;
  }

  const allAnswered = words.every((word) => answers[word.id] !== undefined);
  const taskTitle = getTaskTitle(taskMode);

  function handleBlankPress(questionWordId: number) {
    if (answers[questionWordId] !== undefined) {
      setAnswers((current) => {
        const next = { ...current };
        delete next[questionWordId];
        return next;
      });
      setWrongWordIds((current) => {
        const next = new Set(current);
        next.delete(questionWordId);
        return next;
      });
      return;
    }

    if (selectedWordId !== null) {
      setAnswers((current) => {
        const next = { ...current };
        for (const [wordId, answerWordId] of Object.entries(next)) {
          if (answerWordId === selectedWordId) {
            delete next[Number(wordId)];
          }
        }
        next[questionWordId] = selectedWordId;
        return next;
      });
      setWrongWordIds((current) => {
        const next = new Set(current);
        next.delete(questionWordId);
        return next;
      });
      setSelectedWordId(null);
    }
  }

  function handleSubmit() {
    const nextWrongWordIds = words
      .filter((word) => answers[word.id] !== word.id)
      .map((word) => word.id);

    if (nextWrongWordIds.length > 0) {
      setWrongWordIds(new Set(nextWrongWordIds));
      setErrorWordIds(nextWrongWordIds);
      setErrorModalVisible(true);
      return;
    }

    setWrongWordIds(new Set());
    navigateToTaskPhase('listening');
  }

  function handleErrorConfirm() {
    recordFillMistakes(errorWordIds);
    setWrongWordIds(new Set(errorWordIds));
    setErrorModalVisible(false);
    if (taskSettings.advanceOnMistakes) {
      navigateToTaskPhase('listening');
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
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft color={colors.accentText} size={34} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{taskTitle}-选词填空</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <FillBlankQuestionCard
        answers={answers}
        onBlankPress={handleBlankPress}
        questions={questions}
        wordBank={wordBank}
        wrongWordIds={wrongWordIds}
      />

      <FillBlankWordBank
        onSelectWord={setSelectedWordId}
        selectedWordId={selectedWordId}
        usedWordIds={usedWordIds}
        wordBank={wordBank}
      />

      <Button
        disabled={!allAnswered}
        onPress={handleSubmit}
        style={styles.submitButton}
        textStyle={styles.submitText}
      >
        提交
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
      marginBottom: 16,
      marginHorizontal: 24,
      minHeight: 60,
    },
    submitText: {
      fontSize: 22,
    },
  });
