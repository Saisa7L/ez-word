import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Plus,
  Trash2,
} from 'lucide-react-native';
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
  deactivateWords,
  getActiveWordCount,
  listActiveWords,
  type LearningStatus,
  type WordRecord,
} from '@/database/wordsRepository';
import { setWordsLearningStatus } from '@/database/wrongBookRepository';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';
import { usePaginatedSelection } from '@/hooks/usePaginatedSelection';

const PAGE_SIZE = 5;

const STATUS_LABELS: Record<LearningStatus, string> = {
  learned: '已学习',
  unlearned: '未学习',
  wrong: '错题',
};

export default function WordLibraryScreen() {
  const db = useSQLiteContext();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { showConfirm, showNotice } = useAppFeedback();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  const loadPage = useCallback(
    async (targetPageIndex: number) => {
      const [totalCount, items] = await Promise.all([
        getActiveWordCount(db),
        listActiveWords(db, PAGE_SIZE, targetPageIndex * PAGE_SIZE),
      ]);
      return { items, totalCount };
    },
    [db],
  );

  const {
    clearSelection,
    isLoading,
    items: words,
    pageCount,
    pageIndex,
    reload,
    selectedIds,
    setPageIndex,
    toggleSelection,
    totalCount,
  } = usePaginatedSelection<WordRecord>({
    loadPage,
    pageSize: PAGE_SIZE,
  });

  function requestRemove() {
    if (selectedIds.size === 0 || isRemoving) {
      return;
    }

    showConfirm({
      confirmLabel: '移除',
      danger: true,
      message: `将选中的 ${selectedIds.size} 个单词移出当前词库。学习状态、学习历史和错题记录都会保留。`,
      onConfirm: () => {
        void handleRemove();
      },
      title: '从当前词库移除？',
    });
  }

  async function handleRemove() {
    setIsRemoving(true);
    try {
      await deactivateWords(db, [...selectedIds]);
      clearSelection();
      await reload();
    } catch {
      showNotice('移除失败', '无法从当前词库移除单词，请稍后重试');
    } finally {
      setIsRemoving(false);
    }
  }

  function requestStatusChange() {
    if (selectedIds.size === 0 || isUpdatingStatus) {
      return;
    }

    setStatusModalVisible(true);
  }

  async function handleStatusChange(status: 'learned' | 'unlearned') {
    setIsUpdatingStatus(true);
    try {
      await setWordsLearningStatus(db, [...selectedIds], status);
      clearSelection();
      await reload();
    } catch {
      showNotice('修改失败', '无法修改单词状态，请稍后重试');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <>
      <GreenSheetScreen
        onBack={() => router.back()}
        title="当前词库"
      >
        <View style={styles.content}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTitle}>共 {totalCount} 个单词</Text>
          {selectedIds.size > 0 ? (
            <Text style={styles.selectedText}>已选 {selectedIds.size} 个</Text>
          ) : null}
        </View>

        <View style={styles.listPanel}>
          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.accentText} size="large" />
            </View>
          ) : words.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>当前词库为空</Text>
              <Text style={styles.emptyHint}>可以点击下方按钮添加新单词</Text>
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
                    <View style={styles.wordHeader}>
                      <Text style={styles.word}>{word.word}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          word.learning_status === 'wrong' &&
                            styles.statusBadgeWrong,
                          word.learning_status === 'learned' &&
                            styles.statusBadgeLearned,
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {STATUS_LABELS[word.learning_status]}
                        </Text>
                      </View>
                    </View>
                    <Text numberOfLines={2} style={styles.meaning}>
                      {word.meaning}
                    </Text>
                    <Text style={styles.phonetic}>
                      {word.phonetic || '暂无音标'}
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

        <Pressable
          accessibilityRole="button"
          disabled={selectedIds.size === 0 || isUpdatingStatus}
          onPress={requestStatusChange}
          style={({ pressed }) => [
            styles.statusButton,
            (selectedIds.size === 0 || isUpdatingStatus) &&
              styles.statusButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          {isUpdatingStatus ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.statusButtonText}>修改单词状态</Text>
          )}
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/settings/word-library/add')}
            style={({ pressed }) => [
              styles.actionButton,
              styles.addButton,
              pressed && styles.pressed,
            ]}
          >
            <Plus color={colors.onPrimary} size={24} strokeWidth={2.4} />
            <Text style={styles.actionText}>添加单词</Text>
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
                <Trash2 color={colors.onPrimary} size={23} strokeWidth={2.3} />
                <Text style={styles.actionText}>移除</Text>
              </>
            )}
          </Pressable>
        </View>
        </View>
      </GreenSheetScreen>
      <ActionOptionModal
        message={`将选中的 ${selectedIds.size} 个单词统一修改为：`}
        onClose={() => setStatusModalVisible(false)}
        options={[
          {
            label: '已学习',
            onPress: () => {
              void handleStatusChange('learned');
            },
          },
          {
            label: '未学习',
            onPress: () => {
              void handleStatusChange('unlearned');
            },
          },
          {
            label: '取消',
            onPress: () => {},
            tone: 'danger',
          },
        ]}
        title="修改单词状态"
        visible={statusModalVisible}
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
    fontSize: 20,
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
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 380,
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
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },
  phonetic: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 6,
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
  statusButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginTop: 20,
  },
  statusButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  statusButtonText: {
    color: colors.onPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: colors.graySoft,
    borderRadius: 10,
    marginLeft: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusBadgeLearned: {
    backgroundColor: colors.blueSoft,
  },
  statusBadgeWrong: {
    backgroundColor: colors.redSoft,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryRow: {
    marginBottom: 14,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '700',
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
  wordHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  wordRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 86,
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
