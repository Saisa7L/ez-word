import { Palette, Type } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppFeedback } from '@/components/AppFeedbackProvider';
import { GreenSheetScreen } from '@/components/GreenSheetScreen';
import type { ThemeColors } from '@/constants/theme';
import {
  ProfileColorModal,
  ProfileStrokeModal,
} from '@/features/profile/ProfileAppearanceModals';
import { ProfileCard } from '@/features/profile/ProfileCard';
import { ProfileCameraMenu } from '@/features/profile/ProfileCameraMenu';
import { ProfileEditModal } from '@/features/profile/ProfileEditModal';
import { ProfileOptionRow } from '@/features/profile/ProfileOptionRow';
import {
  pickProfileImage,
  saveProfileCardImage,
} from '@/features/profile/profileImageActions';
import { useProfileData } from '@/features/profile/useProfileData';
import { useAppTheme, useThemedStyles } from '@/features/theme/ThemeProvider';
import { useSettingsBackNavigation } from '@/hooks/useSettingsBackNavigation';

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { showNotice } = useAppFeedback();
  const handleBack = useSettingsBackNavigation();
  const cardRef = useRef<View>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraMenuVisible, setCameraMenuVisible] = useState(false);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [strokePickerVisible, setStrokePickerVisible] = useState(false);
  const [paletteTouching, setPaletteTouching] = useState(false);
  const {
    avatarData,
    backgroundData,
    bio,
    cardContentColor,
    closeEditor,
    displayName,
    editError,
    editMode,
    editValue,
    handleSave,
    isLoading,
    isSaving,
    openEditor,
    setAvatarData,
    setBackgroundData,
    setCardContentColor,
    setTextStrokeColor,
    setTextStrokeWidth,
    stats,
    submitEdit,
    textStrokeColor,
    textStrokeWidth,
    updateEditValue,
  } = useProfileData({ notify: showNotice });

  async function handlePickImage(target: 'avatar' | 'background') {
    const dataUri = await pickProfileImage(target, showNotice);
    if (!dataUri) {
      return;
    }
    if (target === 'avatar') {
      setAvatarData(dataUri);
    } else {
      setBackgroundData(dataUri);
    }
  }

  async function handleSaveCardImage() {
    if (isCapturing || !cardRef.current) {
      return;
    }

    setIsCapturing(true);
    try {
      await saveProfileCardImage(cardRef, showNotice);
    } finally {
      setIsCapturing(false);
    }
  }

  return (
    <>
      <GreenSheetScreen onBack={handleBack} title="个人资料">
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.accentText} size="large" />
            </View>
          ) : (
            <>
              <ProfileCard
                avatarData={avatarData}
                backgroundData={backgroundData}
                bio={bio}
                cardContentColor={cardContentColor}
                cardRef={cardRef}
                displayName={displayName}
                isCapturing={isCapturing}
                onAvatarPress={() => {
                  void handlePickImage('avatar');
                }}
                onBioPress={() => openEditor('bio')}
                onCameraPress={() => setCameraMenuVisible(true)}
                onNamePress={() => openEditor('name')}
                stats={stats}
                textStrokeColor={textStrokeColor}
                textStrokeWidth={textStrokeWidth}
              />

              <ProfileOptionRow
                accessibilityLabel="更改名片字符颜色"
                icon={
                  <Palette color={colors.text} size={25} strokeWidth={2.2} />
                }
                label="更改名片字符颜色"
                onPress={() => setColorPickerVisible(true)}
                pressedStyle={styles.pressed}
                trailing={
                  <View
                    style={[
                      styles.colorOptionSwatch,
                      { backgroundColor: cardContentColor },
                    ]}
                  />
                }
              />

              <ProfileOptionRow
                accessibilityLabel="调整文字描边颜色和大小"
                icon={<Type color={colors.text} size={25} strokeWidth={2.2} />}
                label="调整文字描边"
                onPress={() => setStrokePickerVisible(true)}
                pressedStyle={styles.pressed}
                style={styles.strokeOption}
                trailing={
                  <View style={styles.strokeValue}>
                    <View
                      style={[
                        styles.strokeColorSwatch,
                        { backgroundColor: textStrokeColor },
                      ]}
                    />
                    <Text style={styles.strokeWidthLabel}>
                      {textStrokeWidth}px
                    </Text>
                  </View>
                }
              />

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
                  <Text style={styles.saveText}>保存资料</Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      </GreenSheetScreen>

      <ProfileCameraMenu
        onClose={() => setCameraMenuVisible(false)}
        onPickBackground={() => {
          void handlePickImage('background');
        }}
        onSaveCardImage={() => {
          void handleSaveCardImage();
        }}
        visible={cameraMenuVisible}
      />

      <ProfileEditModal
        error={editError}
        mode={editMode}
        onChange={updateEditValue}
        onClose={closeEditor}
        onSubmit={submitEdit}
        value={editValue}
      />

      <ProfileColorModal
        onChange={setCardContentColor}
        onClose={() => setColorPickerVisible(false)}
        onPaletteInteractionChange={setPaletteTouching}
        paletteTouching={paletteTouching}
        title="更改名片字符颜色"
        value={cardContentColor}
        visible={colorPickerVisible}
      />

      <ProfileStrokeModal
        color={textStrokeColor}
        onClose={() => setStrokePickerVisible(false)}
        onColorChange={setTextStrokeColor}
        onPaletteInteractionChange={setPaletteTouching}
        onWidthChange={setTextStrokeWidth}
        paletteTouching={paletteTouching}
        visible={strokePickerVisible}
        width={textStrokeWidth}
      />
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    colorOptionSwatch: {
      borderColor: colors.border,
      borderRadius: 9,
      borderWidth: 1,
      height: 22,
      width: 22,
    },
    colorOptionText: {
      color: colors.text,
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    loading: {
      alignItems: 'center',
      minHeight: 500,
      paddingTop: 100,
    },
    pressed: {
      opacity: 0.68,
    },
    saveButton: {
      alignItems: 'center',
      backgroundColor: colors.graySoft,
      borderRadius: 28,
      height: 58,
      justifyContent: 'center',
      marginTop: 20,
    },
    saveButtonDisabled: {
      backgroundColor: colors.disabled,
    },
    saveText: {
      color: colors.accentText,
      fontSize: 21,
      fontWeight: '700',
    },
    strokeColorSwatch: {
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      height: 20,
      width: 20,
    },
    strokeOption: {
      marginTop: 12,
    },
    strokeValue: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    strokeWidthLabel: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: '600',
    },
  });
