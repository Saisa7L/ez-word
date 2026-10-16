import {
  Image,
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
  style?: StyleProp<ViewStyle>;
};

export function SettingsRow({
  backgroundColor,
  icon,
  iconColor,
  label,
  last = false,
  hideChevron = false,
  style,
}: SettingsRowProps) {
  return (
    <View style={[styles.row, !last && styles.rowBorder, style]}>
      <View style={styles.left}>
        <View style={[styles.iconBox, { backgroundColor }]}>
          <Image source={icon} style={[styles.icon, { tintColor: iconColor }]} />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>
      {!hideChevron ? (
        <ChevronRight color="#A8AFBC" size={28} strokeWidth={2} />
      ) : null}
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
