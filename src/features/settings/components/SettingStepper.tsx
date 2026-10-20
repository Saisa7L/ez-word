import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/features/theme/ThemeProvider';
import { useLongPressStep } from '@/hooks/useLongPressStep';

type SettingStepperProps = {
  canDecrease: boolean;
  canIncrease: boolean;
  decreaseLabel: string;
  increaseLabel: string;
  marginTop?: number;
  onDecrease: () => void;
  onIncrease: () => void;
  unit: string;
  value: string;
  valueSize?: number;
};

export function SettingStepper({
  canDecrease,
  canIncrease,
  decreaseLabel,
  increaseLabel,
  marginTop = 20,
  onDecrease,
  onIncrease,
  unit,
  value,
  valueSize = 44,
}: SettingStepperProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const decrease = useLongPressStep(onDecrease, canDecrease);
  const increase = useLongPressStep(onIncrease, canIncrease);

  return (
    <View style={[styles.container, { marginTop }]}>
      <Pressable
        accessibilityLabel={decreaseLabel}
        accessibilityRole="button"
        disabled={!canDecrease}
        onPressIn={decrease.start}
        onPressOut={decrease.stop}
        style={({ pressed }) => [
          styles.stepButton,
          !canDecrease && styles.stepButtonDisabled,
          pressed && canDecrease && styles.pressed,
        ]}
      >
        <Minus color={colors.accentText} size={30} strokeWidth={2.4} />
      </Pressable>

      <View style={styles.value}>
        <Text style={[styles.valueNumber, { fontSize: valueSize }]}>
          {value}
        </Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>

      <Pressable
        accessibilityLabel={increaseLabel}
        accessibilityRole="button"
        disabled={!canIncrease}
        onPressIn={increase.start}
        onPressOut={increase.stop}
        style={({ pressed }) => [
          styles.stepButton,
          !canIncrease && styles.stepButtonDisabled,
          pressed && canIncrease && styles.pressed,
        ]}
      >
        <Plus color={colors.accentText} size={30} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    pressed: {
      opacity: 0.65,
    },
    stepButton: {
      alignItems: 'center',
      backgroundColor: colors.mint,
      borderRadius: 32,
      height: 64,
      justifyContent: 'center',
      width: 64,
    },
    stepButtonDisabled: {
      backgroundColor: colors.graySoft,
      opacity: 0.5,
    },
    unit: {
      color: colors.textSecondary,
      fontSize: 17,
      marginTop: 2,
    },
    value: {
      alignItems: 'center',
      minWidth: 126,
    },
    valueNumber: {
      color: colors.text,
      fontWeight: '800',
    },
  });
