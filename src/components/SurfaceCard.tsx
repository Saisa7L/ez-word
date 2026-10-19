import { StyleSheet, View, type ViewProps } from 'react-native';

import { radii, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/features/theme/ThemeProvider';

export function SurfaceCard({ children, style, ...props }: ViewProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
  },
});
