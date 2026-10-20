import type { ReactNode } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { radii, spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/features/theme/ThemeProvider';

type DialogProps = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  onRequestClose: () => void;
  visible: boolean;
};

export function Dialog({
  children,
  contentStyle,
  onRequestClose,
  visible,
}: DialogProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onRequestClose}
      transparent
      visible={visible}
    >
      <View
        accessibilityViewIsModal
        importantForAccessibility="yes"
        style={styles.overlay}
      >
        <View accessibilityRole="alert" style={[styles.dialog, contentStyle]}>
          {children}
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
    overlay: {
      alignItems: 'center',
      backgroundColor: colors.overlay,
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
  });
