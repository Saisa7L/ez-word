import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScrollIndicator } from '@/components/ScrollIndicator';
import { radii, shadow, type ThemeColors } from '@/constants/theme';
import type { TaskWord } from '@/domain/word/taskWord';
import { useThemedStyles } from '@/features/theme/ThemeProvider';

type ListeningAnswerListProps = {
  answers: Record<number, string>;
  onChangeAnswer: (wordId: number, answer: string) => void;
  words: TaskWord[];
  wrongWordIds: Set<number>;
};

export function ListeningAnswerList({
  answers,
  onChangeAnswer,
  words,
  wrongWordIds,
}: ListeningAnswerListProps) {
  const styles = useThemedStyles(createStyles);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  return (
    <View style={styles.answerCard}>
      <View
        onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
        style={styles.scrollViewport}
      >
        <ScrollView
          contentContainerStyle={styles.answerContent}
          onContentSizeChange={(_, height) => setContentHeight(height)}
          onScroll={(event) => setScrollY(event.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          {words.map((word, index) => {
            const isWrong = wrongWordIds.has(word.id);
            return (
              <View key={word.id} style={styles.answerRow}>
                <Text style={styles.answerNumber}>{index + 1}.</Text>
                <TextInput
                  accessibilityLabel={`第 ${index + 1} 个单词的听力答案`}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={(value) => onChangeAnswer(word.id, value)}
                  spellCheck={false}
                  style={[styles.input, isWrong && styles.inputWrong]}
                  value={answers[word.id] ?? ''}
                />
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
      paddingLeft: 24,
      paddingRight: 38,
      paddingTop: 16,
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
    scrollView: {
      flex: 1,
    },
    scrollViewport: {
      flex: 1,
      marginVertical: 24,
      position: 'relative',
    },
  });
