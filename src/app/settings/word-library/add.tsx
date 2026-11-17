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
import { radii, type ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/features/theme/ThemeProvider';
import { useWordAdd } from '@/features/word-library/useWordAdd';
import { useSettingsBackNavigation } from '@/hooks/useSettingsBackNavigation';

export default function AddLibraryWordScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { showNotice } = useAppFeedback();
  const handleBack = useSettingsBackNavigation();
  const {
    addWord,
    isSaving,
    meaning,
    phonetic,
    setMeaning,
    setPhonetic,
    setWord,
    word,
  } = useWordAdd({ notify: showNotice, onAdded: handleBack });

  return (
    <GreenSheetScreen onBack={handleBack} title="添加单词">
      <View style={styles.content}>
        <Text style={styles.hint}>
          历史词库中不存在该单词时，将以“未学习”状态加入；历史已存在时恢复原状态。
        </Text>

        <Text style={styles.fieldLabel}>单词</Text>
        <TextInput
          accessibilityLabel="单词"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setWord}
          placeholder="例如 abandon"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={word}
        />

        <Text style={styles.fieldLabel}>释义</Text>
        <TextInput
          accessibilityLabel="释义"
          onChangeText={setMeaning}
          placeholder="例如 放弃；抛弃"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={meaning}
        />

        <Text style={styles.fieldLabel}>音标</Text>
        <TextInput
          accessibilityLabel="音标"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setPhonetic}
          placeholder="例如 /əˈbændən/"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={phonetic}
        />

        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={() => {
            void addWord();
          }}
          style={({ pressed }) => [
            styles.addButton,
            isSaving && styles.addButtonDisabled,
            pressed && !isSaving && styles.pressed,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.addText}>加入当前词库</Text>
          )}
        </Pressable>
      </View>
    </GreenSheetScreen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    addButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 28,
      height: 58,
      justifyContent: 'center',
      marginTop: 30,
    },
    addButtonDisabled: {
      backgroundColor: colors.disabled,
    },
    addText: {
      color: colors.onPrimary,
      fontSize: 21,
      fontWeight: '700',
    },
    content: {
      paddingHorizontal: 22,
      paddingTop: 22,
    },
    fieldLabel: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '600',
      marginBottom: 8,
      marginTop: 18,
    },
    hint: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 23,
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
    pressed: {
      opacity: 0.68,
    },
  });
