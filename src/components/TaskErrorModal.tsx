import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/features/theme/ThemeProvider';

type TaskErrorModalProps = {
  errorCount: number;
  onConfirm: () => void;
  visible: boolean;
};

export function TaskErrorModal({
  errorCount,
  onConfirm,
  visible,
}: TaskErrorModalProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onConfirm}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>填写有误</Text>
          <Text style={styles.message}>
            有 {errorCount} 处填写错误，请修改后再继续。
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onConfirm}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>确认</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 58,
    justifyContent: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 21,
    fontWeight: '700',
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    maxWidth: 430,
    padding: 28,
    width: '82%',
  },
  message: {
    color: colors.textSecondary,
    fontSize: 18,
    lineHeight: 28,
    marginTop: 16,
    textAlign: 'center',
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
  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '700',
    textAlign: 'center',
  },
});
