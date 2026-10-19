import { Check } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '@/constants/theme';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';

type SelectionMarkerProps = {
  checkSize?: number;
  index: number;
  selected: boolean;
};

export function SelectionMarker({
  checkSize = 24,
  index,
  selected,
}: SelectionMarkerProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.marker, selected && styles.markerSelected]}>
      {selected ? (
        <Check
          color={colors.onPrimary}
          size={checkSize}
          strokeWidth={3}
        />
      ) : (
        <Text style={styles.index}>{index + 1}</Text>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    index: {
      color: colors.textSecondary,
      fontSize: 17,
      fontWeight: '600',
    },
    marker: {
      alignItems: 'center',
      borderColor: colors.accentText,
      borderRadius: 22,
      borderWidth: 1.5,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    markerSelected: {
      backgroundColor: colors.primary,
    },
  });
