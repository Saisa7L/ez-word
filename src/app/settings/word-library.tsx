import { Plus, Trash2 } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppFeedback } from '@/components/AppFeedbackProvider';
import { GreenSheetScreen } from '@/components/GreenSheetScreen';
import { PaginationBar } from '@/components/PaginationBar';
import { radii, type ThemeColors } from '@/constants/theme';
import { WordLibraryRow } from '@/features/word-library/WordLibraryRow';
import { WordStatusMenu } from '@/features/word-library/WordStatusMenu';
import { useWordLibrary } from '@/features/word-library/useWordLibrary';
import { useAppTheme, useThemedStyles } from '@/features/theme/ThemeProvider';
import { useSettingsBackNavigation } from '@/hooks/useSettingsBackNavigation';
import { pushOnce } from '@/utils/navigationActions';

export default function WordLibraryScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { showConfirm, showNotice } = useAppFeedback();
  const handleBack = useSettingsBackNavigation();
  const {
    changeSelectedStatus,
    isLoading,
    isRemoving,
    isUpdatingStatus,
    pageCount,
    pageIndex,
    removeSelectedWords,
    selectedIds,
    setPageIndex,
    setStatusModalVisible,
    statusModalVisible,
    toggleSelection,
    totalCount,
    words,
  } = useWordLibrary({ notify: showNotice });

  function requestRemove() {
    if (selectedIds.size === 0 || isRemoving) {
      return;
    }

    showConfirm({
      confirmLabel: '移除',
      danger: true,
      message: `将选中的 ${selectedIds.size} 个单词移出当前词库。学习状态、学习历史和错题记录都会保留。`,
      onConfirm: () => {
        void removeSelectedWords();
      },
      title: '从当前词库移除？',
    });
  }

  function requestStatusChange() {
    if (selectedIds.size === 0 || isUpdatingStatus) {
      return;
    }

    setStatusModalVisible(true);
  }

  return (
    <>
      <GreenSheetScreen onBack={handleBack} title="当前词库">
        <View style={styles.content}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTitle}>共 {totalCount} 个单词</Text>
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
            ) : words.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>当前词库为空</Text>
                <Text style={styles.emptyHint}>可以点击下方按钮添加新单词</Text>
              </View>
            ) : (
              words.map((word, index) => (
                <WordLibraryRow
                  index={index}
                  isLast={index === words.length - 1}
                  key={word.id}
                  onPress={() => toggleSelection(word.id)}
                  pressedStyle={styles.pressed}
                  selected={selectedIds.has(word.id)}
                  word={word}
                />
              ))
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
              onPress={() => pushOnce('/settings/word-library/add')}
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

      <WordStatusMenu
        onClose={() => setStatusModalVisible(false)}
        onSelect={(status) => {
          void changeSelectedStatus(status);
        }}
        selectedCount={selectedIds.size}
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
    summaryRow: {
      marginBottom: 14,
    },
    summaryTitle: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '700',
    },
  });
