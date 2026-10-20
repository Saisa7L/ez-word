import { Check, Moon, Palette, Sun } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ColorPalette } from '@/components/ColorPalette';
import { GreenSheetScreen } from '@/components/GreenSheetScreen';
import { useAppFeedback } from '@/components/AppFeedbackProvider';
import {
  createThemeColors,
  type ThemeColors,
  type ThemeMode,
} from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/features/theme/ThemeProvider';
import { useSettingsBackNavigation } from '@/hooks/useSettingsBackNavigation';

const THEME_OPTIONS: {
  description: string;
  icon: typeof Sun;
  label: string;
  mode: ThemeMode;
}[] = [
  {
    description: '白色卡片与灰色背景',
    icon: Sun,
    label: '日间',
    mode: 'day',
  },
  {
    description: '黑色卡片与深灰背景',
    icon: Moon,
    label: '夜间',
    mode: 'night',
  },
  {
    description: '选择卡片和卷轴的主题色',
    icon: Palette,
    label: '自定义',
    mode: 'custom',
  },
];

export default function ThemeSettingsScreen() {
  const { colors, mode, primaryColor, saveTheme } = useAppTheme();
  const { showNotice } = useAppFeedback();
  const handleBack = useSettingsBackNavigation();
  const [draftMode, setDraftMode] = useState(mode);
  const [draftPrimary, setDraftPrimary] = useState(primaryColor);
  const [isSaving, setIsSaving] = useState(false);
  const [paletteTouching, setPaletteTouching] = useState(false);
  const styles = useThemedStyles(createStyles);
  const previewColors = createThemeColors(draftMode, draftPrimary);

  async function handleSave() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await saveTheme(draftMode, draftPrimary);
      showNotice('主题已更新', '新的外观已经应用到整个 App');
    } catch {
      showNotice('保存失败', '无法保存主题设置，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <GreenSheetScreen
      onBack={handleBack}
      scrollEnabled={!paletteTouching}
      title="主题外观"
    >
      <View style={styles.content}>
        <Text style={styles.title}>选择主题模式</Text>
        <View style={styles.modeList}>
          {THEME_OPTIONS.map((option) => {
            const selected = draftMode === option.mode;
            const Icon = option.icon;

            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                key={option.mode}
                onPress={() => setDraftMode(option.mode)}
                style={({ pressed }) => [
                  styles.modeOption,
                  selected && styles.modeOptionSelected,
                  selected && { borderColor: previewColors.accentText },
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.modeIcon,
                    selected && { backgroundColor: previewColors.primary },
                  ]}
                >
                  <Icon
                    color={
                      selected ? previewColors.onPrimary : colors.textSecondary
                    }
                    size={24}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={styles.modeCopy}>
                  <Text style={styles.modeLabel}>{option.label}</Text>
                  <Text style={styles.modeDescription}>
                    {option.description}
                  </Text>
                </View>
                {selected ? (
                  <Check
                    color={previewColors.accentText}
                    size={24}
                    strokeWidth={3}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {draftMode === 'custom' ? (
          <View style={styles.customSection}>
            <Text style={styles.sectionTitle}>主题色</Text>
            <Text style={styles.sectionHint}>
              用于卡片、卷轴面板和其他主要表面
            </Text>
            <ColorPalette
              onChange={setDraftPrimary}
              onInteractionChange={setPaletteTouching}
              value={draftPrimary}
            />
          </View>
        ) : null}

        <View
          style={[
            styles.preview,
            {
              backgroundColor: previewColors.surface,
              borderColor: previewColors.border,
            },
          ]}
        >
          <View
            style={[
              styles.previewHeader,
              { backgroundColor: previewColors.primary },
            ]}
          >
            <Text
              style={[
                styles.previewHeaderText,
                { color: previewColors.onPrimary },
              ]}
            >
              主题预览
            </Text>
          </View>
          <Text style={[styles.previewTitle, { color: previewColors.text }]}>
            易词通 Ez Word
          </Text>
          <Text
            style={[styles.previewBody, { color: previewColors.textSecondary }]}
          >
            页面背景、卡片、文字和按钮会随主题一起变化。
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={() => {
            void handleSave();
          }}
          style={({ pressed }) => [
            styles.saveButton,
            isSaving && styles.saveButtonDisabled,
            pressed && !isSaving && styles.pressed,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.saveText}>保存并应用</Text>
          )}
        </Pressable>
      </View>
    </GreenSheetScreen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: 22,
      paddingTop: 20,
    },
    customSection: {
      marginTop: 26,
    },
    modeCopy: {
      flex: 1,
      marginLeft: 14,
    },
    modeDescription: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 3,
    },
    modeIcon: {
      alignItems: 'center',
      backgroundColor: colors.graySoft,
      borderRadius: 16,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    modeLabel: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    modeList: {
      gap: 12,
      marginTop: 16,
    },
    modeOption: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: 'row',
      minHeight: 82,
      paddingHorizontal: 16,
    },
    modeOptionSelected: {
      borderWidth: 2,
      paddingHorizontal: 15,
    },
    pressed: {
      opacity: 0.68,
    },
    preview: {
      borderRadius: 20,
      borderWidth: 1,
      marginTop: 26,
      overflow: 'hidden',
      paddingBottom: 20,
      paddingHorizontal: 18,
    },
    previewBody: {
      fontSize: 14,
      lineHeight: 22,
      marginTop: 8,
    },
    previewHeader: {
      marginHorizontal: -18,
      paddingHorizontal: 18,
      paddingVertical: 14,
    },
    previewHeaderText: {
      fontSize: 18,
      fontWeight: '700',
    },
    previewTitle: {
      fontSize: 22,
      fontWeight: '800',
      marginTop: 18,
    },
    saveButton: {
      alignItems: 'center',
      backgroundColor: colors.graySoft,
      borderRadius: 28,
      height: 58,
      justifyContent: 'center',
      marginTop: 26,
    },
    saveButtonDisabled: {
      backgroundColor: colors.disabled,
    },
    saveText: {
      color: colors.accentText,
      fontSize: 20,
      fontWeight: '700',
    },
    sectionHint: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 14,
      marginTop: 5,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
      marginTop: 4,
    },
    title: {
      color: colors.text,
      fontSize: 25,
      fontWeight: '700',
    },
  });
