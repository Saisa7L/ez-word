import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft, Minus, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SurfaceCard } from '@/components/SurfaceCard';
import { colors, radii, shadow, spacing } from '@/constants/theme';
import {
  DAILY_WORD_LIMIT_MAX,
  DAILY_WORD_LIMIT_MIN,
  DAILY_WORD_LIMIT_STEP,
  getDailyTaskSettings,
  LISTENING_RATES,
  normalizeDailyWordLimit,
  saveDailyTaskSettings,
  type DailyTaskSettings,
} from '@/database/settingsRepository';

function formatRate(rate: number): string {
  return `${rate}x`;
}

export default function DailyTaskSettingsScreen() {
  const db = useSQLiteContext();
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

  function selectListeningRate(rate: number) {
    setSettings((current) =>
      current ? { ...current, listeningDefaultRate: rate } : current,
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

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {settings ? (
          <>
            <SurfaceCard style={styles.settingsCard}>
              <Text style={styles.sectionTitle}>每日学习数量</Text>
              <Text style={styles.sectionHint}>
                每次任务从尚未学习的新单词中选择
              </Text>

              <View style={styles.stepper}>
                <Pressable
                  accessibilityLabel="减少每日单词数量"
                  accessibilityRole="button"
                  disabled={!canDecrease}
                  onPress={() => changeDailyWordLimit(-1)}
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
                  onPress={() => changeDailyWordLimit(1)}
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
            </SurfaceCard>

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
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
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
    marginTop: -72,
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
    ...shadow,
    marginTop: 24,
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
});
