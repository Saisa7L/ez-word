import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  ArrowLeft,
  BookOpen,
  FileSpreadsheet,
  Trash2,
  Upload,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImportResultModal } from '@/components/ImportResultModal';
import { useAppFeedback } from '@/components/AppFeedbackProvider';
import { SurfaceCard } from '@/components/SurfaceCard';
import { ImportInfoIcon } from '@/components/icons/ImportInfoIcon';
import {
  DEFAULT_GREEN,
  DEFAULT_GREEN_SOFT,
  radii,
  shadow,
  spacing,
  type ThemeColors,
} from '@/constants/theme';
import {
  importWordCsv,
  pickWordCsvFile,
} from '@/features/word-import/importWordCsv';
import {
  type PickedCsvFile,
  type WordImportSummary,
} from '@/features/word-import/types';
import {
  deactivateAllWords,
  getActiveWordCount,
} from '@/database/wordsRepository';
import { formatBytes } from '@/utils/formatBytes';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';

export default function ImportWordsScreen() {
  const db = useSQLiteContext();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { showConfirm, showNotice } = useAppFeedback();
  const [file, setFile] = useState<PickedCsvFile | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [activeWordCount, setActiveWordCount] = useState<number | null>(null);
  const [summary, setSummary] = useState<WordImportSummary | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);

  const importDisabled = !file || isImporting || isClearing;
  const clearDisabled =
    isImporting || isClearing || activeWordCount === null || activeWordCount === 0;

  useEffect(() => {
    let active = true;

    getActiveWordCount(db)
      .then((count) => {
        if (active) {
          setActiveWordCount(count);
        }
      })
      .catch(() => {
        if (active) {
          setActiveWordCount(null);
        }
      });

    return () => {
      active = false;
    };
  }, [db]);

  async function handlePickFile() {
    try {
      const selectedFile = await pickWordCsvFile();
      if (!selectedFile) {
        return;
      }

      setFile(selectedFile);
      setSummary(null);
    } catch (error) {
      showNotice(
        '选择文件失败',
        error instanceof Error ? error.message : '无法读取所选文件',
      );
    }
  }

  async function handleImport() {
    if (!file || isImporting || isClearing) {
      return;
    }

    setIsImporting(true);
    try {
      const result = await importWordCsv(db, file.content);
      setSummary(result);
      try {
        setActiveWordCount(await getActiveWordCount(db));
      } catch {
        setActiveWordCount(null);
      }
    } catch (error) {
      showNotice(
        '导入失败',
        error instanceof Error ? error.message : '导入过程中发生未知错误',
      );
    } finally {
      setIsImporting(false);
    }
  }

  function requestClearWords() {
    if (clearDisabled) {
      return;
    }

    showConfirm({
      confirmLabel: '清空',
      danger: true,
      message:
        '学习记录、学习天数、打卡和错题本记录会保留。清空后可以重新导入 CSV。',
      onConfirm: () => {
        void handleClearWords();
      },
      title: '清空已导入单词？',
    });
  }

  async function handleClearWords() {
    if (isClearing) {
      return;
    }

    setIsClearing(true);
    try {
      const clearedCount = await deactivateAllWords(db);
      setActiveWordCount(0);
      setSummary(null);
      showNotice(
        '清空完成',
        `已清空 ${clearedCount} 个单词，学习记录和错题记录仍然保留`,
      );
    } catch {
      showNotice('清空失败', '无法清空已导入单词，请稍后重试');
    } finally {
      setIsClearing(false);
    }
  }

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
            <ArrowLeft color={colors.onPrimary} size={34} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.headerTitle}>导入单词</Text>
          <Pressable
            accessibilityLabel="查看导入说明"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setInfoVisible(true)}
            style={({ pressed }) => [
              styles.infoButton,
              pressed && styles.pressed,
            ]}
          >
            <ImportInfoIcon color={colors.onPrimary} size={30} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <SurfaceCard style={styles.importCard}>
          <Text style={styles.cardTitle}>从 CSV 文件导入</Text>

          <View style={styles.fileRow}>
            <View style={styles.fileIconBox}>
              <FileSpreadsheet color={DEFAULT_GREEN} size={42} strokeWidth={1.8} />
              <Text style={styles.csvBadge}>CSV</Text>
            </View>

            <View style={styles.fileCopy}>
              <Text numberOfLines={1} style={styles.fileName}>
                {file?.name ?? '未选择文件'}
              </Text>
              <Text style={styles.fileMeta}>
                {file ? formatBytes(file.size) : '请选择 CSV 文件'}
              </Text>
            </View>

            {file ? (
              <Pressable
                accessibilityRole="button"
                onPress={handlePickFile}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.changeFileText}>更改文件</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={handlePickFile}
              style={({ pressed }) => [
                styles.actionButton,
                styles.chooseButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.chooseButtonText}>选择文件</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={importDisabled}
              onPress={handleImport}
              style={({ pressed }) => [
                styles.actionButton,
                styles.importButton,
                importDisabled && styles.importButtonDisabled,
                pressed && !importDisabled && styles.pressed,
              ]}
            >
              {isImporting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.importButtonContent}>
                  <Upload color="#FFFFFF" size={25} strokeWidth={2.2} />
                  <Text style={styles.importButtonText}>开始导入</Text>
                </View>
              )}
            </Pressable>
          </View>
        </SurfaceCard>

        <View style={styles.clearSection}>
          <Text style={styles.activeCountText}>
            {activeWordCount === null
              ? '正在读取当前词库'
              : `当前词库共 ${activeWordCount} 个单词`}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/settings/word-library')}
            style={({ pressed }) => [
              styles.viewLibraryButton,
              pressed && styles.pressed,
            ]}
          >
            <BookOpen color={colors.accentText} size={24} strokeWidth={2.2} />
            <Text style={styles.viewLibraryText}>查看当前词库</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={clearDisabled}
            onPress={requestClearWords}
            style={({ pressed }) => [
              styles.clearButton,
              clearDisabled && styles.clearButtonDisabled,
              pressed && !clearDisabled && styles.pressed,
            ]}
          >
            {isClearing ? (
              <ActivityIndicator color={colors.red} />
            ) : (
              <>
                <Trash2 color={colors.red} size={24} strokeWidth={2.2} />
                <Text style={styles.clearButtonText}>清空已导入单词</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <ImportResultModal
        onConfirm={() => setSummary(null)}
        summary={summary}
        visible={summary !== null}
      />

      <Modal
        animationType="fade"
        onRequestClose={() => setInfoVisible(false)}
        transparent
        visible={infoVisible}
      >
        <View style={styles.infoOverlay}>
          <View style={styles.infoDialog}>
            <ScrollView
              contentContainerStyle={styles.infoContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.infoTitle}>导入说明</Text>

              <Text style={styles.infoSectionTitle}>导入步骤</Text>
              <Text style={styles.infoText}>
                1. 准备符合格式要求的 CSV 文件{'\n'}
                2. 点击“选择文件”{'\n'}
                3. 点击“开始导入”{'\n'}
                4. 在结果弹窗中确认导入数量
              </Text>

              <Text style={styles.infoSectionTitle}>文件要求</Text>
              <Text style={styles.infoText}>
                • 文件扩展名必须为 .csv{'\n'}
                • 文件编码使用 UTF-8{'\n'}
                • 第一行必须是列名{'\n'}
                • 每一行代表一个单词
              </Text>

              <Text style={styles.infoSectionTitle}>数据格式</Text>
              <Text style={styles.infoText}>
                必要列：word、meaning、phonetic{'\n'}
                可选列：example{'\n'}
                兼容中文列名：单词、释义、中文释义、音标、sentence、例句
              </Text>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>
                  word,meaning,phonetic,example{'\n'}
                  abandon,放弃；抛弃,/əˈbændən/,They had to abandon the plan.
                </Text>
              </View>

              <Text style={styles.infoSectionTitle}>导入规则</Text>
              <Text style={styles.infoText}>
                • 单词和释义不能为空{'\n'}
                • 音标列必须存在，但单元格可留空{'\n'}
                • 同一个文件内重复单词会跳过{'\n'}
                • 已存在的单词会更新释义和音标{'\n'}
                • 有问题的行会跳过，不影响其他合法行
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={() => setInfoVisible(false)}
                style={({ pressed }) => [
                  styles.infoConfirmButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.infoConfirmText}>知道了</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 28,
    flex: 1,
    height: 58,
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 76,
  },
  backButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '600',
  },
  changeFileText: {
    color: colors.accentText,
    fontSize: 18,
    textDecorationLine: 'underline',
  },
  clearButton: {
    alignItems: 'center',
    borderColor: colors.red,
    borderRadius: 24,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 10,
    height: 56,
    justifyContent: 'center',
  },
  clearButtonDisabled: {
    borderColor: colors.border,
    opacity: 0.5,
  },
  clearButtonText: {
    color: colors.red,
    fontSize: 19,
    fontWeight: '600',
  },
  clearSection: {
    marginTop: 28,
  },
  chooseButton: {
    borderColor: colors.accentText,
    borderWidth: 1.5,
  },
  chooseButtonText: {
    color: colors.accentText,
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  activeCountText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  csvBadge: {
    color: DEFAULT_GREEN,
    fontSize: 10,
    fontWeight: '800',
    position: 'absolute',
    bottom: 7,
    right: 12,
  },
  fileCopy: {
    flex: 1,
    marginLeft: 18,
    marginRight: 12,
  },
  fileIconBox: {
    alignItems: 'center',
    backgroundColor: DEFAULT_GREEN_SOFT,
    borderRadius: 14,
    height: 72,
    justifyContent: 'center',
    position: 'relative',
    width: 72,
  },
  fileMeta: {
    color: colors.textSecondary,
    fontSize: 17,
    marginTop: 7,
  },
  fileName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  fileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 34,
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
    color: colors.onPrimary,
    fontSize: 25,
    fontWeight: '700',
  },
  infoButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  infoConfirmButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 54,
    justifyContent: 'center',
    marginTop: 26,
  },
  infoConfirmText: {
    color: colors.onPrimary,
    fontSize: 19,
    fontWeight: '700',
  },
  infoContent: {
    padding: 24,
  },
  infoDialog: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    maxHeight: '84%',
    overflow: 'hidden',
    width: '88%',
  },
  infoOverlay: {
    alignItems: 'center',
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  infoSectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 22,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 9,
  },
  infoTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '800',
  },
  importButton: {
    backgroundColor: DEFAULT_GREEN,
  },
  importButtonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  importButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  codeBlock: {
    backgroundColor: colors.graySoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  codeText: {
    color: colors.text,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 19,
  },
  viewLibraryButton: {
    alignItems: 'center',
    borderColor: colors.accentText,
    borderRadius: 24,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 10,
    height: 56,
    justifyContent: 'center',
    marginBottom: 14,
  },
  viewLibraryText: {
    color: colors.accentText,
    fontSize: 19,
    fontWeight: '600',
  },
  importCard: {
    ...shadow,
    marginTop: 24,
    padding: 28,
  },
  pressed: {
    opacity: 0.65,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scroll: {
    flex: 1,
    marginTop: -72,
  },
});
