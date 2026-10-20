import { KeyRound, Trash2 } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { radii, type ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/features/theme/ThemeProvider';

type AiKeySectionProps = {
  apiKeyInput: string;
  isSavingKey: boolean;
  isTesting: boolean;
  onChangeInput: (value: string) => void;
  onClearRequest: () => void;
  onSave: () => void;
  onTest: () => void;
  storedKey: string | null;
};

export function AiKeySection({
  apiKeyInput,
  isSavingKey,
  isTesting,
  onChangeInput,
  onClearRequest,
  onSave,
  onTest,
  storedKey,
}: AiKeySectionProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const maskedKey = storedKey
    ? `已保存：••••${storedKey.slice(-4)}`
    : '尚未保存 API Key';

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <KeyRound color={colors.accentText} size={25} strokeWidth={2.2} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>DeepSeek API Key</Text>
          <Text style={styles.keyStatus}>{maskedKey}</Text>
        </View>
      </View>

      <TextInput
        accessibilityHint="输入后可以保存新的 DeepSeek API Key"
        accessibilityLabel="DeepSeek API Key"
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeInput}
        placeholder="输入新的 API Key"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        style={styles.input}
        value={apiKeyInput}
      />

      <View style={styles.keyActions}>
        <Pressable
          accessibilityRole="button"
          disabled={isSavingKey}
          onPress={onSave}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          {isSavingKey ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.primaryButtonText}>保存 Key</Text>
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={isTesting}
          onPress={onTest}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          {isTesting ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.secondaryButtonText}>测试连接</Text>
          )}
        </Pressable>
      </View>

      {storedKey ? (
        <Pressable
          accessibilityRole="button"
          onPress={onClearRequest}
          style={({ pressed }) => [
            styles.clearButton,
            pressed && styles.pressed,
          ]}
        >
          <Trash2 color={colors.red} size={21} strokeWidth={2.2} />
          <Text style={styles.clearText}>清除 API Key</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    clearButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      flexDirection: 'row',
      gap: 8,
      marginTop: 16,
      paddingVertical: 6,
    },
    clearText: {
      color: colors.red,
      fontSize: 16,
      fontWeight: '600',
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    headerCopy: {
      flex: 1,
      marginLeft: 12,
    },
    icon: {
      alignItems: 'center',
      backgroundColor: colors.graySoft,
      borderRadius: 16,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    input: {
      backgroundColor: colors.graySoft,
      borderColor: colors.border,
      borderRadius: radii.md,
      borderWidth: 1,
      color: colors.text,
      fontSize: 17,
      height: 54,
      marginTop: 20,
      paddingHorizontal: 16,
    },
    keyActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 14,
    },
    keyStatus: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 4,
    },
    pressed: {
      opacity: 0.66,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.graySoft,
      borderRadius: 22,
      flex: 1,
      height: 48,
      justifyContent: 'center',
    },
    primaryButtonText: {
      color: colors.accentText,
      fontSize: 17,
      fontWeight: '700',
    },
    secondaryButton: {
      alignItems: 'center',
      borderColor: colors.accentText,
      borderRadius: 22,
      borderWidth: 1.5,
      flex: 1,
      height: 48,
      justifyContent: 'center',
    },
    secondaryButtonText: {
      color: colors.accentText,
      fontSize: 17,
      fontWeight: '700',
    },
    section: {
      width: '100%',
    },
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '700',
    },
  });
