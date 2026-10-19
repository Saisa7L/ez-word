import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExitTaskModal } from '@/components/ExitTaskModal';
import { useAppFeedback } from '@/components/AppFeedbackProvider';
import { ScrollIndicator } from '@/components/ScrollIndicator';
import { TaskErrorModal } from '@/components/TaskErrorModal';
import {
  radii,
  shadow,
  spacing,
  type ThemeColors,
} from '@/constants/theme';
import { recordWrongWords } from '@/database/wrongBookRepository';
import { useDailyTask } from '@/features/daily-task/DailyTaskProvider';
import { getTaskTitle } from '@/features/daily-task/taskPresentation';
import { useDailyTaskExitGuard } from '@/hooks/useDailyTaskExitGuard';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';

const WORD_PAGE_SIZE = 4;

export default function FillBlankScreen() {
  const db = useSQLiteContext();
  const { colors, mode } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { showNotice } = useAppFeedback();
  const {
    clearFillAnswer,
    fillAnswers,
    fillWrongWordIds,
    questions,
    setFillAnswer,
    setFillWrongWordIds,
    taskMode,
    taskSettings,
    wordBank,
    words,
  } = useDailyTask();
  const exitGuard = useDailyTaskExitGuard();
  const savingMistakesRef = useRef(false);
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);
  const [errorWordIds, setErrorWordIds] = useState<number[]>([]);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [wordPageIndex, setWordPageIndex] = useState(0);
  const [questionViewportHeight, setQuestionViewportHeight] = useState(0);
  const [questionContentHeight, setQuestionContentHeight] = useState(0);
  const [questionScrollY, setQuestionScrollY] = useState(0);

  const wordPages = useMemo(() => {
    const pages = [];
    for (let index = 0; index < wordBank.length; index += WORD_PAGE_SIZE) {
      pages.push(wordBank.slice(index, index + WORD_PAGE_SIZE));
    }
    return pages;
  }, [wordBank]);

  useEffect(() => {
    if (words.length === 0) {
      router.replace('/daily-task');
    }
  }, [words.length]);

  if (words.length === 0) {
    return null;
  }

  const allAnswered = words.every((word) => fillAnswers[word.id] !== undefined);
  const pageWords = wordPages[wordPageIndex] ?? [];
  const taskTitle = getTaskTitle(taskMode);

  function handleBlankPress(questionWordId: number) {
    if (fillAnswers[questionWordId] !== undefined) {
      clearFillAnswer(questionWordId);
      return;
    }

    if (selectedWordId !== null) {
      setFillAnswer(questionWordId, selectedWordId);
      setSelectedWordId(null);
    }
  }

  function handleSubmit() {
    const wrongIds = words
      .filter((word) => fillAnswers[word.id] !== word.id)
      .map((word) => word.id);

    if (wrongIds.length > 0) {
      setErrorWordIds(wrongIds);
      setErrorModalVisible(true);
      return;
    }

    router.push('/daily-task/listening');
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
      await recordWrongWords(db, errorWordIds, 'fill');
      setFillWrongWordIds(errorWordIds);
      setErrorModalVisible(false);
      if (taskSettings.advanceOnMistakes) {
        router.push('/daily-task/listening');
      }
    } catch {
      showNotice('保存失败', '无法将错题加入错题本，请稍后重试');
    } finally {
      savingMistakesRef.current = false;
    }
  }

  function handleQuestionLayout(event: LayoutChangeEvent) {
    setQuestionViewportHeight(event.nativeEvent.layout.height);
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
        <Text style={styles.headerTitle}>{taskTitle}-选词填空</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.questionCard}>
        <View onLayout={handleQuestionLayout} style={styles.scrollViewport}>
          <ScrollView
            contentContainerStyle={styles.questionContent}
            onContentSizeChange={(_, height) => setQuestionContentHeight(height)}
            onScroll={(event) => setQuestionScrollY(event.nativeEvent.contentOffset.y)}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
          >
            {questions.map((question, index) => {
              const answerWordId = fillAnswers[question.word.id];
              const answerWord = wordBank.find((word) => word.id === answerWordId);
              const isWrong = fillWrongWordIds.has(question.word.id);
              const [before, after] = question.sentence.split('______');

              return (
                <View key={question.word.id} style={styles.questionRow}>
                  <Text style={styles.sentence}>
                    {index + 1}. {before}
                    <Text
                      onPress={() => handleBlankPress(question.word.id)}
                      style={[
                        styles.blankText,
                        answerWord && styles.blankTextFilled,
                        isWrong && styles.blankTextWrong,
                      ]}
                    >
                      {answerWord?.word ?? '________'}
                    </Text>
                    {after}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
          <ScrollIndicator
            contentHeight={questionContentHeight}
            scrollY={questionScrollY}
            viewportHeight={questionViewportHeight}
          />
        </View>
      </View>

      <View style={styles.wordBank}>
        {pageWords.map((word) => {
          const selected = selectedWordId === word.id;
          const used = Object.values(fillAnswers).includes(word.id);
          return (
            <Pressable
              key={word.id}
              accessibilityRole="button"
              onPress={() => {
                setSelectedWordId(selected ? null : word.id);
              }}
              style={({ pressed }) => [
                styles.wordOption,
                selected && styles.wordOptionSelected,
                used && !selected && styles.wordOptionUsed,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.wordOptionText,
                  selected && styles.wordOptionTextSelected,
                ]}
              >
                {word.word}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.numberRow}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.numberRowScroll}
      >
        {wordPages.map((_, index) => (
          <Pressable
            key={`word-page-${index + 1}`}
            accessibilityRole="button"
            onPress={() => {
              setSelectedWordId(null);
              setWordPageIndex(index);
            }}
            style={[
              styles.numberChip,
              wordPageIndex === index && styles.numberChipActive,
            ]}
          >
            <Text
              style={[
                styles.numberText,
                wordPageIndex === index && styles.numberTextActive,
              ]}
            >
              {index + 1}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        disabled={!allAnswered}
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.submitButton,
          mode === 'custom' && styles.submitButtonCustom,
          !allAnswered && styles.submitButtonDisabled,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.submitText,
            mode === 'custom' &&
              allAnswered &&
              styles.submitTextCustom,
          ]}
        >
          提交
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
  backButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  blankText: {
    color: colors.accentText,
    textDecorationColor: colors.accentText,
    textDecorationLine: 'underline',
  },
  blankTextFilled: {
    fontWeight: '600',
  },
  blankTextWrong: {
    color: colors.red,
    textDecorationColor: colors.red,
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
  numberChip: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  numberChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.accentText,
    borderStyle: 'solid',
  },
  numberRow: {
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  numberRowScroll: {
    flexGrow: 0,
    height: 84,
  },
  numberText: {
    color: colors.text,
    fontSize: 19,
  },
  numberTextActive: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
  questionCard: {
    ...shadow,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    flex: 1,
    marginHorizontal: 18,
    minHeight: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  questionContent: {
    paddingBottom: 16,
    paddingRight: 38,
    paddingTop: 16,
    paddingLeft: 24,
  },
  questionRow: {
    marginBottom: 18,
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
  sentence: {
    color: colors.text,
    fontSize: 19,
    lineHeight: 30,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.graySoft,
    borderRadius: 28,
    height: 60,
    justifyContent: 'center',
    marginBottom: 16,
    marginHorizontal: 24,
  },
  submitButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  submitButtonCustom: {
    backgroundColor: colors.primary,
  },
  submitText: {
    color: colors.accentText,
    fontSize: 22,
    fontWeight: '700',
  },
  submitTextCustom: {
    color: colors.onPrimary,
  },
  wordBank: {
    alignItems: 'center',
    alignContent: 'space-between',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    height: 128,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  wordOption: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 20,
    width: '48%',
  },
  wordOptionSelected: {
    backgroundColor: colors.mint,
    borderColor: colors.accentText,
  },
  wordOptionText: {
    color: colors.text,
    fontSize: 18,
  },
  wordOptionTextSelected: {
    color: colors.accentText,
    fontWeight: '700',
  },
  wordOptionUsed: {
    opacity: 0.45,
  },
});
