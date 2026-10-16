import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { colors, radii, shadow } from '@/constants/theme';

type HomeActionCardProps = {
  backgroundColor: string;
  icon: ImageSourcePropType;
  iconColor: string;
  title: string;
};

export function HomeActionCard({
  backgroundColor,
  icon,
  iconColor,
  title,
}: HomeActionCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={[styles.iconBox, { backgroundColor }]}>
        <Image source={icon} style={[styles.icon, { tintColor: iconColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
});
