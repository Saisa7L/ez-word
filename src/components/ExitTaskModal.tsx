import { StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/features/theme/ThemeProvider';

import { Button } from './Button';
import { Dialog } from './Dialog';

type ExitTaskModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
  taskLabel?: string;
  visible: boolean;
};

export function ExitTaskModal({
  onCancel,
  onConfirm,
  taskLabel = '每日任务',
  visible,
}: ExitTaskModalProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Dialog
      contentStyle={styles.dialog}
      onRequestClose={onCancel}
      visible={visible}
    >
      <Text style={styles.title}>退出{taskLabel}？</Text>
      <View style={styles.actions}>
        <Button
          accessibilityLabel={`确认退出${taskLabel}`}
          onPress={onConfirm}
          style={styles.button}
          textStyle={styles.buttonText}
          variant="success"
        >
          是
        </Button>
        <Button
          accessibilityLabel={`取消退出${taskLabel}`}
          onPress={onCancel}
          style={styles.button}
          textStyle={styles.buttonText}
          variant="danger"
        >
          否
        </Button>
      </View>
    </Dialog>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    actions: {
      flexDirection: 'row',
      gap: 20,
      marginTop: 34,
      width: '100%',
    },
    button: {
      flex: 1,
      minWidth: 0,
    },
    buttonText: {
      fontSize: 22,
    },
    dialog: {
      alignItems: 'center',
      paddingHorizontal: 34,
      paddingVertical: 40,
      width: '82%',
    },
    title: {
      color: colors.text,
      fontSize: 25,
      fontWeight: '700',
    },
  });
