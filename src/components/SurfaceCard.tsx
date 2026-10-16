import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radii } from '@/constants/theme';

export function SurfaceCard({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
  },
});
