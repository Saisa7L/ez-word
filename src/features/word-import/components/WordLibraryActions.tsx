import { BookOpen, Trash2 } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/features/theme/ThemeProvider';

type WordLibraryActionsProps = {
  activeWordCount: number | null;
  clearDisabled: boolean;
  isClearing: boolean;
  onClear: () => void;
  onViewLibrary: () => void;
};

export function WordLibraryActions({
  activeWordCount,
  clearDisabled,
  isClearing,
  onClear,
  onViewLibrary,
}: WordLibraryActionsProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.section}>
      <Text style={styles.countText}>
        {activeWordCount === null
          ? '正在读取当前词库'
          : `当前词库共 ${activeWordCount} 个单词`}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onViewLibrary}
        style={({ pressed }) => [styles.viewButton, pressed && styles.pressed]}
      >
        <BookOpen color={colors.accentText} size={24} strokeWidth={2.2} />
        <Text style={styles.viewText}>查看当前词库</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={clearDisabled}
        onPress={onClear}
        style={({ pressed }) => [
          styles.clearButton,
          clearDisabled && styles.clearButtonDisabled,
          pressed && !clearDisabled && styles.pressed,
        ]}
      >
        {isClearing ? (
          <ActivityIndicator color={colors.red} />
        ) : (
          <>
            <Trash2 color={colors.red} size={24} strokeWidth={2.2} />
            <Text style={styles.clearText}>清空已导入单词</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    clearButton: {
      alignItems: 'center',
      borderColor: colors.red,
      borderRadius: 24,
      borderWidth: 1.5,
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'center',
      minHeight: 56,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    clearButtonDisabled: {
      borderColor: colors.border,
      opacity: 0.5,
    },
    clearText: {
      color: colors.red,
      fontSize: 19,
      fontWeight: '600',
    },
    countText: {
      color: colors.textSecondary,
      fontSize: 16,
      marginBottom: 12,
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.65,
    },
    section: {
      marginTop: 28,
    },
    viewButton: {
      alignItems: 'center',
      borderColor: colors.accentText,
      borderRadius: 24,
      borderWidth: 1.5,
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'center',
      marginBottom: 14,
      minHeight: 56,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    viewText: {
      color: colors.accentText,
      fontSize: 19,
      fontWeight: '600',
    },
  });
