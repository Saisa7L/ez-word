import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ActionOptionModal } from '@/components/ActionOptionModal';
import { useAppFeedback } from '@/components/AppFeedbackProvider';
import { GreenSheetScreen } from '@/components/GreenSheetScreen';
import type { ThemeColors } from '@/constants/theme';
import {
  getDailyTaskSettings,
  saveDailyTaskSettings,
  type DailyTaskSettings,
} from '@/database/settingsRepository';
import { DailyTaskSettingsForm } from '@/features/settings/DailyTaskSettingsForm';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';
import { pushOnce } from '@/utils/navigationActions';
import { useSettingsBackNavigation } from '@/hooks/useSettingsBackNavigation';

export default function DailyTaskSettingsScreen() {
  const db = useSQLiteContext();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { showNotice } = useAppFeedback();
  const handleBack = useSettingsBackNavigation();
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
          showNotice('加载失败', '无法读取每日任务设置，请稍后重试');
          handleBack();
        }
      });

    return () => {
      active = false;
    };
  }, [db, handleBack, showNotice]);

  async function handleSave() {
    if (!settings || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await saveDailyTaskSettings(db, settings);
      setSaveSuccessVisible(true);
    } catch {
      showNotice('保存失败', '无法保存每日任务设置，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <GreenSheetScreen
        onBack={handleBack}
        title="通用设置"
      >
        {settings ? (
          <>
            <DailyTaskSettingsForm
              onChange={(updater) => {
                setSettings((current) =>
                  current ? updater(current) : current,
                );
              }}
              onTestReminder={() => setTestReminderVisible(true)}
              settings={settings}
            />

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
                <ActivityIndicator color={colors.accentText} />
              ) : (
                <Text style={styles.saveText}>保存设置</Text>
              )}
            </Pressable>
          </>
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accentText} size="large" />
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
            onPress: () => pushOnce('/review'),
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    saveButton: {
      alignItems: 'center',
      backgroundColor: colors.graySoft,
      borderRadius: 28,
      height: 60,
      justifyContent: 'center',
      marginHorizontal: 26,
      marginTop: 26,
    },
    saveButtonDisabled: {
      backgroundColor: colors.disabled,
    },
    saveText: {
      color: colors.accentText,
      fontSize: 22,
      fontWeight: '700',
    },
  });
