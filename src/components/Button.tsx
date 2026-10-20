import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import {
  DEFAULT_GREEN,
  getContrastColor,
  type ThemeColors,
} from '@/constants/theme';
import { useThemedStyles } from '@/features/theme/ThemeProvider';

type ButtonVariant = 'danger' | 'primary' | 'secondary' | 'success';

type ButtonProps = {
  accessibilityLabel?: string;
  children: ReactNode;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: ButtonVariant;
};

export function Button({
  accessibilityLabel,
  children,
  disabled = false,
  onPress,
  style,
  textStyle,
  variant = 'primary',
}: ButtonProps) {
  const styles = useThemedStyles(createStyles);
  const variantStyle = {
    danger: styles.danger,
    primary: styles.primary,
    secondary: styles.secondary,
    success: styles.success,
  }[variant];
  const variantTextStyle = {
    danger: styles.dangerText,
    primary: styles.primaryText,
    secondary: styles.secondaryText,
    success: styles.successText,
  }[variant];

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variantStyle,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.text, variantTextStyle, textStyle]}>{children}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      alignItems: 'center',
      alignSelf: 'stretch',
      borderRadius: 28,
      justifyContent: 'center',
      minHeight: 58,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    danger: {
      backgroundColor: colors.red,
    },
    dangerText: {
      color: getContrastColor(colors.red),
    },
    disabled: {
      backgroundColor: colors.disabled,
      opacity: 0.75,
    },
    pressed: {
      opacity: 0.7,
    },
    primary: {
      backgroundColor: colors.primary,
    },
    primaryText: {
      color: colors.onPrimary,
    },
    secondary: {
      backgroundColor: colors.graySoft,
    },
    secondaryText: {
      color: colors.accentText,
    },
    success: {
      backgroundColor: DEFAULT_GREEN,
    },
    successText: {
      color: '#FFFFFF',
    },
    text: {
      fontSize: 21,
      fontWeight: '700',
      textAlign: 'center',
    },
  });
