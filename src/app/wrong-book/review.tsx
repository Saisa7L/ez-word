import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { f3Assets } from '@/constants/f3Assets';
import { colors, radii, spacing } from '@/constants/theme';
import { countWrongBookWords } from '@/database/wrongBookRepository';

export default function WrongBookReviewStartScreen() {
  const db = useSQLiteContext();
  const [wrongCount, setWrongCount] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      countWrongBookWords(db)
        .then((count) => {
          if (active) {
            setWrongCount(count);
          }
        })
        .catch(() => {
          if (active) {
            setWrongCount(0);
          }
        });

      return () => {
        active = false;
      };
    }, [db]),
  );

  function handleStart() {
    if (!wrongCount) {
      return;
    }
    router.push('/wrong-book/practice');
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="返回"
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft color={colors.primary} size={34} strokeWidth={2.3} />
        </Pressable>
        <Text style={styles.headerTitle}>错题回顾</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        <Image
          resizeMode="contain"
          source={f3Assets.taskStart}
          style={styles.illustration}
        />
        {wrongCount === null ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : (
          <>
            <Text style={styles.description}>
              {wrongCount === 0
                ? '暂无可回顾的错题'
                : `共有 ${wrongCount} 个错题，开始回顾吧`}
            </Text>
            {wrongCount === 0 ? (
              <Text style={styles.emptyHint}>
                完成每日任务后，填空和听写错误会进入错题本
              </Text>
            ) : null}
          </>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={wrongCount === null || wrongCount === 0}
        onPress={handleStart}
        style={({ pressed }) => [
          styles.startButton,
          (wrongCount === null || wrongCount === 0) &&
            styles.startButtonDisabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.startButtonText}>开始</Text>
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
    justifyContent: 'center',
    paddingBottom: 80,
    paddingHorizontal: 36,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 22,
    marginTop: 34,
    textAlign: 'center',
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 92,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  headerPlaceholder: {
    width: 48,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '700',
  },
  illustration: {
    height: 250,
    width: '100%',
  },
  pressed: {
    opacity: 0.7,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  startButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    height: 68,
    justifyContent: 'center',
    marginBottom: 20,
    marginHorizontal: spacing.lg,
  },
  startButtonDisabled: {
    backgroundColor: '#B9C0CA',
  },
  startButtonText: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: '700',
  },
});
