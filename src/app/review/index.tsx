import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Minus, Plus } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ActionOptionModal } from '@/components/ActionOptionModal';
import { GreenSheetScreen } from '@/components/GreenSheetScreen';
import { colors, radii } from '@/constants/theme';
import { listReviewWords } from '@/database/reviewRepository';
import {
  getDailyTaskSettings,
  type DailyTaskSettings,
} from '@/database/settingsRepository';
import { useDailyTask } from '@/features/daily-task/DailyTaskProvider';
import { useLongPressStep } from '@/hooks/useLongPressStep';
import { shuffle } from '@/utils/shuffle';

const REVIEW_DAYS_MIN = 1;
const REVIEW_DAYS_MAX = 9999;

export default function ReviewStartScreen() {
  const db = useSQLiteContext();
  const { startTask } = useDailyTask();
  const [selectedDays, setSelectedDays] = useState<number | null>(7);
  const selectedDaysRef = useRef<number | null>(7);
  const lastNumericDaysRef = useRef(7);
  const [settings, setSettings] = useState<DailyTaskSettings | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [notice, setNotice] = useState<{
    message: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    let active = true;

    getDailyTaskSettings(db)
      .then((nextSettings) => {
        if (active) {
          setSettings(nextSettings);
        }
      })
      .catch(() => {
        if (active) {
          setSettings(null);
        }
      });

    return () => {
      active = false;
    };
  }, [db]);

  function changeDays(step: number) {
    const currentDays = selectedDaysRef.current;
    if (currentDays === null) {
      return;
    }

    const nextDays = Math.min(
      REVIEW_DAYS_MAX,
      Math.max(REVIEW_DAYS_MIN, currentDays + step),
    );
    selectedDaysRef.current = nextDays;
    lastNumericDaysRef.current = nextDays;
    setSelectedDays(nextDays);
  }

  const canDecreaseDays =
    selectedDays !== null && selectedDays > REVIEW_DAYS_MIN;
  const canIncreaseDays =
    selectedDays !== null && selectedDays < REVIEW_DAYS_MAX;
  const decreaseDays = useLongPressStep(
    () => changeDays(-1),
    canDecreaseDays,
  );
  const increaseDays = useLongPressStep(
    () => changeDays(1),
    canIncreaseDays,
  );

  async function handleStart() {
    if (!settings || isStarting) {
      return;
    }

    setIsStarting(true);
    try {
      const words = await listReviewWords(db, selectedDays);
      const selectedWords = shuffle(words).slice(
        0,
        settings.wordReviewWordLimit,
      );
      if (selectedWords.length === 0) {
        setNotice({
          message: '当前范围内没有已学习的单词',
          title: '暂无可复习单词',
        });
        return;
      }

      startTask(selectedWords, settings, 'wordReview');
      router.push('/daily-task/fill-blank');
    } catch {
      setNotice({
        message: '无法读取复习单词，请稍后重试',
        title: '加载失败',
      });
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <>
      <GreenSheetScreen
        onBack={() => router.back()}
        title="单词再练"
      >
        <View style={styles.content}>
        <Text style={styles.title}>选择复习范围</Text>
        <Text style={styles.hint}>
          从选择的范围内随机抽取单词，练习时跳过认识单词，直接进行填空和听力。
        </Text>

        <View style={styles.rangeStepper}>
          <Pressable
            accessibilityLabel="减少复习范围天数"
            accessibilityRole="button"
            disabled={!canDecreaseDays}
            onPressIn={decreaseDays.start}
            onPressOut={decreaseDays.stop}
            style={({ pressed }) => [
              styles.stepButton,
              !canDecreaseDays && styles.stepButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Minus color={colors.primary} size={30} strokeWidth={2.4} />
          </Pressable>
          <View style={styles.rangeValue}>
            <Text style={styles.rangeNumber}>
              {selectedDays === null ? '全部' : selectedDays}
            </Text>
            <Text style={styles.rangeUnit}>
              {selectedDays === null ? '已学单词' : '天'}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="增加复习范围天数"
            accessibilityRole="button"
            disabled={!canIncreaseDays}
            onPressIn={increaseDays.start}
            onPressOut={increaseDays.stop}
            style={({ pressed }) => [
              styles.stepButton,
              !canIncreaseDays && styles.stepButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Plus color={colors.primary} size={30} strokeWidth={2.4} />
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (selectedDays === null) {
              selectedDaysRef.current = lastNumericDaysRef.current;
              setSelectedDays(lastNumericDaysRef.current);
            } else {
              selectedDaysRef.current = null;
              lastNumericDaysRef.current = selectedDays;
              setSelectedDays(null);
            }
          }}
          style={[
            styles.allButton,
            selectedDays === null && styles.allButtonActive,
          ]}
        >
          <Text
            style={[
              styles.allButtonText,
              selectedDays === null && styles.allButtonTextActive,
            ]}
          >
            全部已学单词
          </Text>
        </Pressable>

        <View style={styles.countPanel}>
          {settings ? (
            <>
              <Text style={styles.countNumber}>
                {settings.wordReviewWordLimit}
              </Text>
              <Text style={styles.countLabel}>个单词/次，开始后可随机抽取</Text>
            </>
          ) : (
            <ActivityIndicator color={colors.primary} size="large" />
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!settings || isStarting}
          onPress={() => {
            void handleStart();
          }}
          style={({ pressed }) => [
            styles.startButton,
            (!settings || isStarting) && styles.startButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          {isStarting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.startText}>开始复习</Text>
          )}
        </Pressable>
        </View>
      </GreenSheetScreen>
      <ActionOptionModal
        message={notice?.message}
        onClose={() => setNotice(null)}
        options={[
          {
            label: '知道了',
            onPress: () => {},
            tone: 'primary',
          },
        ]}
        title={notice?.title ?? ''}
        visible={notice !== null}
      />
    </>
  );
}

const styles = StyleSheet.create({
  allButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    marginTop: 12,
  },
  allButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  allButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  allButtonTextActive: {
    color: colors.surface,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 24,
  },
  countLabel: {
    color: colors.textSecondary,
    fontSize: 17,
    marginTop: 4,
  },
  countNumber: {
    color: colors.text,
    fontSize: 50,
    fontWeight: '800',
  },
  countPanel: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  pressed: {
    opacity: 0.68,
  },
  rangeNumber: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '800',
  },
  rangeStepper: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  rangeUnit: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 2,
  },
  rangeValue: {
    alignItems: 'center',
    minWidth: 120,
  },
  startButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 60,
    justifyContent: 'center',
    marginTop: 18,
  },
  startButtonDisabled: {
    backgroundColor: '#B9C0CA',
  },
  startText: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: '700',
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
  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '700',
  },
});
