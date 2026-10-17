import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Check,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ActionOptionModal } from '@/components/ActionOptionModal';
import { GreenSheetScreen } from '@/components/GreenSheetScreen';
import { PaginationBar } from '@/components/PaginationBar';
import { colors, radii } from '@/constants/theme';
import {
  countWrongBookWords,
  listWrongBookWords,
  resolveWrongBookRemoval,
  type WrongBookEntry,
} from '@/database/wrongBookRepository';

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
  const [entries, setEntries] = useState<WrongBookEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);

  const loadCurrentPage = useCallback(async () => {
    setIsLoading(true);
    try {
      const [count, nextEntries] = await Promise.all([
        countWrongBookWords(db),
        listWrongBookWords(db, PAGE_SIZE, pageIndex * PAGE_SIZE),
      ]);
      const lastPage = Math.max(0, Math.ceil(count / PAGE_SIZE) - 1);
      if (pageIndex > lastPage) {
        setPageIndex(lastPage);
        return;
      }

      setEntries(nextEntries);
      setTotalCount(count);
    } catch {
      setEntries([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [db, pageIndex]);

  useFocusEffect(
    useCallback(() => {
      void loadCurrentPage();
    }, [loadCurrentPage]),
  );

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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
      setSelectedIds(new Set());
      await loadCurrentPage();
    } catch {
      Alert.alert('移除失败', '无法移出错题本，请稍后重试');
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
            <Text style={styles.selectedText}>已选 {selectedIds.size} 个</Text>
          ) : null}
        </View>

        <View style={styles.listPanel}>
          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} size="large" />
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
                      错误 {entry.wrong_count} 次 · {formatSources(entry.sources)}
                    </Text>
                  </View>
                  <View style={[styles.selectCircle, selected && styles.selectCircleActive]}>
                    {selected ? (
                      <Check color={colors.surface} size={24} strokeWidth={3} />
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

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/wrong-book/add')}
            style={({ pressed }) => [
              styles.actionButton,
              styles.addButton,
              pressed && styles.pressed,
            ]}
          >
            <Plus color={colors.surface} size={24} strokeWidth={2.4} />
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
              <ActivityIndicator color={colors.surface} />
            ) : (
              <>
                <Trash2 color={colors.surface} size={23} strokeWidth={2.3} />
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

const styles = StyleSheet.create({
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
    color: colors.surface,
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
  orderText: {
    color: colors.textSecondary,
    fontSize: 17,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.68,
  },
  removeButton: {
    backgroundColor: colors.red,
  },
  selectCircle: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: 22,
    borderWidth: 1.5,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  selectCircleActive: {
    backgroundColor: colors.primary,
  },
  selectedText: {
    color: colors.primary,
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
