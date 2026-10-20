import { useState } from 'react';
import {
  type LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScrollIndicator } from '@/components/ScrollIndicator';
import { radii, shadow, type ThemeColors } from '@/constants/theme';
import type { TaskWord } from '@/domain/word/taskWord';
import type { DailyTaskQuestion } from '@/features/daily-task/types';
import { useThemedStyles } from '@/features/theme/ThemeProvider';

type FillBlankQuestionCardProps = {
  answers: Record<number, number>;
  onBlankPress: (questionWordId: number) => void;
  questions: DailyTaskQuestion[];
  wordBank: TaskWord[];
  wrongWordIds: Set<number>;
};

export function FillBlankQuestionCard({
  answers,
  onBlankPress,
  questions,
  wordBank,
  wrongWordIds,
}: FillBlankQuestionCardProps) {
  const styles = useThemedStyles(createStyles);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  function handleLayout(event: LayoutChangeEvent) {
    setViewportHeight(event.nativeEvent.layout.height);
  }

  return (
    <View style={styles.questionCard}>
      <View onLayout={handleLayout} style={styles.scrollViewport}>
        <ScrollView
          contentContainerStyle={styles.questionContent}
          onContentSizeChange={(_, height) => setContentHeight(height)}
          onScroll={(event) => setScrollY(event.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          {questions.map((question, index) => {
            const answerWordId = answers[question.word.id];
            const answerWord = wordBank.find(
              (word) => word.id === answerWordId,
            );
            const isWrong = wrongWordIds.has(question.word.id);
            const [before, after] = question.sentence.split('______');

            return (
              <View key={question.word.id} style={styles.questionRow}>
                <Text style={styles.sentence}>
                  {index + 1}. {before}
                  <Text
                    onPress={() => onBlankPress(question.word.id)}
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
          contentHeight={contentHeight}
          scrollY={scrollY}
          viewportHeight={viewportHeight}
        />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      paddingLeft: 24,
      paddingRight: 38,
      paddingTop: 16,
    },
    questionRow: {
      marginBottom: 18,
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
  });
