import { Tabs } from 'expo-router';
import {
  Image,
  StyleSheet,
  type ColorValue,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { f1Assets } from '@/constants/f1Assets';
import type { ThemeColors } from '@/constants/theme';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';

type TabIconProps = {
  color: ColorValue;
  source: ImageSourcePropType;
};

function TabIcon({ color, source }: TabIconProps) {
  const styles = useThemedStyles(createStyles);
  return <Image source={source} style={[styles.icon, { tintColor: color }]} />;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const tabBarBottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.label,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 58 + tabBarBottomPadding,
            paddingBottom: tabBarBottomPadding,
          },
        ],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => <TabIcon color={color} source={f1Assets.tabHome} />,
        }}
      />
      <Tabs.Screen
        name="wrong-book"
        options={{
          title: '错题本',
          tabBarIcon: ({ color }) => <TabIcon color={color} source={f1Assets.tabWrongBook} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => <TabIcon color={color} source={f1Assets.tabProfile} />,
        }}
      />
    </Tabs>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  icon: {
    height: 25,
    width: 25,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    shadowColor: colors.shadow,
    shadowOffset: { height: -3, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
});
