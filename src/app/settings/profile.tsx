import { File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Palette, Type } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { captureRef, releaseCapture } from 'react-native-view-shot';

import { ActionOptionModal } from '@/components/ActionOptionModal';
import { useAppFeedback } from '@/components/AppFeedbackProvider';
import { GreenSheetScreen } from '@/components/GreenSheetScreen';
import {
  DEFAULT_PROFILE_CARD_CONTENT_COLOR,
  DEFAULT_PROFILE_TEXT_STROKE_COLOR,
  DEFAULT_PROFILE_TEXT_STROKE_WIDTH,
} from '@/constants/profile';
import type { ThemeColors } from '@/constants/theme';
import { getHomeStats, type HomeStats } from '@/database/statsRepository';
import {
  getUserProfile,
  updateUserProfile,
} from '@/database/userProfileRepository';
import {
  ProfileColorModal,
  ProfileStrokeModal,
} from '@/features/profile/ProfileAppearanceModals';
import { ProfileCard } from '@/features/profile/ProfileCard';
import { ProfileEditModal } from '@/features/profile/ProfileEditModal';
import {
  AVATAR_MAX_BYTES,
  BACKGROUND_MAX_BYTES,
  buildCardFileName,
  estimateBase64Bytes,
  type EditMode,
  type ImageTarget,
} from '@/features/profile/profileUtils';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';

export default function ProfileScreen() {
  const db = useSQLiteContext();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { showNotice } = useAppFeedback();
  const cardRef = useRef<View>(null);
  const [displayName, setDisplayName] = useState('User');
  const [bio, setBio] = useState('');
  const [avatarData, setAvatarData] = useState('');
  const [backgroundData, setBackgroundData] = useState('');
  const [cardContentColor, setCardContentColor] = useState(
    DEFAULT_PROFILE_CARD_CONTENT_COLOR,
  );
  const [textStrokeColor, setTextStrokeColor] = useState(
    DEFAULT_PROFILE_TEXT_STROKE_COLOR,
  );
  const [textStrokeWidth, setTextStrokeWidth] = useState(
    DEFAULT_PROFILE_TEXT_STROKE_WIDTH,
  );
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraMenuVisible, setCameraMenuVisible] = useState(false);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [strokePickerVisible, setStrokePickerVisible] = useState(false);
  const [paletteTouching, setPaletteTouching] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    let active = true;

    Promise.all([getUserProfile(db), getHomeStats(db)])
      .then(([profile, nextStats]) => {
        if (active) {
          setDisplayName(profile.displayName);
          setBio(profile.bio);
          setAvatarData(profile.avatarData);
          setBackgroundData(profile.backgroundData);
          setCardContentColor(profile.cardContentColor);
          setTextStrokeColor(profile.textStrokeColor);
          setTextStrokeWidth(profile.textStrokeWidth);
          setStats(nextStats);
        }
      })
      .catch(() => {
        if (active) {
          showNotice('读取失败', '无法读取个人资料，请稍后重试');
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [db, showNotice]);

  async function pickAndCropImage(target: ImageTarget): Promise<void> {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showNotice('无法选择图片', '请允许 App 访问相册');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: target === 'avatar' ? [1, 1] : [2, 3],
      base64: true,
      mediaTypes: ['images'],
      quality: target === 'avatar' ? 0.8 : 0.75,
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    if (!asset.base64) {
      showNotice('读取失败', '无法读取所选图片，请重新选择');
      return;
    }

    const byteSize = estimateBase64Bytes(asset.base64);
    const maxBytes =
      target === 'avatar' ? AVATAR_MAX_BYTES : BACKGROUND_MAX_BYTES;
    if (byteSize > maxBytes) {
      showNotice(
        '图片过大',
        `请选择小于 ${target === 'avatar' ? '3MB' : '6MB'} 的图片`,
      );
      return;
    }

    const dataUri = `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`;
    if (target === 'avatar') {
      setAvatarData(dataUri);
    } else {
      setBackgroundData(dataUri);
    }
  }

  function openEditor(mode: Exclude<EditMode, null>) {
    setEditMode(mode);
    setEditValue(mode === 'name' ? displayName : bio);
    setEditError('');
  }

  function submitEdit() {
    const nextValue = editValue.trim();
    if (editMode === 'name' && !nextValue) {
      setEditError('用户名不能为空');
      return;
    }

    if (editMode === 'name') {
      setDisplayName(nextValue);
    } else {
      setBio(nextValue);
    }
    setEditMode(null);
  }

  async function handleSave() {
    if (!displayName.trim()) {
      showNotice('无法保存', '用户名不能为空');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile(db, {
        avatarData,
        backgroundData,
        bio,
        cardContentColor,
        displayName,
        textStrokeColor,
        textStrokeWidth,
      });
      showNotice('保存成功', '个人资料已经更新');
    } catch {
      showNotice('保存失败', '无法保存个人资料，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveCardImage() {
    if (isCapturing || !cardRef.current) {
      return;
    }

    setIsCapturing(true);
    let tempUri: string | null = null;
    try {
      const permission =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permission.granted) {
        showNotice('已取消保存', '没有选择图片保存目录');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      tempUri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const base64 = await new File(tempUri).base64();
      const fileUri =
        await FileSystem.StorageAccessFramework.createFileAsync(
          permission.directoryUri,
          buildCardFileName(),
          'image/png',
        );
      await FileSystem.StorageAccessFramework.writeAsStringAsync(
        fileUri,
        base64,
        { encoding: FileSystem.EncodingType.Base64 },
      );
      showNotice('保存成功', '个人名片已保存到所选目录');
    } catch {
      showNotice('保存失败', '无法生成名片图片，请稍后重试');
    } finally {
      if (tempUri) {
        releaseCapture(tempUri);
      }
      setIsCapturing(false);
    }
  }

  return (
    <>
      <GreenSheetScreen
        onBack={() => router.back()}
        title="个人资料"
      >
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
                  void pickAndCropImage('avatar');
                }}
                onBioPress={() => openEditor('bio')}
                onCameraPress={() => setCameraMenuVisible(true)}
                onNamePress={() => openEditor('name')}
                stats={stats}
                textStrokeColor={textStrokeColor}
                textStrokeWidth={textStrokeWidth}
              />

              <Pressable
                accessibilityLabel="更改名片字符颜色"
                accessibilityRole="button"
                onPress={() => setColorPickerVisible(true)}
                style={({ pressed }) => [
                  styles.colorOption,
                  pressed && styles.pressed,
                ]}
              >
                <Palette color={colors.text} size={25} strokeWidth={2.2} />
                <Text style={styles.colorOptionText}>更改名片字符颜色</Text>
                <View
                  style={[
                    styles.colorOptionSwatch,
                    { backgroundColor: cardContentColor },
                  ]}
                />
              </Pressable>

              <Pressable
                accessibilityLabel="调整文字描边颜色和大小"
                accessibilityRole="button"
                onPress={() => setStrokePickerVisible(true)}
                style={({ pressed }) => [
                  styles.colorOption,
                  styles.strokeOption,
                  pressed && styles.pressed,
                ]}
              >
                <Type color={colors.text} size={25} strokeWidth={2.2} />
                <Text style={styles.colorOptionText}>调整文字描边</Text>
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
              </Pressable>

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

      <ActionOptionModal
        onClose={() => setCameraMenuVisible(false)}
        options={[
          {
            label: '更换名片背景',
            onPress: () => {
              void pickAndCropImage('background');
            },
            tone: 'primary',
          },
          {
            label: '保存名片图片',
            onPress: () => {
              void handleSaveCardImage();
            },
          },
          {
            label: '取消',
            onPress: () => {},
          },
        ]}
        title="名片图片"
        visible={cameraMenuVisible}
      />

      <ProfileEditModal
        error={editError}
        mode={editMode}
        onChange={(value) => {
          setEditValue(value);
          setEditError('');
        }}
        onClose={() => setEditMode(null)}
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
    colorOption: {
      alignItems: 'center',
      backgroundColor: colors.graySoft,
      borderRadius: 22,
      flexDirection: 'row',
      gap: 12,
      height: 56,
      marginTop: 20,
      paddingHorizontal: 18,
    },
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
