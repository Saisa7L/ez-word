import { RefreshCw } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import type { ThemeColors } from '@/constants/theme';
import type { WordDataGenerationProgress } from '@/features/ai/generateWordData';
import { useAppTheme, useThemedStyles } from '@/features/theme/ThemeProvider';

type AiWordDataGenerationSectionProps = {
  isGenerating: boolean;
  onGenerate: () => void;
  onOverwriteChange: (value: boolean) => void;
  overwriteExisting: boolean;
  progress: WordDataGenerationProgress | null;
};

export function AiWordDataGenerationSection({
  isGenerating,
  onGenerate,
  onOverwriteChange,
  overwriteExisting,
  progress,
}: AiWordDataGenerationSectionProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>生成单词数据</Text>
      <Text style={styles.hint}>
        使用 DeepSeek
        自动补齐当前词库中缺少音标或例句的单词，并把结果保存到本地数据库。单词和释义不会被修改。
      </Text>

      <View style={styles.switchRow}>
        <View style={styles.switchCopy}>
          <Text style={styles.switchTitle}>覆盖已有单词数据</Text>
          <Text style={styles.switchHint}>
            开启后会重新生成已有音标和例句；释义始终不变
          </Text>
        </View>
        <Switch
          accessibilityHint="开启后会重新生成已有音标和例句，释义不会改变"
          accessibilityLabel="覆盖已有单词数据"
          accessibilityState={{ checked: overwriteExisting }}
          onValueChange={onOverwriteChange}
          thumbColor={colors.surface}
          trackColor={{ false: colors.border, true: colors.accentText }}
          value={overwriteExisting}
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
        onPress={onGenerate}
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
            <RefreshCw color={colors.accentText} size={23} strokeWidth={2.3} />
            <Text style={styles.generateText}>生成单词数据</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    hint: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 23,
      marginTop: 8,
    },
    pressed: {
      opacity: 0.66,
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
    section: {
      width: '100%',
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
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '700',
    },
  });
