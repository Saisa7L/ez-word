import { StyleSheet, Text } from 'react-native';

import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/features/theme/ThemeProvider';

import { Button } from './Button';
import { Dialog } from './Dialog';

type TaskErrorModalProps = {
  errorCount: number;
  onConfirm: () => void;
  onDismiss: () => void;
  visible: boolean;
};

export function TaskErrorModal({
  errorCount,
  onConfirm,
  onDismiss,
  visible,
}: TaskErrorModalProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Dialog
      contentStyle={styles.dialog}
      onRequestClose={onDismiss}
      visible={visible}
    >
      <Text style={styles.title}>填写有误</Text>
      <Text style={styles.message}>
        有 {errorCount} 处填写错误，请修改后再继续。
      </Text>
      <Button
        accessibilityLabel="确认填写错误"
        onPress={onConfirm}
        style={styles.button}
      >
        确认
      </Button>
    </Dialog>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      alignItems: 'center',
      alignSelf: 'stretch',
      backgroundColor: colors.primary,
      borderRadius: 28,
      justifyContent: 'center',
      marginTop: 30,
      minHeight: 58,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    dialog: {
      padding: 28,
      width: '82%',
    },
    message: {
      color: colors.textSecondary,
      fontSize: 18,
      lineHeight: 28,
      marginTop: 16,
      textAlign: 'center',
    },
    title: {
      color: colors.text,
      fontSize: 25,
      fontWeight: '700',
      textAlign: 'center',
    },
  });
