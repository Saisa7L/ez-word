import { Check } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing, type ThemeColors } from '@/constants/theme';
import type { WordImportSummary } from '@/features/word-import/types';
import { useAppTheme, useThemedStyles } from '@/features/theme/ThemeProvider';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type ImportResultModalProps = {
  onConfirm: () => void;
  summary: WordImportSummary | null;
  visible: boolean;
};

type ResultRowProps = {
  label: string;
  value: number;
};

function ResultRow({ label, value }: ResultRowProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

export function ImportResultModal({
  onConfirm,
  summary,
  visible,
}: ImportResultModalProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const reduceMotion = useReducedMotion();

  return (
    <Modal
      animationType={reduceMotion ? 'none' : 'fade'}
      onRequestClose={onConfirm}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.checkCircle}>
            <Check color={colors.accentText} size={54} strokeWidth={4} />
          </View>
          <Text style={styles.title}>导入成功</Text>

          <View style={styles.results}>
            <ResultRow label="成功" value={summary?.inserted ?? 0} />
            <ResultRow label="更新" value={summary?.updated ?? 0} />
            <ResultRow label="跳过" value={summary?.rejectedRows.length ?? 0} />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.confirmButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.confirmText}>确认</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    checkCircle: {
      alignItems: 'center',
      height: 70,
      justifyContent: 'center',
      width: 70,
    },
    confirmButton: {
      alignItems: 'center',
      alignSelf: 'stretch',
      backgroundColor: colors.primary,
      borderRadius: 28,
      minHeight: 58,
      paddingVertical: 12,
      justifyContent: 'center',
      marginTop: 28,
    },
    confirmText: {
      color: colors.onPrimary,
      fontSize: 21,
      fontWeight: '700',
    },
    dialog: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      maxWidth: 430,
      padding: 28,
      width: '82%',
    },
    overlay: {
      alignItems: 'center',
      backgroundColor: colors.overlay,
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    pressed: {
      opacity: 0.7,
    },
    resultLabel: {
      color: colors.textSecondary,
      fontSize: 18,
    },
    resultRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 5,
    },
    results: {
      marginTop: 18,
      width: '100%',
    },
    resultValue: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '700',
    },
    title: {
      color: colors.text,
      fontSize: 25,
      fontWeight: '700',
      marginTop: 12,
    },
  });
