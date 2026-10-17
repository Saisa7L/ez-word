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
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImportResultModal } from '@/components/ImportResultModal';
import { SurfaceCard } from '@/components/SurfaceCard';
import { colors, shadow, spacing } from '@/constants/theme';
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

export default function ImportWordsScreen() {
  const db = useSQLiteContext();
  const [file, setFile] = useState<PickedCsvFile | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [activeWordCount, setActiveWordCount] = useState<number | null>(null);
  const [summary, setSummary] = useState<WordImportSummary | null>(null);

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
      Alert.alert(
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
      Alert.alert(
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

    Alert.alert(
      '清空已导入单词？',
      '学习记录、学习天数、打卡和错题本记录会保留。清空后可以重新导入 CSV。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清空',
          style: 'destructive',
          onPress: () => {
            void handleClearWords();
          },
        },
      ],
    );
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
      Alert.alert(
        '清空完成',
        `已清空 ${clearedCount} 个单词，学习记录和错题记录仍然保留`,
      );
    } catch {
      Alert.alert('清空失败', '无法清空已导入单词，请稍后重试');
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
            <ArrowLeft color={colors.surface} size={34} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.headerTitle}>导入单词</Text>
          <View style={styles.headerPlaceholder} />
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
              <FileSpreadsheet color={colors.primary} size={42} strokeWidth={1.8} />
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
                <ActivityIndicator color={colors.surface} />
              ) : (
                <View style={styles.importButtonContent}>
                  <Upload color={colors.surface} size={25} strokeWidth={2.2} />
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
            <BookOpen color={colors.primary} size={24} strokeWidth={2.2} />
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
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: colors.primary,
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
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  chooseButtonText: {
    color: colors.primary,
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
    color: colors.primary,
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
    backgroundColor: colors.mint,
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
    color: colors.surface,
    fontSize: 25,
    fontWeight: '700',
  },
  importButton: {
    backgroundColor: colors.primary,
  },
  importButtonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  importButtonDisabled: {
    backgroundColor: '#B9C0CA',
  },
  importButtonText: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: '600',
  },
  viewLibraryButton: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: 24,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 10,
    height: 56,
    justifyContent: 'center',
    marginBottom: 14,
  },
  viewLibraryText: {
    color: colors.primary,
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
