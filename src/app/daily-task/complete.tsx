import { ArrowLeft } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SurfaceCard } from '@/components/SurfaceCard';
import { f3Assets } from '@/constants/f3Assets';
import { colors, shadow } from '@/constants/theme';
import { useDailyTask } from '@/features/daily-task/DailyTaskProvider';
import { returnToDailyTaskStart, returnToHome } from '@/utils/navigation';

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}分${seconds}秒`;
}

export default function DailyTaskCompleteScreen() {
  const { durationSeconds, resetTask, words, wrongWordIds } = useDailyTask();

  function handleHome() {
    resetTask();
    returnToHome();
  }

  function handleBackToStart() {
    resetTask();
    returnToDailyTaskStart();
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="返回首页"
          accessibilityRole="button"
          hitSlop={12}
          onPress={handleBackToStart}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ArrowLeft color={colors.primary} size={34} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>每日任务-完成</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>完成</Text>
        <Image source={f3Assets.taskComplete} style={styles.illustration} />

        <SurfaceCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>本次学习单词</Text>
            <Text style={styles.summaryValue}>
              {Math.max(0, words.length - wrongWordIds.size)}/{words.length}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>错题本增加</Text>
            <Text style={styles.summaryValue}>
              {wrongWordIds.size}/{words.length}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>学习时长</Text>
            <Text style={styles.summaryValue}>{formatDuration(durationSeconds)}</Text>
          </View>
        </SurfaceCard>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={handleHome}
        style={({ pressed }) => [styles.homeButton, pressed && styles.pressed]}
      >
        <Text style={styles.homeButtonText}>返回主界面</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 88,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  headerPlaceholder: {
    width: 48,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '700',
  },
  homeButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 62,
    justifyContent: 'center',
    marginBottom: 18,
    marginHorizontal: 28,
  },
  homeButtonText: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: '700',
  },
  illustration: {
    height: 250,
    marginTop: 8,
    width: 250,
  },
  pressed: {
    opacity: 0.7,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  summaryCard: {
    ...shadow,
    marginTop: 18,
    paddingHorizontal: 24,
    paddingVertical: 20,
    width: '100%',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 20,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '800',
  },
});
