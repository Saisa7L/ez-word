import { useSQLiteContext } from 'expo-sqlite';
import { Plus, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
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
import { PaginationBar } from '@/components/PaginationBar';
import { SelectionMarker } from '@/components/SelectionMarker';
import { radii, type ThemeColors } from '@/constants/theme';
import {
  countWrongBookWords,
  listWrongBookWords,
  resolveWrongBookRemoval,
  type WrongBookEntry,
} from '@/database/wrongBookRepository';
import { useAppTheme, useThemedStyles } from '@/features/theme/ThemeProvider';
import { pushOnce } from '@/utils/navigationActions';
import { usePaginatedSelection } from '@/hooks/usePaginatedSelection';

const PAGE_SIZE = 5;

function formatSources(sources: string): string {
  const labels: Record<string, string> = {
    fill: '填空',
    listening: '听写',
    manual: '手动',
  };
  const sourceLabels = sources
    .split(',')
    .filter(Boolean)
    .map((source) => labels[source] ?? source);
  return sourceLabels.length > 0 ? sourceLabels.join('、') : '手动';
}

export default function WrongBookScreen() {
  const db = useSQLiteContext();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { showNotice } = useAppFeedback();
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);

  const loadPage = useCallback(
    async (targetPageIndex: number) => {
      const [totalCount, items] = await Promise.all([
        countWrongBookWords(db),
        listWrongBookWords(db, PAGE_SIZE, targetPageIndex * PAGE_SIZE),
      ]);
      return { items, totalCount };
    },
    [db],
  );

  const {
    clearSelection,
    isLoading,
    items: entries,
    pageCount,
    pageIndex,
    reload,
    selectedIds,
    setPageIndex,
    toggleSelection,
    totalCount,
  } = usePaginatedSelection<WrongBookEntry>({
    loadPage,
    pageSize: PAGE_SIZE,
  });

  function requestRemove() {
    if (selectedIds.size === 0 || isRemoving) {
      return;
    }

    setRemoveModalVisible(true);
  }

  async function handleRemove(targetStatus: 'learned' | 'unlearned') {
    setIsRemoving(true);
    try {
      await resolveWrongBookRemoval(db, [...selectedIds], targetStatus);
      clearSelection();
      await reload();
    } catch {
      showNotice('移除失败', '无法移出错题本，请稍后重试');
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <>
      <GreenSheetScreen title="错题本">
        <View style={styles.content}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTitle}>共 {totalCount} 个错题</Text>
            {selectedIds.size > 0 ? (
              <Text style={styles.selectedText}>
                已选 {selectedIds.size} 个
              </Text>
            ) : null}
          </View>

          <View style={styles.listPanel}>
            {isLoading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.accentText} size="large" />
              </View>
            ) : entries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>错题本还是空的</Text>
                <Text style={styles.emptyHint}>
                  完成每日任务后，填空和听写错误会自动加入
                </Text>
              </View>
            ) : (
              entries.map((entry, index) => {
                const selected = selectedIds.has(entry.id);
                return (
                  <Pressable
                    key={entry.id}
                    accessibilityRole="button"
                    onPress={() => toggleSelection(entry.id)}
                    style={({ pressed }) => [
                      styles.wordRow,
                      index < entries.length - 1 && styles.wordRowBorder,
                      selected && styles.wordRowSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.wordCopy}>
                      <Text style={styles.word}>{entry.word}</Text>
                      <Text numberOfLines={2} style={styles.meaning}>
                        {entry.meaning}
                      </Text>
                      <Text style={styles.meta}>
                        错误 {entry.wrong_count} 次 ·{' '}
                        {formatSources(entry.sources)}
                      </Text>
                    </View>
                    <SelectionMarker index={index} selected={selected} />
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

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => pushOnce('/wrong-book/add')}
              style={({ pressed }) => [
                styles.actionButton,
                styles.addButton,
                pressed && styles.pressed,
              ]}
            >
              <Plus color={colors.onPrimary} size={24} strokeWidth={2.4} />
              <Text style={styles.actionText}>添加</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={selectedIds.size === 0 || isRemoving}
              onPress={requestRemove}
              style={({ pressed }) => [
                styles.actionButton,
                styles.removeButton,
                (selectedIds.size === 0 || isRemoving) &&
                  styles.actionButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              {isRemoving ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <Trash2
                    color={colors.onPrimary}
                    size={23}
                    strokeWidth={2.3}
                  />
                  <Text style={styles.actionText}>移除</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </GreenSheetScreen>
      <ActionOptionModal
        message={`已选择 ${selectedIds.size} 个单词。请选择它们移出错题本后的状态：`}
        onClose={() => setRemoveModalVisible(false)}
        options={[
          {
            label: '已学习',
            onPress: () => {
              void handleRemove('learned');
            },
          },
          {
            label: '未学习',
            onPress: () => {
              void handleRemove('unlearned');
            },
          },
          {
            label: '取消',
            onPress: () => {},
            tone: 'danger',
          },
        ]}
        title="移出错题本"
        visible={removeModalVisible}
      />
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    actionButton: {
      alignItems: 'center',
      borderRadius: 28,
      flex: 1,
      flexDirection: 'row',
      gap: 9,
      height: 58,
      justifyContent: 'center',
    },
    actionButtonDisabled: {
      opacity: 0.42,
    },
    actions: {
      flexDirection: 'row',
      gap: 18,
      marginTop: 26,
    },
    actionText: {
      color: colors.onPrimary,
      fontSize: 21,
      fontWeight: '700',
    },
    addButton: {
      backgroundColor: colors.blue,
    },
    content: {
      paddingHorizontal: 22,
      paddingTop: 22,
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
    listPanel: {
      borderColor: colors.border,
      borderRadius: radii.md,
      borderWidth: 1,
      minHeight: 380,
      overflow: 'hidden',
    },
    loading: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 380,
    },
    meaning: {
      color: colors.textSecondary,
      fontSize: 16,
      lineHeight: 23,
      marginTop: 6,
    },
    meta: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 8,
    },
    pressed: {
      opacity: 0.68,
    },
    removeButton: {
      backgroundColor: colors.red,
    },
    selectedText: {
      color: colors.accentText,
      fontSize: 15,
      fontWeight: '600',
    },
    summaryRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    summaryTitle: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '700',
    },
    word: {
      color: colors.text,
      fontSize: 21,
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
