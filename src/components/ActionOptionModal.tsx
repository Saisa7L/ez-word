import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/features/theme/ThemeProvider';

import { Dialog } from './Dialog';

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
    <Dialog onRequestClose={onClose} visible={visible}>
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
    </Dialog>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      justifyContent: 'center',
      minHeight: 54,
      paddingHorizontal: 18,
      paddingVertical: 12,
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
