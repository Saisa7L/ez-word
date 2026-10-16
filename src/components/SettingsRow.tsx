import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { colors } from '@/constants/theme';

type SettingsRowProps = {
  backgroundColor: string;
  icon: ImageSourcePropType;
  iconColor: string;
  label: string;
  last?: boolean;
  hideChevron?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SettingsRow({
  backgroundColor,
  icon,
  iconColor,
  label,
  last = false,
  hideChevron = false,
  onPress,
  style,
}: SettingsRowProps) {
  const content = (
    <>
      <View style={styles.left}>
        <View style={[styles.iconBox, { backgroundColor }]}>
          <Image source={icon} style={[styles.icon, { tintColor: iconColor }]} />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>
      {!hideChevron ? (
        <ChevronRight color="#A8AFBC" size={28} strokeWidth={2} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          !last && styles.rowBorder,
          style,
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.row, !last && styles.rowBorder, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    height: 31,
    width: 31,
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: 14,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  label: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '600',
    marginLeft: 18,
  },
  left: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  pressed: {
    opacity: 0.65,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 91,
  },
  rowBorder: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
