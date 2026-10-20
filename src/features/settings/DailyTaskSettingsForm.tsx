import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, type ThemeColors } from '@/constants/theme';
import {
  DAILY_WORD_LIMIT_MAX,
  DAILY_WORD_LIMIT_MIN,
  DAILY_WORD_LIMIT_STEP,
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
  type DailyTaskSettings,
} from '@/database/settingsRepository';
import { formatListeningRate } from '@/features/daily-task/taskPresentation';
import { useThemedStyles } from '@/features/theme/ThemeProvider';

import { SettingStepper } from './components/SettingStepper';
import { SettingToggleRow } from './components/SettingToggleRow';

type DailyTaskSettingsFormProps = {
  onChange: (
    updater: (current: DailyTaskSettings) => DailyTaskSettings,
  ) => void;
  onTestReminder: () => void;
  settings: DailyTaskSettings;
};

export function DailyTaskSettingsForm({
  onChange,
  onTestReminder,
  settings,
}: DailyTaskSettingsFormProps) {
  const styles = useThemedStyles(createStyles);

  function update(patch: Partial<DailyTaskSettings>) {
    onChange((current) => ({ ...current, ...patch }));
  }

  function changeDailyWordLimit(step: number) {
    onChange((current) => ({
      ...current,
      dailyWordLimit: normalizeDailyWordLimit(
        current.dailyWordLimit + step * DAILY_WORD_LIMIT_STEP,
      ),
    }));
  }

  function changeListeningWordInterval(step: number) {
    onChange((current) => ({
      ...current,
      listeningWordIntervalSeconds: normalizeListeningWordInterval(
        current.listeningWordIntervalSeconds +
          step * LISTENING_WORD_INTERVAL_STEP,
      ),
    }));
  }

  function changeReviewReminderInterval(step: number) {
    onChange((current) => ({
      ...current,
      reviewReminderIntervalDays: normalizeReviewReminderInterval(
        current.reviewReminderIntervalDays + step,
      ),
    }));
  }

  function changeWordReviewLimit(step: number) {
    onChange((current) => ({
      ...current,
      wordReviewWordLimit: normalizeReviewWordLimit(
        current.wordReviewWordLimit + step,
      ),
    }));
  }

  function changeWrongReviewLimit(step: number) {
    onChange((current) => ({
      ...current,
      wrongReviewWordLimit: normalizeReviewWordLimit(
        current.wrongReviewWordLimit + step,
      ),
    }));
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>每日学习数量</Text>
      <Text style={styles.sectionHint}>每次任务从尚未学习的新单词中选择</Text>

      <SettingStepper
        canDecrease={settings.dailyWordLimit > DAILY_WORD_LIMIT_MIN}
        canIncrease={settings.dailyWordLimit < DAILY_WORD_LIMIT_MAX}
        decreaseLabel="减少每日单词数量"
        increaseLabel="增加每日单词数量"
        marginTop={26}
        onDecrease={() => changeDailyWordLimit(-1)}
        onIncrease={() => changeDailyWordLimit(1)}
        unit="个/天"
        value={String(settings.dailyWordLimit)}
      />
      <Text style={styles.rangeHint}>
        可选 {DAILY_WORD_LIMIT_MIN}-{DAILY_WORD_LIMIT_MAX} 个，可精确到个位
      </Text>

      <View style={styles.divider} />

      <SettingToggleRow
        hint={
          settings.randomWordSelection
            ? '每天从未学单词中随机抽取一批'
            : '按字母顺序选择每天要学习的单词'
        }
        onValueChange={(value) => update({ randomWordSelection: value })}
        title="随机挑选每日单词"
        value={settings.randomWordSelection}
      />

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>错题回顾数量</Text>
      <Text style={styles.sectionHint}>每次从错题本中抽取的单词数量</Text>
      <SettingStepper
        canDecrease={settings.wrongReviewWordLimit > REVIEW_WORD_LIMIT_MIN}
        canIncrease={settings.wrongReviewWordLimit < REVIEW_WORD_LIMIT_MAX}
        decreaseLabel="减少错题回顾数量"
        increaseLabel="增加错题回顾数量"
        onDecrease={() => changeWrongReviewLimit(-1)}
        onIncrease={() => changeWrongReviewLimit(1)}
        unit="个/次"
        value={String(settings.wrongReviewWordLimit)}
      />
      <Text style={styles.rangeHint}>
        {REVIEW_WORD_LIMIT_MIN}-{REVIEW_WORD_LIMIT_MAX} 个
      </Text>

      <View style={styles.divider} />

      <SettingToggleRow
        hint={
          settings.wrongReviewRandom
            ? '每次错题回顾从错题本中随机抽取'
            : '按错题加入时间顺序进行回顾'
        }
        onValueChange={(value) => update({ wrongReviewRandom: value })}
        title="随机挑选错题回顾单词"
        value={settings.wrongReviewRandom}
      />

      <View style={styles.divider} />

      <SettingToggleRow
        hint="错题回顾中答对的单词会自动移出错题本并设为已学习"
        onValueChange={(value) =>
          update({ autoRemoveCorrectWrongReview: value })
        }
        title="答对后自动移出错题本"
        value={settings.autoRemoveCorrectWrongReview}
      />

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>单词再练数量</Text>
      <Text style={styles.sectionHint}>每次复习随机抽取的单词数量</Text>
      <SettingStepper
        canDecrease={settings.wordReviewWordLimit > REVIEW_WORD_LIMIT_MIN}
        canIncrease={settings.wordReviewWordLimit < REVIEW_WORD_LIMIT_MAX}
        decreaseLabel="减少单词再练数量"
        increaseLabel="增加单词再练数量"
        onDecrease={() => changeWordReviewLimit(-1)}
        onIncrease={() => changeWordReviewLimit(1)}
        unit="个/次"
        value={String(settings.wordReviewWordLimit)}
      />
      <Text style={styles.rangeHint}>
        {REVIEW_WORD_LIMIT_MIN}-{REVIEW_WORD_LIMIT_MAX} 个
      </Text>

      <View style={styles.divider} />

      <SettingToggleRow
        hint={
          settings.advanceOnMistakes
            ? '填空或听力答错后，确认提示即可进入下一环节'
            : '必须把当前环节全部答对后才能继续'
        }
        onValueChange={(value) => update({ advanceOnMistakes: value })}
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
              accessibilityRole="button"
              key={rate}
              onPress={() => update({ listeningDefaultRate: rate })}
              style={[styles.rateButton, selected && styles.rateButtonSelected]}
            >
              <Text
                style={[styles.rateText, selected && styles.rateTextSelected]}
              >
                {formatListeningRate(rate)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>单词间朗读间隔</Text>
      <Text style={styles.sectionHint}>每次朗读之间等待的时间</Text>

      <SettingStepper
        canDecrease={
          settings.listeningWordIntervalSeconds > LISTENING_WORD_INTERVAL_MIN
        }
        canIncrease={
          settings.listeningWordIntervalSeconds < LISTENING_WORD_INTERVAL_MAX
        }
        decreaseLabel="减少单词朗读间隔"
        increaseLabel="增加单词朗读间隔"
        onDecrease={() => changeListeningWordInterval(-1)}
        onIncrease={() => changeListeningWordInterval(1)}
        unit="秒"
        value={settings.listeningWordIntervalSeconds.toFixed(1)}
        valueSize={40}
      />
      <Text style={styles.rangeHint}>
        {LISTENING_WORD_INTERVAL_MIN.toFixed(1)}-
        {LISTENING_WORD_INTERVAL_MAX.toFixed(1)} 秒，每次调整 0.1 秒
      </Text>

      <View style={styles.divider} />

      <SettingToggleRow
        hint="达到设定的学习天数时，在首页弹出复习提醒"
        onValueChange={(value) => update({ reviewReminderEnabled: value })}
        title="开启复习提醒"
        value={settings.reviewReminderEnabled}
      />

      {settings.reviewReminderEnabled ? (
        <>
          <SettingStepper
            canDecrease={
              settings.reviewReminderIntervalDays > REVIEW_REMINDER_INTERVAL_MIN
            }
            canIncrease={
              settings.reviewReminderIntervalDays < REVIEW_REMINDER_INTERVAL_MAX
            }
            decreaseLabel="减少复习提醒间隔"
            increaseLabel="增加复习提醒间隔"
            onDecrease={() => changeReviewReminderInterval(-1)}
            onIncrease={() => changeReviewReminderInterval(1)}
            unit="天提醒一次"
            value={String(settings.reviewReminderIntervalDays)}
          />
          <Text style={styles.rangeHint}>
            可设置 {REVIEW_REMINDER_INTERVAL_MIN}-{REVIEW_REMINDER_INTERVAL_MAX}{' '}
            天
          </Text>
        </>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={onTestReminder}
        style={({ pressed }) => [
          styles.testReminderButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.testReminderText}>测试复习提醒</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      marginTop: 8,
      padding: 26,
    },
    divider: {
      backgroundColor: colors.border,
      height: StyleSheet.hairlineWidth,
      marginVertical: 28,
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
      justifyContent: 'center',
      minHeight: 50,
      paddingHorizontal: 8,
      paddingVertical: 10,
      width: '30%',
    },
    rateButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.accentText,
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
      color: colors.onPrimary,
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
    testReminderButton: {
      alignItems: 'center',
      borderColor: colors.accentText,
      borderRadius: 22,
      borderWidth: 1.5,
      justifyContent: 'center',
      marginTop: 18,
      minHeight: 50,
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    testReminderText: {
      color: colors.accentText,
      fontSize: 17,
      fontWeight: '600',
    },
  });
