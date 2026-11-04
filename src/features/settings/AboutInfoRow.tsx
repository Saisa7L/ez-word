import { ExternalLink } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/features/theme/ThemeProvider';

type AboutInfoRowProps = {
  accessibilityRole?: 'button' | 'link';
  icon: ReactNode;
  iconBackground: string;
  label: string;
  last?: boolean;
  onPress?: () => void;
  value: string;
};

export function AboutInfoRow({
  accessibilityRole = 'link',
  icon,
  iconBackground,
  label,
  last = false,
  onPress,
  value,
}: AboutInfoRowProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const content = (
    <>
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, { backgroundColor: iconBackground }]}>
          {icon}
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowValueBox}>
        <Text ellipsizeMode="middle" numberOfLines={1} style={styles.rowValue}>
          {value}
        </Text>
        {onPress ? (
          <ExternalLink color={colors.textMuted} size={16} strokeWidth={2} />
        ) : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole={accessibilityRole}
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          !last && styles.rowBorder,
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.row, !last && styles.rowBorder]}>{content}</View>;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    pressed: {
      opacity: 0.65,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 72,
    },
    rowBorder: {
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    rowIcon: {
      alignItems: 'center',
      borderRadius: 12,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    rowLabel: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '600',
      marginLeft: 13,
    },
    rowLeft: {
      alignItems: 'center',
      flexDirection: 'row',
      flexShrink: 1,
    },
    rowValue: {
      color: colors.textSecondary,
      flexShrink: 1,
      fontSize: 13,
      textAlign: 'right',
    },
    rowValueBox: {
      alignItems: 'center',
      flexDirection: 'row',
      flexShrink: 1,
      gap: 6,
      justifyContent: 'flex-end',
      marginLeft: 12,
      maxWidth: '58%',
    },
  });
