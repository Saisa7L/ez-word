import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PROFILE_USERNAME_MAX_LENGTH } from '@/constants/profile';
import { radii, type ThemeColors } from '@/constants/theme';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';

import { BIO_MAX_LENGTH, type EditMode } from './profileUtils';

type ProfileEditModalProps = {
  error: string;
  mode: EditMode;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  value: string;
};

export function ProfileEditModal({
  error,
  mode,
  onChange,
  onClose,
  onSubmit,
  value,
}: ProfileEditModalProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const isBio = mode === 'bio';

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={mode !== null}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>
            {mode === 'name' ? '修改用户名' : '修改个人简介'}
          </Text>
          <TextInput
            autoFocus
            maxLength={isBio ? BIO_MAX_LENGTH : PROFILE_USERNAME_MAX_LENGTH}
            multiline={isBio}
            onChangeText={onChange}
            placeholder={isBio ? '输入个人简介' : '输入用户名'}
            placeholderTextColor={colors.textMuted}
            style={[styles.input, isBio && styles.bioInput]}
            value={value}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.cancelText}>取消</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onSubmit}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.confirmText}>确定</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    bioInput: {
      height: 120,
      paddingTop: 14,
      textAlignVertical: 'top',
    },
    button: {
      alignItems: 'center',
      borderRadius: 22,
      flex: 1,
      height: 50,
      justifyContent: 'center',
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
      color: colors.onPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    dialog: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: 24,
      width: '86%',
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
      fontSize: 19,
      height: 56,
      marginTop: 18,
      paddingHorizontal: 16,
    },
    overlay: {
      alignItems: 'center',
      backgroundColor: colors.overlay,
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    pressed: {
      opacity: 0.68,
    },
    title: {
      color: colors.text,
      fontSize: 23,
      fontWeight: '700',
    },
  });
