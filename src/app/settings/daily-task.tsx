import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Minus, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { ActionOptionModal } from '@/components/ActionOptionModal';
import { GreenSheetScreen } from '@/components/GreenSheetScreen';
import { colors, radii } from '@/constants/theme';
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
  normalizeReviewReminderInterval,
  normalizeReviewWordLimit,
  REVIEW_REMINDER_INTERVAL_MAX,
  REVIEW_REMINDER_INTERVAL_MIN,
  REVIEW_WORD_LIMIT_MAX,
  REVIEW_WORD_LIMIT_MIN,
  saveDailyTaskSettings,
  type DailyTaskSettings,
} from '@/database/settingsRepository';
import { useLongPressStep } from '@/hooks/useLongPressStep';

function formatRate(rate: number): string {
  return `${rate}x`;
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
  const [settings, setSettings] = useState<DailyTaskSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessVisible, setSaveSuccessVisible] = useState(false);
  const [testReminderVisible, setTestReminderVisible] = useState(false);

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

  function changeReviewReminderInterval(step: number) {
    setSettings((current) =>
      current
        ? {
            ...current,
            reviewReminderIntervalDays: normalizeReviewReminderInterval(
              current.reviewReminderIntervalDays + step,
            ),
          }
        : current,
    );
  }

  function changeWordReviewLimit(step: number) {
    setSettings((current) =>
      current
        ? {
            ...current,
            wordReviewWordLimit: normalizeReviewWordLimit(
              current.wordReviewWordLimit + step,
            ),
          }
        : current,
    );
  }

  function changeWrongReviewLimit(step: number) {
    setSettings((current) =>
      current
        ? {
            ...current,
            wrongReviewWordLimit: normalizeReviewWordLimit(
              current.wrongReviewWordLimit + step,
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

  function setWrongReviewRandom(value: boolean) {
    setSettings((current) =>
      current ? { ...current, wrongReviewRandom: value } : current,
    );
  }

  function setReviewReminderEnabled(value: boolean) {
    setSettings((current) =>
      current ? { ...current, reviewReminderEnabled: value } : current,
    );
  }

  function setAutoRemoveCorrectWrongReview(value: boolean) {
    setSettings((current) =>
      current
        ? { ...current, autoRemoveCorrectWrongReview: value }
        : current,
    );
  }

  async function handleSave() {
    if (!settings || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await saveDailyTaskSettings(db, settings);
      setSaveSuccessVisible(true);
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
  const canDecreaseReminder =
    settings !== null &&
    settings.reviewReminderIntervalDays > REVIEW_REMINDER_INTERVAL_MIN;
  const canIncreaseReminder =
    settings !== null &&
    settings.reviewReminderIntervalDays < REVIEW_REMINDER_INTERVAL_MAX;
  const canDecreaseWordReview =
    settings !== null &&
    settings.wordReviewWordLimit > REVIEW_WORD_LIMIT_MIN;
  const canIncreaseWordReview =
    settings !== null &&
    settings.wordReviewWordLimit < REVIEW_WORD_LIMIT_MAX;
  const canDecreaseWrongReview =
    settings !== null &&
    settings.wrongReviewWordLimit > REVIEW_WORD_LIMIT_MIN;
  const canIncreaseWrongReview =
    settings !== null &&
    settings.wrongReviewWordLimit < REVIEW_WORD_LIMIT_MAX;
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
  const decreaseReminderInterval = useLongPressStep(
    () => changeReviewReminderInterval(-1),
    canDecreaseReminder,
  );
  const increaseReminderInterval = useLongPressStep(
    () => changeReviewReminderInterval(1),
    canIncreaseReminder,
  );
  const decreaseWordReview = useLongPressStep(
    () => changeWordReviewLimit(-1),
    canDecreaseWordReview,
  );
  const increaseWordReview = useLongPressStep(
    () => changeWordReviewLimit(1),
    canIncreaseWordReview,
  );
  const decreaseWrongReview = useLongPressStep(
    () => changeWrongReviewLimit(-1),
    canDecreaseWrongReview,
  );
  const increaseWrongReview = useLongPressStep(
    () => changeWrongReviewLimit(1),
    canIncreaseWrongReview,
  );

  return (
    <>
      <GreenSheetScreen
        onBack={() => router.back()}
        title="通用设置"
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

              <Text style={styles.sectionTitle}>错题回顾数量</Text>
              <Text style={styles.sectionHint}>
                每次从错题本中抽取的单词数量
              </Text>
              <View style={styles.reminderStepper}>
                <Pressable
                  accessibilityLabel="减少错题回顾数量"
                  accessibilityRole="button"
                  disabled={!canDecreaseWrongReview}
                  onPressIn={decreaseWrongReview.start}
                  onPressOut={decreaseWrongReview.stop}
                  style={({ pressed }) => [
                    styles.stepButton,
                    !canDecreaseWrongReview && styles.stepButtonDisabled,
                    pressed && canDecreaseWrongReview && styles.pressed,
                  ]}
                >
                  <Minus color={colors.primary} size={30} strokeWidth={2.4} />
                </Pressable>
                <View style={styles.countValue}>
                  <Text style={styles.countNumber}>
                    {settings.wrongReviewWordLimit}
                  </Text>
                  <Text style={styles.countUnit}>个/次</Text>
                </View>
                <Pressable
                  accessibilityLabel="增加错题回顾数量"
                  accessibilityRole="button"
                  disabled={!canIncreaseWrongReview}
                  onPressIn={increaseWrongReview.start}
                  onPressOut={increaseWrongReview.stop}
                  style={({ pressed }) => [
                    styles.stepButton,
                    !canIncreaseWrongReview && styles.stepButtonDisabled,
                    pressed && canIncreaseWrongReview && styles.pressed,
                  ]}
                >
                  <Plus color={colors.primary} size={30} strokeWidth={2.4} />
                </Pressable>
              </View>
              <Text style={styles.rangeHint}>
                {REVIEW_WORD_LIMIT_MIN}-{REVIEW_WORD_LIMIT_MAX} 个
              </Text>

              <View style={styles.divider} />

              <ToggleRow
                hint={
                  settings.wrongReviewRandom
                    ? '每次错题回顾从错题本中随机抽取'
                    : '按错题加入时间顺序进行回顾'
                }
                onValueChange={setWrongReviewRandom}
                title="随机挑选错题回顾单词"
                value={settings.wrongReviewRandom}
              />

              <View style={styles.divider} />

              <ToggleRow
                hint="错题回顾中答对的单词会自动移出错题本并设为已学习"
                onValueChange={setAutoRemoveCorrectWrongReview}
                title="答对后自动移出错题本"
                value={settings.autoRemoveCorrectWrongReview}
              />

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>单词再练数量</Text>
              <Text style={styles.sectionHint}>每次复习随机抽取的单词数量</Text>
              <View style={styles.reminderStepper}>
                <Pressable
                  accessibilityLabel="减少单词再练数量"
                  accessibilityRole="button"
                  disabled={!canDecreaseWordReview}
                  onPressIn={decreaseWordReview.start}
                  onPressOut={decreaseWordReview.stop}
                  style={({ pressed }) => [
                    styles.stepButton,
                    !canDecreaseWordReview && styles.stepButtonDisabled,
                    pressed && canDecreaseWordReview && styles.pressed,
                  ]}
                >
                  <Minus color={colors.primary} size={30} strokeWidth={2.4} />
                </Pressable>
                <View style={styles.countValue}>
                  <Text style={styles.countNumber}>
                    {settings.wordReviewWordLimit}
                  </Text>
                  <Text style={styles.countUnit}>个/次</Text>
                </View>
                <Pressable
                  accessibilityLabel="增加单词再练数量"
                  accessibilityRole="button"
                  disabled={!canIncreaseWordReview}
                  onPressIn={increaseWordReview.start}
                  onPressOut={increaseWordReview.stop}
                  style={({ pressed }) => [
                    styles.stepButton,
                    !canIncreaseWordReview && styles.stepButtonDisabled,
                    pressed && canIncreaseWordReview && styles.pressed,
                  ]}
                >
                  <Plus color={colors.primary} size={30} strokeWidth={2.4} />
                </Pressable>
              </View>
              <Text style={styles.rangeHint}>
                {REVIEW_WORD_LIMIT_MIN}-{REVIEW_WORD_LIMIT_MAX} 个
              </Text>

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

              <View style={styles.divider} />

              <ToggleRow
                hint="达到设定的学习天数时，在首页弹出复习提醒"
                onValueChange={setReviewReminderEnabled}
                title="开启复习提醒"
                value={settings.reviewReminderEnabled}
              />

              {settings.reviewReminderEnabled ? (
                <>
                  <View style={styles.reminderStepper}>
                    <Pressable
                      accessibilityLabel="减少复习提醒间隔"
                      accessibilityRole="button"
                      disabled={!canDecreaseReminder}
                      onPressIn={decreaseReminderInterval.start}
                      onPressOut={decreaseReminderInterval.stop}
                      style={({ pressed }) => [
                        styles.stepButton,
                        !canDecreaseReminder && styles.stepButtonDisabled,
                        pressed && canDecreaseReminder && styles.pressed,
                      ]}
                    >
                      <Minus
                        color={colors.primary}
                        size={30}
                        strokeWidth={2.4}
                      />
                    </Pressable>

                    <View style={styles.countValue}>
                      <Text style={styles.countNumber}>
                        {settings.reviewReminderIntervalDays}
                      </Text>
                      <Text style={styles.countUnit}>天提醒一次</Text>
                    </View>

                    <Pressable
                      accessibilityLabel="增加复习提醒间隔"
                      accessibilityRole="button"
                      disabled={!canIncreaseReminder}
                      onPressIn={increaseReminderInterval.start}
                      onPressOut={increaseReminderInterval.stop}
                      style={({ pressed }) => [
                        styles.stepButton,
                        !canIncreaseReminder && styles.stepButtonDisabled,
                        pressed && canIncreaseReminder && styles.pressed,
                      ]}
                    >
                      <Plus
                        color={colors.primary}
                        size={30}
                        strokeWidth={2.4}
                      />
                    </Pressable>
                  </View>
                  <Text style={styles.rangeHint}>
                    可设置 {REVIEW_REMINDER_INTERVAL_MIN}-
                    {REVIEW_REMINDER_INTERVAL_MAX} 天
                  </Text>
                </>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={() => setTestReminderVisible(true)}
                style={({ pressed }) => [
                  styles.testReminderButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.testReminderText}>测试复习提醒</Text>
              </Pressable>
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
      </GreenSheetScreen>
      <ActionOptionModal
        message="已到达规定的复习时间，让我们开始复习吧！"
        onClose={() => setTestReminderVisible(false)}
        options={[
          {
            label: '去复习',
            onPress: () => router.push('/review'),
            tone: 'primary',
          },
          {
            label: '知道了',
            onPress: () => {},
          },
        ]}
        title="该复习了"
        visible={testReminderVisible}
      />
      <ActionOptionModal
        message="通用设置已经保存并生效。"
        onClose={() => setSaveSuccessVisible(false)}
        options={[
          {
            label: '知道了',
            onPress: () => {},
            tone: 'primary',
          },
        ]}
        title="保存成功"
        visible={saveSuccessVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
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
  reminderStepper: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
  testReminderButton: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: 22,
    borderWidth: 1.5,
    height: 50,
    justifyContent: 'center',
    marginTop: 18,
  },
  testReminderText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '600',
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
