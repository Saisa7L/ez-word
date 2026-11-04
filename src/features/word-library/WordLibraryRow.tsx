import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { SelectionMarker } from '@/components/SelectionMarker';
import type { ThemeColors } from '@/constants/theme';
import type { LearningStatus, WordRecord } from '@/database/wordsRepository';
import { useThemedStyles } from '@/features/theme/ThemeProvider';

const STATUS_LABELS: Record<LearningStatus, string> = {
  learned: '已学习',
  unlearned: '未学习',
  wrong: '错题',
};

type WordLibraryRowProps = {
  index: number;
  isLast: boolean;
  onPress: () => void;
  /** 按下态样式由页面持有，保证与页面其他按钮一致。 */
  pressedStyle?: StyleProp<ViewStyle>;
  selected: boolean;
  word: WordRecord;
};

/**
 * 词库列表的单行：单词、释义、音标、学习状态徽标与选择标记。
 */
export function WordLibraryRow({
  index,
  isLast,
  onPress,
  pressedStyle,
  selected,
  word,
}: WordLibraryRowProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.wordRow,
        !isLast && styles.wordRowBorder,
        selected && styles.wordRowSelected,
        pressed && pressedStyle,
      ]}
    >
      <View style={styles.wordCopy}>
        <View style={styles.wordHeader}>
          <Text style={styles.word}>{word.word}</Text>
          <View
            style={[
              styles.statusBadge,
              word.learning_status === 'wrong' && styles.statusBadgeWrong,
              word.learning_status === 'learned' && styles.statusBadgeLearned,
            ]}
          >
            <Text style={styles.statusText}>
              {STATUS_LABELS[word.learning_status]}
            </Text>
          </View>
        </View>
        <Text numberOfLines={2} style={styles.meaning}>
          {word.meaning}
        </Text>
        <Text style={styles.phonetic}>{word.phonetic || '暂无音标'}</Text>
      </View>
      <SelectionMarker index={index} selected={selected} />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    meaning: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 6,
    },
    phonetic: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 6,
    },
    statusBadge: {
      backgroundColor: colors.graySoft,
      borderRadius: 10,
      marginLeft: 10,
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    statusBadgeLearned: {
      backgroundColor: colors.blueSoft,
    },
    statusBadgeWrong: {
      backgroundColor: colors.redSoft,
    },
    statusText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    word: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
    },
    wordCopy: {
      flex: 1,
      marginRight: 16,
    },
    wordHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    wordRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 86,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    wordRowBorder: {
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    wordRowSelected: {
      backgroundColor: colors.mint,
    },
  });
