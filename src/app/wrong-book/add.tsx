import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Check } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GreenSheetScreen } from '@/components/GreenSheetScreen';
import { useAppFeedback } from '@/components/AppFeedbackProvider';
import { PaginationBar } from '@/components/PaginationBar';
import { radii, type ThemeColors } from '@/constants/theme';
import type { WordRecord } from '@/database/wordsRepository';
import { findWordByWord } from '@/database/wordsRepository';
import {
  addWrongBookWord,
  addWrongBookWords,
  countAvailableWordsForWrongBook,
  listAvailableWordsForWrongBook,
} from '@/database/wrongBookRepository';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';
import { getLastPageIndex, getPageCount } from '@/utils/pagination';

const PAGE_SIZE = 5;

type AddMode = 'existing' | 'manual';

export default function AddWrongBookWordScreen() {
  const db = useSQLiteContext();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { showNotice } = useAppFeedback();
  const [mode, setMode] = useState<AddMode>('existing');
  const [words, setWords] = useState<WordRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [manualWord, setManualWord] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (mode !== 'existing') {
        return;
      }

      let active = true;
      setIsLoading(true);

      Promise.all([
        countAvailableWordsForWrongBook(db),
        listAvailableWordsForWrongBook(db, PAGE_SIZE, pageIndex * PAGE_SIZE),
      ])
        .then(([count, nextWords]) => {
          if (!active) {
            return;
          }

          const lastPage = getLastPageIndex(count, PAGE_SIZE);
          if (pageIndex > lastPage) {
            setPageIndex(lastPage);
            return;
          }

          setWords(nextWords);
          setTotalCount(count);
        })
        .catch(() => {
          if (active) {
            setWords([]);
            setTotalCount(0);
          }
        })
        .finally(() => {
          if (active) {
            setIsLoading(false);
          }
        });

      return () => {
        active = false;
      };
    }, [db, mode, pageIndex]),
  );

  const pageCount = getPageCount(totalCount, PAGE_SIZE);

  function toggleSelection(wordId: number) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  }

  async function handleAddSelected() {
    if (selectedIds.size === 0 || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await addWrongBookWords(db, [...selectedIds], 'manual');
      router.back();
    } catch {
      showNotice('添加失败', '无法加入错题本，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleManualAdd() {
    const word = manualWord.trim();

    if (!word) {
      showNotice('请输入单词', '单词不能为空');
      return;
    }

    if (isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const existing = await findWordByWord(db, word);
      if (!existing) {
        showNotice('单词不存在', `当前词库中没有“${word}”，请先导入该单词`);
        return;
      }
      await addWrongBookWord(db, existing.id, 'manual');
      router.back();
    } catch {
      showNotice('添加失败', '无法保存并加入错题本，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <GreenSheetScreen
      onBack={() => router.back()}
      title="添加错题"
    >
      <View style={styles.content}>
        <View style={styles.segmentedControl}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setMode('existing')}
            style={[
              styles.segmentButton,
              mode === 'existing' && styles.segmentButtonActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                mode === 'existing' && styles.segmentTextActive,
              ]}
            >
              从词库选择
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setMode('manual')}
            style={[
              styles.segmentButton,
              mode === 'manual' && styles.segmentButtonActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                mode === 'manual' && styles.segmentTextActive,
              ]}
            >
              手动输入
            </Text>
          </Pressable>
        </View>

        {mode === 'existing' ? (
          <>
            <View style={styles.listPanel}>
              {isLoading ? (
                <View style={styles.loading}>
                  <ActivityIndicator color={colors.accentText} size="large" />
                </View>
              ) : words.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>没有可添加的单词</Text>
                  <Text style={styles.emptyHint}>
                    可以先导入 CSV，或者切换到手动输入
                  </Text>
                </View>
              ) : (
                words.map((word, index) => {
                  const selected = selectedIds.has(word.id);
                  return (
                    <Pressable
                      key={word.id}
                      accessibilityRole="button"
                      onPress={() => toggleSelection(word.id)}
                      style={({ pressed }) => [
                        styles.wordRow,
                        index < words.length - 1 && styles.wordRowBorder,
                        selected && styles.wordRowSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                    <View style={styles.wordCopy}>
                      <Text style={styles.word}>{word.word}</Text>
                      <Text numberOfLines={2} style={styles.meaning}>
                        {word.meaning}
                      </Text>
                    </View>
                      <View
                        style={[
                          styles.selectCircle,
                          selected && styles.selectCircleActive,
                        ]}
                      >
                        {selected ? (
                          <Check
                            color={colors.onPrimary}
                            size={23}
                            strokeWidth={3}
                          />
                        ) : (
                          <Text style={styles.orderText}>{index + 1}</Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>

            <PaginationBar
              disabled={isLoading}
              onPageChange={setPageIndex}
              pageCount={pageCount}
              pageIndex={pageIndex}
            />

            <Pressable
              accessibilityRole="button"
              disabled={selectedIds.size === 0 || isSaving}
              onPress={() => {
                void handleAddSelected();
              }}
              style={({ pressed }) => [
                styles.addSelectedButton,
                (selectedIds.size === 0 || isSaving) &&
                  styles.addSelectedButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.accentText} />
              ) : (
                <Text style={styles.addSelectedText}>
                  添加已选{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                </Text>
              )}
            </Pressable>
          </>
        ) : (
          <View style={styles.manualForm}>
            <Text style={styles.fieldLabel}>单词</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setManualWord}
              placeholder="输入已经导入过的单词"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={manualWord}
            />

            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => {
                void handleManualAdd();
              }}
              style={({ pressed }) => [
                styles.manualAddButton,
                isSaving && styles.manualAddButtonDisabled,
                pressed && !isSaving && styles.pressed,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.manualAddText}>查找并加入</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </GreenSheetScreen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  content: {
    paddingHorizontal: 22,
    paddingTop: 22,
  },
  addSelectedButton: {
    alignItems: 'center',
    backgroundColor: colors.graySoft,
    borderRadius: 28,
    height: 58,
    justifyContent: 'center',
    marginTop: 20,
  },
  addSelectedButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  addSelectedText: {
    color: colors.accentText,
    fontSize: 20,
    fontWeight: '700',
  },
  emptyHint: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 70,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 18,
  },
  input: {
    backgroundColor: colors.graySoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 18,
    height: 54,
    paddingHorizontal: 16,
  },
  listPanel: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 380,
    overflow: 'hidden',
    marginTop: 18,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 380,
  },
  manualAddButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 58,
    justifyContent: 'center',
    marginTop: 30,
  },
  manualAddButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  manualAddText: {
    color: colors.onPrimary,
    fontSize: 21,
    fontWeight: '700',
  },
  manualForm: {
    marginTop: 6,
  },
  meaning: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 23,
    marginTop: 6,
  },
  pressed: {
    opacity: 0.68,
  },
  orderText: {
    color: colors.textSecondary,
    fontSize: 17,
    fontWeight: '600',
  },
  selectCircle: {
    alignItems: 'center',
    borderColor: colors.accentText,
    borderRadius: 22,
    borderWidth: 1.5,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  selectCircleActive: {
    backgroundColor: colors.primary,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: radii.md,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentedControl: {
    backgroundColor: colors.graySoft,
    borderRadius: radii.md,
    flexDirection: 'row',
    padding: 4,
  },
  segmentText: {
    color: colors.textSecondary,
    fontSize: 17,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.onPrimary,
  },
  word: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  wordCopy: {
    flex: 1,
    marginRight: 16,
  },
  wordRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  wordRowBorder: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  wordRowSelected: {
    backgroundColor: colors.mint,
  },
});
