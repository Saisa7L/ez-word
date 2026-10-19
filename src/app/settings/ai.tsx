import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { KeyRound, RefreshCw, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ActionOptionModal } from '@/components/ActionOptionModal';
import { GreenSheetScreen } from '@/components/GreenSheetScreen';
import {
  radii,
  type ThemeColors,
} from '@/constants/theme';
import {
  getAiOverwriteExamples,
  setAiOverwriteExamples,
} from '@/database/aiRepository';
import {
  generateWordExamples,
  type ExampleGenerationProgress,
} from '@/features/ai/generateWordExamples';
import {
  clearDeepSeekApiKey,
  getDeepSeekApiKey,
  saveDeepSeekApiKey,
} from '@/services/aiKeyStore';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';
import {
  DeepSeekError,
  testDeepSeekConnection,
} from '@/services/deepSeekService';

type Notice = {
  message: string;
  title: string;
};

export default function AiSettingsScreen() {
  const db = useSQLiteContext();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [storedKey, setStoredKey] = useState<string | null>(null);
  const [overwriteExamples, setOverwriteExamples] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ExampleGenerationProgress | null>(
    null,
  );
  const [notice, setNotice] = useState<Notice | null>(null);
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([getDeepSeekApiKey(), getAiOverwriteExamples(db)])
      .then(([key, overwrite]) => {
        if (active) {
          setStoredKey(key);
          setOverwriteExamples(overwrite);
        }
      })
      .catch(() => {
        if (active) {
          setNotice({
            message: '无法读取 AI 设置，请稍后重试',
            title: '读取失败',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [db]);

  async function handleSaveKey() {
    const apiKey = apiKeyInput.trim();
    if (!apiKey) {
      setNotice({
        message: '请先输入 DeepSeek API Key',
        title: '无法保存',
      });
      return;
    }

    setIsSavingKey(true);
    try {
      await saveDeepSeekApiKey(apiKey);
      setStoredKey(apiKey);
      setApiKeyInput('');
      setNotice({
        message: 'API Key 已保存到 Android 安全存储',
        title: '保存成功',
      });
    } catch {
      setNotice({
        message: '无法保存 API Key，请稍后重试',
        title: '保存失败',
      });
    } finally {
      setIsSavingKey(false);
    }
  }

  async function handleTestConnection() {
    const apiKey = apiKeyInput.trim() || storedKey;
    if (!apiKey) {
      setNotice({
        message: '请先保存 DeepSeek API Key',
        title: '尚未配置',
      });
      return;
    }

    setIsTesting(true);
    try {
      await testDeepSeekConnection(apiKey);
      setNotice({
        message: 'DeepSeek 连接成功',
        title: '测试成功',
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof DeepSeekError
            ? error.message
            : '连接 DeepSeek 失败，请稍后重试',
        title: '测试失败',
      });
    } finally {
      setIsTesting(false);
    }
  }

  async function handleClearKey() {
    try {
      await clearDeepSeekApiKey();
      setStoredKey(null);
      setApiKeyInput('');
      setProgress(null);
      setNotice({
        message: 'API Key 已从安全存储中删除',
        title: '已清除',
      });
    } catch {
      setNotice({
        message: '无法清除 API Key，请稍后重试',
        title: '清除失败',
      });
    }
  }

  async function handleOverwriteChange(value: boolean) {
    setOverwriteExamples(value);
    try {
      await setAiOverwriteExamples(db, value);
    } catch {
      setOverwriteExamples(!value);
      setNotice({
        message: '无法保存覆盖选项，请稍后重试',
        title: '保存失败',
      });
    }
  }

  async function handleGenerate() {
    if (!storedKey) {
      setNotice({
        message: '请先保存并测试 DeepSeek API Key',
        title: '尚未配置',
      });
      return;
    }

    if (isGenerating) {
      return;
    }

    setIsGenerating(true);
    setProgress(null);
    try {
      const result = await generateWordExamples({
        apiKey: storedKey,
        db,
        onProgress: setProgress,
        overwriteExisting: overwriteExamples,
      });
      setNotice({
        message:
          result.total === 0
            ? '当前没有需要生成例句的单词'
            : `共处理 ${result.total} 个单词，成功 ${result.success} 个，失败 ${result.failed} 个`,
        title: '生成完成',
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof DeepSeekError
            ? error.message
            : '生成单词例句失败，请稍后重试',
        title: '生成失败',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  const maskedKey = storedKey
    ? `已保存：••••${storedKey.slice(-4)}`
    : '尚未保存 API Key';

  return (
    <>
      <GreenSheetScreen
        onBack={() => router.back()}
        title="AI 设置"
      >
        <View style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <KeyRound
                  color={colors.accentText}
                  size={25}
                  strokeWidth={2.2}
                />
              </View>
              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionTitle}>DeepSeek API Key</Text>
                <Text style={styles.keyStatus}>{maskedKey}</Text>
              </View>
            </View>

            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setApiKeyInput}
              placeholder="输入新的 API Key"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={styles.input}
              value={apiKeyInput}
            />

            <View style={styles.keyActions}>
              <Pressable
                accessibilityRole="button"
                disabled={isSavingKey}
                onPress={() => {
                  void handleSaveKey();
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                ]}
              >
                {isSavingKey ? (
                  <ActivityIndicator color={colors.accentText} />
                ) : (
                  <Text style={styles.primaryButtonText}>保存 Key</Text>
                )}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isTesting}
                onPress={() => {
                  void handleTestConnection();
                }}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.pressed,
                ]}
              >
                {isTesting ? (
                  <ActivityIndicator color={colors.accentText} />
                ) : (
                  <Text style={styles.secondaryButtonText}>测试连接</Text>
                )}
              </Pressable>
            </View>

            {storedKey ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setClearConfirmVisible(true)}
                style={({ pressed }) => [
                  styles.clearKeyButton,
                  pressed && styles.pressed,
                ]}
              >
                <Trash2 color={colors.red} size={21} strokeWidth={2.2} />
                <Text style={styles.clearKeyText}>清除 API Key</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>生成单词数据</Text>
            <Text style={styles.sectionHint}>
              使用 DeepSeek 为缺少例句的单词生成英文例句，并保存到本地数据库。
            </Text>

            <View style={styles.switchRow}>
              <View style={styles.switchCopy}>
                <Text style={styles.switchTitle}>覆盖已有例句</Text>
                <Text style={styles.switchHint}>
                  开启后会重新生成 CSV 或 AI 已有的例句
                </Text>
              </View>
              <Switch
                onValueChange={(value) => {
                  void handleOverwriteChange(value);
                }}
                thumbColor={colors.surface}
                trackColor={{ false: colors.border, true: colors.accentText }}
                value={overwriteExamples}
              />
            </View>

            {progress ? (
              <View style={styles.progressBox}>
                <Text style={styles.progressTitle}>
                  {progress.completed}/{progress.total}
                </Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width:
                          progress.total === 0
                            ? '0%'
                            : `${(progress.completed / progress.total) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  成功 {progress.success} · 失败 {progress.failed}
                </Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={isGenerating}
              onPress={() => {
                void handleGenerate();
              }}
              style={({ pressed }) => [
                styles.generateButton,
                isGenerating && styles.generateButtonDisabled,
                pressed && !isGenerating && styles.pressed,
              ]}
            >
              {isGenerating ? (
                <ActivityIndicator color={colors.accentText} />
              ) : (
                <>
                  <RefreshCw
                    color={colors.accentText}
                    size={23}
                    strokeWidth={2.3}
                  />
                  <Text style={styles.generateText}>生成单词数据</Text>
                </>
              )}
            </Pressable>
          </View>

          <Text style={styles.footerHint}>
            学习任务运行时不会联网，只读取本地 CSV 或 AI 已生成的例句。
          </Text>
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
      <ActionOptionModal
        message="清除后，App 将无法使用 AI 生成单词例句。"
        onClose={() => setClearConfirmVisible(false)}
        options={[
          {
            label: '清除',
            onPress: () => {
              void handleClearKey();
            },
            tone: 'danger',
          },
          {
            label: '取消',
            onPress: () => {},
          },
        ]}
        title="清除 API Key？"
        visible={clearConfirmVisible}
      />
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  clearKeyButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingVertical: 6,
  },
  clearKeyText: {
    color: colors.red,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 22,
  },
  divider: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginVertical: 28,
  },
  footerHint: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 22,
    textAlign: 'center',
  },
  generateButton: {
    alignItems: 'center',
    backgroundColor: colors.graySoft,
    borderRadius: 28,
    flexDirection: 'row',
    gap: 9,
    height: 58,
    justifyContent: 'center',
    marginTop: 22,
  },
  generateButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  generateText: {
    color: colors.accentText,
    fontSize: 20,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.graySoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 17,
    height: 54,
    marginTop: 20,
    paddingHorizontal: 16,
  },
  keyActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  keyStatus: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.66,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.graySoft,
    borderRadius: 22,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.accentText,
    fontSize: 17,
    fontWeight: '700',
  },
  progressBox: {
    marginTop: 20,
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 5,
    height: 10,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
  progressTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressTrack: {
    backgroundColor: colors.border,
    borderRadius: 5,
    height: 10,
    overflow: 'hidden',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.accentText,
    borderRadius: 22,
    borderWidth: 1.5,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.accentText,
    fontSize: 17,
    fontWeight: '700',
  },
  section: {
    width: '100%',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  sectionHeaderCopy: {
    flex: 1,
    marginLeft: 12,
  },
  sectionHint: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 8,
  },
  sectionIcon: {
    alignItems: 'center',
    backgroundColor: colors.graySoft,
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  switchCopy: {
    flex: 1,
    marginRight: 16,
  },
  switchHint: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 22,
  },
  switchTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
});
