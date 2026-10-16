import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

type ExitTaskModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
  visible: boolean;
};

export function ExitTaskModal({
  onCancel,
  onConfirm,
  visible,
}: ExitTaskModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>退出每日任务？</Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.buttonText}>是</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.buttonText}>否</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 34,
    width: '100%',
  },
  button: {
    alignItems: 'center',
    borderRadius: 28,
    height: 58,
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: colors.red,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  dialog: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    maxWidth: 430,
    paddingHorizontal: 34,
    paddingVertical: 40,
    width: '82%',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
  },
});
