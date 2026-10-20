import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
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
import { findWordByWord, upsertSingleWord } from '@/database/wordsRepository';
import { useAppTheme, useThemedStyles } from '@/features/theme/ThemeProvider';
import { useSettingsBackNavigation } from '@/hooks/useSettingsBackNavigation';

export default function AddLibraryWordScreen() {
  const db = useSQLiteContext();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { showNotice } = useAppFeedback();
  const handleBack = useSettingsBackNavigation();
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleAdd() {
    const cleanWord = word.trim();
    const cleanMeaning = meaning.trim();
    const cleanPhonetic = phonetic.trim();

    if (!cleanWord || !cleanMeaning || !cleanPhonetic) {
      showNotice('信息不完整', '单词、释义和音标都必须填写');
      return;
    }

    if (isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const existing = await findWordByWord(db, cleanWord);
      if (existing?.is_active === 1) {
        showNotice('单词已存在', `“${cleanWord}”已经在当前词库中`);
        return;
      }

      await upsertSingleWord(db, {
        meaning: cleanMeaning,
        phonetic: cleanPhonetic,
        word: cleanWord,
      });
      handleBack();
    } catch {
      showNotice('添加失败', '无法添加单词，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <GreenSheetScreen onBack={handleBack} title="添加单词">
      <View style={styles.content}>
        <Text style={styles.hint}>
          历史词库中不存在该单词时，将以“未学习”状态加入；历史已存在时恢复原状态。
        </Text>

        <Text style={styles.fieldLabel}>单词</Text>
        <TextInput
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
          onChangeText={setMeaning}
          placeholder="例如 放弃；抛弃"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={meaning}
        />

        <Text style={styles.fieldLabel}>音标</Text>
        <TextInput
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
            void handleAdd();
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
