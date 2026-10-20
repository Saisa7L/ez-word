import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { type ThemeColors } from '@/constants/theme';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';

export function TaskPhasePlaceholder() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View
      accessibilityLiveRegion="polite"
      style={styles.screen}
    >
      <ActivityIndicator color={colors.accentText} size="large" />
      <Text style={styles.label}>正在恢复任务阶段</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    label: {
      color: colors.textSecondary,
      fontSize: 17,
      marginTop: 14,
    },
    screen: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flex: 1,
      justifyContent: 'center',
    },
  });
