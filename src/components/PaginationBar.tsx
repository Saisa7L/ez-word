import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

type PaginationBarProps = {
  disabled?: boolean;
  onPageChange: (pageIndex: number) => void;
  pageCount: number;
  pageIndex: number;
};

export function PaginationBar({
  disabled = false,
  onPageChange,
  pageCount,
  pageIndex,
}: PaginationBarProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [pageInput, setPageInput] = useState(String(pageIndex + 1));
  const [error, setError] = useState('');

  function openPageInput() {
    if (disabled) {
      return;
    }
    setPageInput(String(pageIndex + 1));
    setError('');
    setModalVisible(true);
  }

  function submitPage() {
    const targetPage = Number(pageInput.trim());
    if (
      !Number.isInteger(targetPage) ||
      targetPage < 1 ||
      targetPage > pageCount
    ) {
      setError(`请输入 1-${pageCount} 之间的页码`);
      return;
    }

    setModalVisible(false);
    onPageChange(targetPage - 1);
  }

  return (
    <>
      <View style={styles.container}>
        <Pressable
          accessibilityLabel="上一页"
          accessibilityRole="button"
          disabled={disabled || pageIndex === 0}
          onPress={() => onPageChange(Math.max(0, pageIndex - 1))}
          style={({ pressed }) => [
            styles.arrowButton,
            (disabled || pageIndex === 0) && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <ChevronLeft color={colors.primary} size={28} strokeWidth={2.2} />
        </Pressable>

        <Pressable
          accessibilityLabel="输入页码跳转"
          accessibilityRole="button"
          disabled={disabled}
          onPress={openPageInput}
          style={({ pressed }) => [
            styles.pageButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.pageText}>
            {pageIndex + 1} / {pageCount}
          </Text>
        </Pressable>

        <Pressable
          accessibilityLabel="下一页"
          accessibilityRole="button"
          disabled={disabled || pageIndex >= pageCount - 1}
          onPress={() => onPageChange(Math.min(pageCount - 1, pageIndex + 1))}
          style={({ pressed }) => [
            styles.arrowButton,
            (disabled || pageIndex >= pageCount - 1) && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <ChevronRight color={colors.primary} size={28} strokeWidth={2.2} />
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
        transparent
        visible={modalVisible}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>跳转到页码</Text>
            <Text style={styles.dialogHint}>当前共 {pageCount} 页</Text>
            <TextInput
              autoFocus
              keyboardType="number-pad"
              maxLength={4}
              onChangeText={(value) => {
                setPageInput(value);
                setError('');
              }}
              selectTextOnFocus
              style={styles.input}
              value={pageInput}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.dialogActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setModalVisible(false)}
                style={({ pressed }) => [
                  styles.dialogButton,
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.cancelText}>取消</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={submitPage}
                style={({ pressed }) => [
                  styles.dialogButton,
                  styles.confirmButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.confirmText}>跳转</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  arrowButton: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: 26,
    borderWidth: 1.2,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  cancelButton: {
    backgroundColor: colors.graySoft,
  },
  cancelText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    maxWidth: 400,
    padding: 24,
    width: '84%',
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  dialogButton: {
    alignItems: 'center',
    borderRadius: 22,
    flex: 1,
    height: 50,
    justifyContent: 'center',
  },
  dialogHint: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 8,
  },
  dialogTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.35,
  },
  error: {
    color: colors.red,
    fontSize: 14,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.graySoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    height: 58,
    marginTop: 18,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  pageButton: {
    alignItems: 'center',
    borderRadius: 18,
    minWidth: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pageText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.65,
  },
});
