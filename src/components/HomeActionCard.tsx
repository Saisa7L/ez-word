import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { radii, shadow, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/features/theme/ThemeProvider';

type HomeActionCardProps = {
  backgroundColor: string;
  icon: ImageSourcePropType;
  iconColor: string;
  onPress?: () => void;
  title: string;
};

export function HomeActionCard({
  backgroundColor,
  icon,
  iconColor,
  onPress,
  title,
}: HomeActionCardProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.title}>{title}</Text>
      <View style={[styles.iconBox, { backgroundColor }]}>
        <Image source={icon} style={[styles.icon, { tintColor: iconColor }]} />
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      ...shadow,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 92,
      paddingHorizontal: 22,
    },
    icon: {
      height: 32,
      width: 32,
    },
    iconBox: {
      alignItems: 'center',
      borderRadius: 16,
      height: 66,
      justifyContent: 'center',
      width: 66,
    },
    pressed: {
      opacity: 0.7,
    },
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '700',
    },
  });
