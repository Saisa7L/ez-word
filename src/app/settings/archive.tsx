import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Download,
  FileArchive,
  Upload,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { GreenSheetScreen } from '@/components/GreenSheetScreen';
import { useAppFeedback } from '@/components/AppFeedbackProvider';
import { radii, type ThemeColors } from '@/constants/theme';
import {
  createArchiveSnapshot,
  parseArchiveSnapshot,
  restoreArchiveSnapshot,
  stringifyArchive,
  type ArchiveSummary,
} from '@/features/archive/archiveSnapshot';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';
import {
  exportArchiveFile,
  pickArchiveFile,
} from '@/services/archiveFiles';

export default function ArchiveSettingsScreen() {
  const db = useSQLiteContext();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { showConfirm, showNotice } = useAppFeedback();
  const { reloadTheme } = useAppTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [lastSummary, setLastSummary] = useState<ArchiveSummary | null>(null);

  async function handleExport() {
    if (isExporting) {
      return;
    }

    setIsExporting(true);
    try {
      const snapshot = await createArchiveSnapshot(db);
      const saved = await exportArchiveFile(stringifyArchive(snapshot));
      if (!saved) {
        showNotice('已取消导出', '没有选择保存目录');
        return;
      }

      setLastSummary(snapshot.summary);
      showNotice(
        '导出成功',
        `已导出 ${snapshot.summary.words} 个单词、${snapshot.summary.checkins} 条学习完成记录`,
      );
    } catch (error) {
      showNotice(
        '导出失败',
        error instanceof Error ? error.message : '无法生成存档文件',
      );
    } finally {
      setIsExporting(false);
    }
  }

  async function handlePickArchive() {
    if (isImporting) {
      return;
    }

    try {
      const file = await pickArchiveFile();
      if (!file) {
        return;
      }

      const snapshot = parseArchiveSnapshot(file.content);
      showConfirm({
        confirmLabel: '覆盖并导入',
        danger: true,
        message: `存档包含 ${snapshot.summary.words} 个单词、${snapshot.summary.learnedWords} 条学习记录、${snapshot.summary.wrongWords} 个错题和 ${snapshot.summary.checkins} 条完成记录，并会恢复个人资料和通用设置。导入会完整替换当前本地数据。`,
        onConfirm: () => {
          void handleRestore(file.name, snapshot);
        },
        title: '导入本地存档？',
      });
    } catch (error) {
      showNotice(
        '无法读取存档',
        error instanceof Error ? error.message : '存档文件格式不正确',
      );
    }
  }

  async function handleRestore(
    fileName: string,
    snapshot: ReturnType<typeof parseArchiveSnapshot>,
  ) {
    setIsImporting(true);
    try {
      try {
        await restoreArchiveSnapshot(db, snapshot);
      } catch {
        showNotice(
          '导入失败',
          '无法恢复存档，当前数据未被修改',
        );
        return;
      }

      setLastSummary(snapshot.summary);

      try {
        await reloadTheme();
      } catch {
        showNotice(
          '数据已恢复',
          `已从“${fileName}”恢复数据，但主题刷新失败，请重启 App`,
        );
        return;
      }

      showNotice('导入成功', `已从“${fileName}”恢复本地数据`);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <GreenSheetScreen
      onBack={() => router.back()}
      title="本地存档"
    >
      <View style={styles.content}>
        <View style={styles.intro}>
          <View style={styles.iconBox}>
            <FileArchive color={colors.accentText} size={32} strokeWidth={2} />
          </View>
          <Text style={styles.title}>离线迁移本地数据</Text>
          <Text style={styles.hint}>
            存档包含词库、例句、学习记录、错题本、个人资料和通用设置。
            DeepSeek API Key 不会写入存档。
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isExporting}
          onPress={() => {
            void handleExport();
          }}
          style={({ pressed }) => [
            styles.primaryButton,
            isExporting && styles.disabledButton,
            pressed && styles.pressed,
          ]}
        >
          {isExporting ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <>
              <Download color={colors.accentText} size={24} strokeWidth={2.3} />
              <Text style={styles.primaryText}>导出本地存档</Text>
            </>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={isImporting}
          onPress={() => {
            void handlePickArchive();
          }}
          style={({ pressed }) => [
            styles.secondaryButton,
            isImporting && styles.disabledButton,
            pressed && styles.pressed,
          ]}
        >
          {isImporting ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <>
              <Upload color={colors.accentText} size={24} strokeWidth={2.3} />
              <Text style={styles.secondaryText}>导入本地存档</Text>
            </>
          )}
        </Pressable>

        {lastSummary ? (
          <View style={styles.summaryPanel}>
            <Text style={styles.summaryTitle}>最近一次存档</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>用户名</Text>
              <Text style={styles.summaryValue}>{lastSummary.displayName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>单词</Text>
              <Text style={styles.summaryValue}>{lastSummary.words}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>学习记录</Text>
              <Text style={styles.summaryValue}>
                {lastSummary.learnedWords}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>错题</Text>
              <Text style={styles.summaryValue}>{lastSummary.wrongWords}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>完成记录</Text>
              <Text style={styles.summaryValue}>{lastSummary.checkins}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.warning}>
          <Text style={styles.warningText}>
            导入存档会整体替换当前词库和学习数据。建议先导出一份当前存档作为备份。
          </Text>
        </View>
      </View>
    </GreenSheetScreen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  content: {
    paddingHorizontal: 22,
    paddingTop: 24,
  },
  disabledButton: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
    textAlign: 'center',
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: colors.mint,
    borderRadius: 22,
    height: 66,
    justifyContent: 'center',
    width: 66,
  },
  intro: {
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  pressed: {
    opacity: 0.68,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.graySoft,
    borderRadius: 28,
    flexDirection: 'row',
    gap: 9,
    height: 58,
    justifyContent: 'center',
    marginTop: 30,
  },
  primaryText: {
    color: colors.accentText,
    fontSize: 20,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.accentText,
    borderRadius: 28,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 9,
    height: 58,
    justifyContent: 'center',
    marginTop: 14,
  },
  secondaryText: {
    color: colors.accentText,
    fontSize: 20,
    fontWeight: '700',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  summaryPanel: {
    backgroundColor: colors.graySoft,
    borderRadius: radii.md,
    marginTop: 24,
    padding: 18,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  summaryValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 18,
  },
  warning: {
    backgroundColor: colors.orangeSoft,
    borderRadius: radii.md,
    marginTop: 24,
    padding: 16,
  },
  warningText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
});
