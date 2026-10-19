import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppFeedback } from '@/components/AppFeedbackProvider';
import { ImportResultModal } from '@/components/ImportResultModal';
import { ImportInfoIcon } from '@/components/icons/ImportInfoIcon';
import { spacing, type ThemeColors } from '@/constants/theme';
import {
  deactivateAllWords,
  getActiveWordCount,
} from '@/database/wordsRepository';
import { ImportFileCard } from '@/features/word-import/components/ImportFileCard';
import { ImportInfoModal } from '@/features/word-import/components/ImportInfoModal';
import { WordLibraryActions } from '@/features/word-import/components/WordLibraryActions';
import { importWordCsv } from '@/features/word-import/importWordCsv';
import {
  type PickedCsvFile,
  type WordImportSummary,
} from '@/features/word-import/types';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';
import { pickWordCsvFile } from '@/services/wordCsvFiles';

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
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
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
        <ImportFileCard
          file={file}
          importDisabled={importDisabled}
          isImporting={isImporting}
          onImport={() => {
            void handleImport();
          }}
          onPickFile={() => {
            void handlePickFile();
          }}
        />
        <WordLibraryActions
          activeWordCount={activeWordCount}
          clearDisabled={clearDisabled}
          isClearing={isClearing}
          onClear={requestClearWords}
          onViewLibrary={() => router.push('/settings/word-library')}
        />
      </ScrollView>

      <ImportResultModal
        onConfirm={() => setSummary(null)}
        summary={summary}
        visible={summary !== null}
      />
      <ImportInfoModal
        onClose={() => setInfoVisible(false)}
        visible={infoVisible}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      height: 150,
      justifyContent: 'space-between',
      paddingHorizontal: 14,
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
