import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ActionOptionModal } from '@/components/ActionOptionModal';
import { GreenSheetScreen } from '@/components/GreenSheetScreen';
import type { ThemeColors } from '@/constants/theme';
import {
  getAiOverwriteExamples,
  setAiOverwriteExamples,
} from '@/database/aiRepository';
import {
  generateWordExamples,
  type ExampleGenerationProgress,
} from '@/features/ai/generateWordExamples';
import { AiExampleGenerationSection } from '@/features/settings/AiExampleGenerationSection';
import { AiKeySection } from '@/features/settings/AiKeySection';
import {
  useThemedStyles,
} from '@/features/theme/ThemeProvider';
import {
  clearDeepSeekApiKey,
  getDeepSeekApiKey,
  saveDeepSeekApiKey,
} from '@/services/aiKeyStore';
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

  return (
    <>
      <GreenSheetScreen
        onBack={() => router.back()}
        title="AI 设置"
      >
        <View style={styles.content}>
          <AiKeySection
            apiKeyInput={apiKeyInput}
            isSavingKey={isSavingKey}
            isTesting={isTesting}
            onChangeInput={setApiKeyInput}
            onClearRequest={() => setClearConfirmVisible(true)}
            onSave={() => {
              void handleSaveKey();
            }}
            onTest={() => {
              void handleTestConnection();
            }}
            storedKey={storedKey}
          />

          <View style={styles.divider} />

          <AiExampleGenerationSection
            isGenerating={isGenerating}
            onGenerate={() => {
              void handleGenerate();
            }}
            onOverwriteChange={(value) => {
              void handleOverwriteChange(value);
            }}
            overwriteExamples={overwriteExamples}
            progress={progress}
          />

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
  });
