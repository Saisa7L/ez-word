import { StyleSheet, Switch, Text, View } from 'react-native';

import type { ThemeColors } from '@/constants/theme';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';

type SettingToggleRowProps = {
  hint: string;
  onValueChange: (value: boolean) => void;
  title: string;
  value: boolean;
};

export function SettingToggleRow({
  hint,
  onValueChange,
  title,
  value,
}: SettingToggleRowProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <Switch
        accessibilityHint={hint}
        accessibilityLabel={title}
        accessibilityState={{ checked: value }}
        onValueChange={onValueChange}
        thumbColor={colors.surface}
        trackColor={{ false: colors.border, true: colors.accentText }}
        value={value}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    copy: {
      flex: 1,
      marginRight: 18,
    },
    hint: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 4,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    title: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '600',
    },
  });
