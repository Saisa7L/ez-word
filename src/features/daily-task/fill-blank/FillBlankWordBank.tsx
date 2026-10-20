import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { spacing, type ThemeColors } from '@/constants/theme';
import type { TaskWord } from '@/domain/word/taskWord';
import { useThemedStyles } from '@/features/theme/ThemeProvider';

const WORD_PAGE_SIZE = 4;

type FillBlankWordBankProps = {
  onSelectWord: (wordId: number | null) => void;
  selectedWordId: number | null;
  usedWordIds: Set<number>;
  wordBank: TaskWord[];
};

export function FillBlankWordBank({
  onSelectWord,
  selectedWordId,
  usedWordIds,
  wordBank,
}: FillBlankWordBankProps) {
  const styles = useThemedStyles(createStyles);
  const [pageIndex, setPageIndex] = useState(0);
  const pages = useMemo(() => {
    const nextPages: TaskWord[][] = [];
    for (let index = 0; index < wordBank.length; index += WORD_PAGE_SIZE) {
      nextPages.push(wordBank.slice(index, index + WORD_PAGE_SIZE));
    }
    return nextPages;
  }, [wordBank]);
  const pageWords = pages[pageIndex] ?? [];

  return (
    <>
      <View style={styles.wordBank}>
        {pageWords.map((word) => {
          const selected = selectedWordId === word.id;
          const used = usedWordIds.has(word.id);
          return (
            <Pressable
              accessibilityLabel={word.word}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={word.id}
              onPress={() => onSelectWord(selected ? null : word.id)}
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
        {pages.map((_, index) => (
          <Pressable
            accessibilityLabel={`第 ${index + 1} 页词库`}
            accessibilityRole="button"
            accessibilityState={{ selected: pageIndex === index }}
            key={`word-page-${index + 1}`}
            onPress={() => {
              onSelectWord(null);
              setPageIndex(index);
            }}
            style={[
              styles.numberChip,
              pageIndex === index && styles.numberChipActive,
            ]}
          >
            <Text
              style={[
                styles.numberText,
                pageIndex === index && styles.numberTextActive,
              ]}
            >
              {index + 1}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
