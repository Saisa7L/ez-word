import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/features/theme/ThemeProvider';

type ProfileOptionRowProps = {
  accessibilityLabel: string;
  icon: ReactNode;
  label: string;
  onPress: () => void;
  /** 按下态样式由页面持有，保证与页面其他按钮一致。 */
  pressedStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  trailing: ReactNode;
};

/**
 * 个人资料页的选项行：左侧图标 + 文案 + 右侧自定义控件。
 */
export function ProfileOptionRow({
  accessibilityLabel,
  icon,
  label,
  onPress,
  pressedStyle,
  style,
  trailing,
}: ProfileOptionRowProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.colorOption,
        style,
        pressed && pressedStyle,
      ]}
    >
      {icon}
      <Text style={styles.colorOptionText}>{label}</Text>
      {trailing}
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    colorOption: {
      alignItems: 'center',
      backgroundColor: colors.graySoft,
      borderRadius: 22,
      flexDirection: 'row',
      gap: 12,
      height: 56,
      marginTop: 20,
      paddingHorizontal: 18,
    },
    colorOptionText: {
      color: colors.text,
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
    },
  });
