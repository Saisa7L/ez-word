import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/features/theme/ThemeProvider';

export type ActionOption = {
  label: string;
  onPress: () => void;
  tone?: 'default' | 'primary' | 'danger';
};

type ActionOptionModalProps = {
  message?: string;
  onClose: () => void;
  options: ActionOption[];
  title: string;
  visible: boolean;
};

export function ActionOptionModal({
  message,
  onClose,
  options,
  title,
  visible,
}: ActionOptionModalProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.options}>
            {options.map((option) => (
              <Pressable
                key={option.label}
                accessibilityRole="button"
                onPress={() => {
                  onClose();
                  option.onPress();
                }}
                style={({ pressed }) => [
                  styles.optionButton,
                  option.tone === 'primary' && styles.optionPrimary,
                  option.tone === 'danger' && styles.optionDanger,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    option.tone === 'primary' && styles.optionTextPrimary,
                    option.tone === 'danger' && styles.optionTextDanger,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    maxWidth: 430,
    padding: 24,
    width: '86%',
  },
  message: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
    textAlign: 'center',
  },
  optionButton: {
    alignItems: 'center',
    backgroundColor: colors.graySoft,
    borderRadius: 24,
    height: 54,
    justifyContent: 'center',
  },
  optionDanger: {
    backgroundColor: colors.redSoft,
  },
  optionPrimary: {
    backgroundColor: colors.mint,
  },
  optionText: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '600',
  },
  optionTextDanger: {
    color: colors.red,
  },
  optionTextPrimary: {
    color: colors.accentText,
  },
  options: {
    gap: 10,
    marginTop: 22,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.66,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
});
