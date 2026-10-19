import { ArrowLeft } from 'lucide-react-native';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  radii,
  shadow,
  spacing,
  type ThemeColors,
} from '@/constants/theme';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';

type GreenSheetScreenProps = {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  onBack?: () => void;
  scrollable?: boolean;
  scrollEnabled?: boolean;
  title: string;
};

export function GreenSheetScreen({
  children,
  contentContainerStyle,
  onBack,
  scrollable = true,
  scrollEnabled = true,
  title,
}: GreenSheetScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const contentStyle = [
    styles.content,
    { paddingBottom: Math.max(spacing.xl, insets.bottom + 24) },
    contentContainerStyle,
  ];

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          {onBack ? (
            <Pressable
              accessibilityLabel="返回"
              accessibilityRole="button"
              hitSlop={12}
              onPress={onBack}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <ArrowLeft color={colors.onPrimary} size={34} strokeWidth={2.2} />
            </Pressable>
          ) : (
            <View style={styles.headerPlaceholder} />
          )}
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </SafeAreaView>

      <View style={styles.sheetArea}>
        <View style={styles.sheet}>
          {scrollable ? (
            <ScrollView
              contentContainerStyle={contentStyle}
              scrollEnabled={scrollEnabled}
              showsVerticalScrollIndicator={false}
              style={styles.scroll}
            >
              {children}
            </ScrollView>
          ) : (
            <View
              style={[
                styles.scroll,
                styles.nonScrollContent,
                { paddingBottom: Math.max(spacing.xl, insets.bottom + 24) },
              ]}
            >
              {children}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  content: {
    paddingHorizontal: 0,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 150,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  headerPlaceholder: {
    width: 48,
  },
  headerSafeArea: {
    backgroundColor: colors.primary,
  },
  headerTitle: {
    color: colors.onPrimary,
    fontSize: 25,
    fontWeight: '700',
  },
  nonScrollContent: {
    paddingBottom: 0,
  },
  pressed: {
    opacity: 0.65,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scroll: {
    flex: 1,
    marginTop: 16,
  },
  sheet: {
    ...shadow,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    bottom: 0,
    left: spacing.lg,
    overflow: 'hidden',
    position: 'absolute',
    right: spacing.lg,
    top: -32,
  },
  sheetArea: {
    flex: 1,
    position: 'relative',
  },
});
