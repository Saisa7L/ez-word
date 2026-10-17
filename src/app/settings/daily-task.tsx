import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft, Minus, Plus } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { colors, radii, shadow, spacing } from '@/constants/theme';
import {
  DAILY_WORD_LIMIT_MAX,
  DAILY_WORD_LIMIT_MIN,
  DAILY_WORD_LIMIT_STEP,
  getDailyTaskSettings,
  LISTENING_RATES,
  LISTENING_WORD_INTERVAL_MAX,
  LISTENING_WORD_INTERVAL_MIN,
  LISTENING_WORD_INTERVAL_STEP,
  normalizeDailyWordLimit,
  normalizeListeningWordInterval,
  saveDailyTaskSettings,
  type DailyTaskSettings,
} from '@/database/settingsRepository';

const HOLD_REPEAT_DELAY_MS = 450;
const HOLD_REPEAT_INTERVAL_MS = 72;

function formatRate(rate: number): string {
  return `${rate}x`;
}

function useLongPressStep(onStep: () => void, enabled: boolean) {
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const enabledRef = useRef(enabled);

  const stop = useCallback(() => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    if (repeatTimerRef.current) {
      clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!enabledRef.current) {
      return;
    }

    stop();
    onStep();
    delayTimerRef.current = setTimeout(() => {
      repeatTimerRef.current = setInterval(() => {
        if (!enabledRef.current) {
          stop();
          return;
        }
        onStep();
      }, HOLD_REPEAT_INTERVAL_MS);
    }, HOLD_REPEAT_DELAY_MS);
  }, [onStep, stop]);

  useEffect(() => {
    enabledRef.current = enabled;
    if (!enabled) {
      stop();
    }
  }, [enabled, stop]);

  useEffect(() => stop, [stop]);

  return { start, stop };
}

type ToggleRowProps = {
  hint: string;
  onValueChange: (value: boolean) => void;
  title: string;
  value: boolean;
};

function ToggleRow({
  hint,
  onValueChange,
  title,
  value,
}: ToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionHint}>{hint}</Text>
      </View>
      <Switch
        onValueChange={onValueChange}
        thumbColor={colors.surface}
        trackColor={{ false: colors.border, true: colors.primary }}
        value={value}
      />
    </View>
  );
}

export default function DailyTaskSettingsScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<DailyTaskSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;

    getDailyTaskSettings(db)
      .then((storedSettings) => {
        if (active) {
          setSettings(storedSettings);
        }
      })
      .catch(() => {
        if (active) {
          Alert.alert('加载失败', '无法读取每日任务设置，请稍后重试');
          router.back();
        }
      });

    return () => {
      active = false;
    };
  }, [db]);

  function changeDailyWordLimit(step: number) {
    setSettings((current) =>
      current
        ? {
            ...current,
            dailyWordLimit: normalizeDailyWordLimit(
              current.dailyWordLimit + step * DAILY_WORD_LIMIT_STEP,
            ),
          }
        : current,
    );
  }

  function changeListeningWordInterval(step: number) {
    setSettings((current) =>
      current
        ? {
            ...current,
            listeningWordIntervalSeconds: normalizeListeningWordInterval(
              current.listeningWordIntervalSeconds +
                step * LISTENING_WORD_INTERVAL_STEP,
            ),
          }
        : current,
    );
  }

  function selectListeningRate(rate: number) {
    setSettings((current) =>
      current ? { ...current, listeningDefaultRate: rate } : current,
    );
  }

  function setAdvanceOnMistakes(value: boolean) {
    setSettings((current) =>
      current ? { ...current, advanceOnMistakes: value } : current,
    );
  }

  function setRandomWordSelection(value: boolean) {
    setSettings((current) =>
      current ? { ...current, randomWordSelection: value } : current,
    );
  }

  async function handleSave() {
    if (!settings || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await saveDailyTaskSettings(db, settings);
      Alert.alert('保存成功', '新的每日任务设置已经生效');
    } catch {
      Alert.alert('保存失败', '无法保存每日任务设置，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  }

  const canDecrease =
    settings !== null && settings.dailyWordLimit > DAILY_WORD_LIMIT_MIN;
  const canIncrease =
    settings !== null && settings.dailyWordLimit < DAILY_WORD_LIMIT_MAX;
  const canDecreaseInterval =
    settings !== null &&
    settings.listeningWordIntervalSeconds > LISTENING_WORD_INTERVAL_MIN;
  const canIncreaseInterval =
    settings !== null &&
    settings.listeningWordIntervalSeconds < LISTENING_WORD_INTERVAL_MAX;
  const decreaseDailyWords = useLongPressStep(
    () => changeDailyWordLimit(-1),
    canDecrease,
  );
  const increaseDailyWords = useLongPressStep(
    () => changeDailyWordLimit(1),
    canIncrease,
  );
  const decreaseListeningInterval = useLongPressStep(
    () => changeListeningWordInterval(-1),
    canDecreaseInterval,
  );
  const increaseListeningInterval = useLongPressStep(
    () => changeListeningWordInterval(1),
    canIncreaseInterval,
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="返回"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <ArrowLeft color={colors.surface} size={34} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.headerTitle}>修改每日任务</Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </SafeAreaView>

      <View style={styles.sheetArea}>
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(spacing.xl, insets.bottom + 24) },
            ]}
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            {settings ? (
              <>
                <View style={styles.settingsCard}>
              <Text style={styles.sectionTitle}>每日学习数量</Text>
              <Text style={styles.sectionHint}>
                每次任务从尚未学习的新单词中选择
              </Text>

              <View style={styles.stepper}>
                <Pressable
                  accessibilityLabel="减少每日单词数量"
                  accessibilityRole="button"
                  disabled={!canDecrease}
                  onPressIn={decreaseDailyWords.start}
                  onPressOut={decreaseDailyWords.stop}
                  style={({ pressed }) => [
                    styles.stepButton,
                    !canDecrease && styles.stepButtonDisabled,
                    pressed && canDecrease && styles.pressed,
                  ]}
                >
                  <Minus color={colors.primary} size={30} strokeWidth={2.4} />
                </Pressable>

                <View style={styles.countValue}>
                  <Text style={styles.countNumber}>{settings.dailyWordLimit}</Text>
                  <Text style={styles.countUnit}>个/天</Text>
                </View>

                <Pressable
                  accessibilityLabel="增加每日单词数量"
                  accessibilityRole="button"
                  disabled={!canIncrease}
                  onPressIn={increaseDailyWords.start}
                  onPressOut={increaseDailyWords.stop}
                  style={({ pressed }) => [
                    styles.stepButton,
                    !canIncrease && styles.stepButtonDisabled,
                    pressed && canIncrease && styles.pressed,
                  ]}
                >
                  <Plus color={colors.primary} size={30} strokeWidth={2.4} />
                </Pressable>
              </View>
              <Text style={styles.rangeHint}>
                可选 {DAILY_WORD_LIMIT_MIN}-{DAILY_WORD_LIMIT_MAX} 个，可精确到个位
              </Text>

              <View style={styles.divider} />

              <ToggleRow
                hint={
                  settings.randomWordSelection
                    ? '每天从未学单词中随机抽取一批'
                    : '按字母顺序选择每天要学习的单词'
                }
                onValueChange={setRandomWordSelection}
                title="随机挑选每日单词"
                value={settings.randomWordSelection}
              />

              <View style={styles.divider} />

              <ToggleRow
                hint={
                  settings.advanceOnMistakes
                    ? '填空或听力答错后，确认提示即可进入下一环节'
                    : '必须把当前环节全部答对后才能继续'
                }
                onValueChange={setAdvanceOnMistakes}
                title="答错后直接进入下一环节"
                value={settings.advanceOnMistakes}
              />

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>听力默认速度</Text>
              <Text style={styles.sectionHint}>
                进入听力测试时使用该速度，任务中仍可临时切换
              </Text>

              <View style={styles.rateOptions}>
                {LISTENING_RATES.map((rate) => {
                  const selected = settings.listeningDefaultRate === rate;
                  return (
                    <Pressable
                      key={rate}
                      accessibilityRole="button"
                      onPress={() => selectListeningRate(rate)}
                      style={[
                        styles.rateButton,
                        selected && styles.rateButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.rateText,
                          selected && styles.rateTextSelected,
                        ]}
                      >
                        {formatRate(rate)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>单词间朗读间隔</Text>
              <Text style={styles.sectionHint}>
                每次朗读之间等待的时间
              </Text>

              <View style={styles.stepper}>
                <Pressable
                  accessibilityLabel="减少单词朗读间隔"
                  accessibilityRole="button"
                  disabled={!canDecreaseInterval}
                  onPressIn={decreaseListeningInterval.start}
                  onPressOut={decreaseListeningInterval.stop}
                  style={({ pressed }) => [
                    styles.stepButton,
                    !canDecreaseInterval && styles.stepButtonDisabled,
                    pressed && canDecreaseInterval && styles.pressed,
                  ]}
                >
                  <Minus color={colors.primary} size={30} strokeWidth={2.4} />
                </Pressable>

                <View style={styles.countValue}>
                  <Text style={styles.intervalNumber}>
                    {settings.listeningWordIntervalSeconds.toFixed(1)}
                  </Text>
                  <Text style={styles.countUnit}>秒</Text>
                </View>

                <Pressable
                  accessibilityLabel="增加单词朗读间隔"
                  accessibilityRole="button"
                  disabled={!canIncreaseInterval}
                  onPressIn={increaseListeningInterval.start}
                  onPressOut={increaseListeningInterval.stop}
                  style={({ pressed }) => [
                    styles.stepButton,
                    !canIncreaseInterval && styles.stepButtonDisabled,
                    pressed && canIncreaseInterval && styles.pressed,
                  ]}
                >
                  <Plus color={colors.primary} size={30} strokeWidth={2.4} />
                </Pressable>
              </View>
              <Text style={styles.rangeHint}>
                {LISTENING_WORD_INTERVAL_MIN.toFixed(1)}-
                {LISTENING_WORD_INTERVAL_MAX.toFixed(1)} 秒，每次调整 0.1 秒
              </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  disabled={isSaving}
                  onPress={handleSave}
                  style={({ pressed }) => [
                    styles.saveButton,
                    isSaving && styles.saveButtonDisabled,
                    pressed && !isSaving && styles.pressed,
                  ]}
                >
                  {isSaving ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <Text style={styles.saveText}>保存设置</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={styles.loadingText}>正在读取设置</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
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
    paddingHorizontal: 0,
  },
  countNumber: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '800',
  },
  countUnit: {
    color: colors.textSecondary,
    fontSize: 17,
    marginTop: 2,
  },
  countValue: {
    alignItems: 'center',
    minWidth: 126,
  },
  divider: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginVertical: 28,
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
    color: colors.surface,
    fontSize: 25,
    fontWeight: '700',
  },
  intervalNumber: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '800',
  },
  loading: {
    alignItems: 'center',
    paddingTop: 110,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 18,
    marginTop: 16,
  },
  pressed: {
    opacity: 0.65,
  },
  rangeHint: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 14,
    textAlign: 'center',
  },
  rateButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    width: '30%',
  },
  rateButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rateOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  rateText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  rateTextSelected: {
    color: colors.surface,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 60,
    justifyContent: 'center',
    marginHorizontal: 26,
    marginTop: 26,
  },
  saveButtonDisabled: {
    backgroundColor: '#B9C0CA',
  },
  saveText: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: '700',
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
  sectionHint: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '700',
  },
  settingsCard: {
    marginTop: 8,
    padding: 26,
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
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 26,
  },
  toggleCopy: {
    flex: 1,
    marginRight: 18,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
