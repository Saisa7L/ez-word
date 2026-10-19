import { router } from 'expo-router';
import { File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useSQLiteContext } from 'expo-sqlite';
import { Palette, Type } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { captureRef, releaseCapture } from 'react-native-view-shot';

import { ActionOptionModal } from '@/components/ActionOptionModal';
import { ColorPalette } from '@/components/ColorPalette';
import { GreenSheetScreen } from '@/components/GreenSheetScreen';
import { OutlinedText } from '@/components/OutlinedText';
import { useAppFeedback } from '@/components/AppFeedbackProvider';
import {
  BookStatIcon,
  CalendarStatIcon,
} from '@/components/icons/ProfileStatIcons';
import {
  DEFAULT_PROFILE_CARD_CONTENT_COLOR,
  DEFAULT_PROFILE_TEXT_STROKE_COLOR,
  DEFAULT_PROFILE_TEXT_STROKE_WIDTH,
  PROFILE_USERNAME_MAX_LENGTH,
  PROFILE_TEXT_STROKE_MAX_WIDTH,
} from '@/constants/profile';
import {
  radii,
  spacing,
  type ThemeColors,
} from '@/constants/theme';
import { uiAssets } from '@/constants/uiAssets';
import { getHomeStats, type HomeStats } from '@/database/statsRepository';
import {
  getUserProfile,
  updateUserProfile,
} from '@/database/userProfileRepository';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';

const BIO_MAX_LENGTH = 120;
const AVATAR_MAX_BYTES = 3 * 1024 * 1024;
const BACKGROUND_MAX_BYTES = 6 * 1024 * 1024;
const NAME_CHARS_PER_LINE = 5;

const TEXT_STROKE_WIDTHS = Array.from(
  { length: PROFILE_TEXT_STROKE_MAX_WIDTH + 1 },
  (_, index) => index,
);

type EditMode = 'bio' | 'name' | null;
type ImageTarget = 'avatar' | 'background';

function estimateBase64Bytes(base64: string): number {
  return Math.floor((base64.length * 3) / 4);
}

function buildCardFileName(): string {
  const now = new Date();
  return `vocab-profile-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
}

function splitDisplayName(displayName: string): string[] {
  const characters = Array.from(displayName || 'User');
  const lines: string[] = [];

  for (let index = 0; index < characters.length; index += NAME_CHARS_PER_LINE) {
    lines.push(
      characters.slice(index, index + NAME_CHARS_PER_LINE).join(''),
    );
  }

  return lines;
}

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

  async function pickAndCropImage(
    target: ImageTarget,
  ): Promise<void> {
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

  const avatarSource = avatarData
    ? { uri: avatarData }
    : uiAssets.avatars.user;
  const displayNameLines = splitDisplayName(displayName);

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
              <View collapsable={false} ref={cardRef} style={styles.card}>
                {backgroundData ? (
                  <Image
                    resizeMode="cover"
                    source={{ uri: backgroundData }}
                    style={styles.backgroundImage}
                  />
                ) : null}
                {!isCapturing ? (
                  <Pressable
                    accessibilityLabel="名片图片操作"
                    accessibilityRole="button"
                    onPress={() => setCameraMenuVisible(true)}
                    style={({ pressed }) => [
                      styles.cameraButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Image
                      source={uiAssets.settings.camera}
                      style={[
                        styles.cameraIcon,
                        { tintColor: cardContentColor },
                      ]}
                    />
                  </Pressable>
                ) : null}

                <View style={styles.profileHeader}>
                  <Pressable
                    accessibilityLabel="更换头像"
                    accessibilityRole="button"
                    onPress={() => {
                      void pickAndCropImage('avatar');
                    }}
                    style={({ pressed }) => [
                      styles.avatarCircle,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Image source={avatarSource} style={styles.avatar} />
                  </Pressable>

                  <Pressable
                    accessibilityLabel="修改用户名"
                    accessibilityRole="button"
                    onPress={() => openEditor('name')}
                    style={({ pressed }) => [
                      styles.nameBlock,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.nameLines}>
                      {displayNameLines.map((line, index) => (
                        <OutlinedText
                          fillColor={cardContentColor}
                          key={`${line}-${index}`}
                          outlineColor={textStrokeColor}
                          outlineWidth={textStrokeWidth}
                          style={styles.name}
                        >
                          {line}
                        </OutlinedText>
                      ))}
                    </View>
                    <View
                      style={[
                        styles.nameUnderline,
                        { backgroundColor: cardContentColor },
                      ]}
                    />
                    <OutlinedText
                      containerStyle={styles.nameCounterContainer}
                      fillColor={cardContentColor}
                      outlineColor={textStrokeColor}
                      outlineWidth={textStrokeWidth}
                      style={styles.nameCounter}
                    >
                      {displayName.length}/{PROFILE_USERNAME_MAX_LENGTH}
                    </OutlinedText>
                  </Pressable>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <CalendarStatIcon
                      color={cardContentColor}
                      size={44}
                    />
                    <OutlinedText
                      containerStyle={styles.statLabelContainer}
                      fillColor={cardContentColor}
                      outlineColor={textStrokeColor}
                      outlineWidth={textStrokeWidth}
                      style={styles.statLabel}
                    >
                      已学习天数
                    </OutlinedText>
                    <OutlinedText
                      containerStyle={styles.statValueContainer}
                      fillColor={cardContentColor}
                      outlineColor={textStrokeColor}
                      outlineWidth={textStrokeWidth}
                      style={styles.statValue}
                    >
                      {stats?.studyDays ?? 0}
                    </OutlinedText>
                  </View>
                  <View
                    style={[
                      styles.statDivider,
                      { backgroundColor: cardContentColor },
                    ]}
                  />
                  <View style={styles.statItem}>
                    <BookStatIcon color={cardContentColor} size={48} />
                    <OutlinedText
                      containerStyle={styles.statLabelContainer}
                      fillColor={cardContentColor}
                      outlineColor={textStrokeColor}
                      outlineWidth={textStrokeWidth}
                      style={styles.statLabel}
                    >
                      已学习单词总数
                    </OutlinedText>
                    <OutlinedText
                      containerStyle={styles.statValueContainer}
                      fillColor={cardContentColor}
                      outlineColor={textStrokeColor}
                      outlineWidth={textStrokeWidth}
                      style={styles.statValue}
                    >
                      {stats?.totalLearned ?? 0}
                    </OutlinedText>
                  </View>
                </View>

                <Pressable
                  accessibilityLabel="修改个人简介"
                  accessibilityRole="button"
                  onPress={() => openEditor('bio')}
                  style={({ pressed }) => [
                    styles.bioBlock,
                    pressed && styles.pressed,
                  ]}
                >
                  <OutlinedText
                    fillColor={cardContentColor}
                    outlineColor={textStrokeColor}
                    outlineWidth={textStrokeWidth}
                    style={styles.bioTitle}
                  >
                    个人简介
                  </OutlinedText>
                  <OutlinedText
                    containerStyle={styles.bioTextContainer}
                    fillColor={cardContentColor}
                    outlineColor={textStrokeColor}
                    outlineWidth={textStrokeWidth}
                    style={styles.bioText}
                  >
                    {bio || '暂无个人简介'}
                  </OutlinedText>
                </Pressable>
              </View>

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

      <Modal
        animationType="fade"
        onRequestClose={() => setEditMode(null)}
        transparent
        visible={editMode !== null}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editDialog}>
            <Text style={styles.editTitle}>
              {editMode === 'name' ? '修改用户名' : '修改个人简介'}
            </Text>
            <TextInput
              autoFocus
              maxLength={
                editMode === 'name'
                  ? PROFILE_USERNAME_MAX_LENGTH
                  : BIO_MAX_LENGTH
              }
              multiline={editMode === 'bio'}
              onChangeText={(value) => {
                setEditValue(value);
                setEditError('');
              }}
              placeholder={
                editMode === 'name' ? '输入用户名' : '输入个人简介'
              }
              placeholderTextColor={colors.textMuted}
              style={[
                styles.editInput,
                editMode === 'bio' && styles.bioInput,
              ]}
              value={editValue}
            />
            {editError ? (
              <Text style={styles.editError}>{editError}</Text>
            ) : null}
            <View style={styles.editActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setEditMode(null)}
                style={({ pressed }) => [
                  styles.editButton,
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.cancelText}>取消</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={submitEdit}
                style={({ pressed }) => [
                  styles.editButton,
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

      <Modal
        animationType="fade"
        onRequestClose={() => setColorPickerVisible(false)}
        transparent
        visible={colorPickerVisible}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.colorDialog}>
            <ScrollView
              contentContainerStyle={styles.colorDialogContent}
              scrollEnabled={!paletteTouching}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.editTitle}>更改名片字符颜色</Text>
              <Text style={styles.strokeSectionLabel}>字体颜色</Text>
              {colorPickerVisible ? (
                <ColorPalette
                  onChange={setCardContentColor}
                  onInteractionChange={setPaletteTouching}
                  value={cardContentColor}
                />
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => setColorPickerVisible(false)}
                style={({ pressed }) => [
                  styles.strokeDoneButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.confirmText}>完成</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setStrokePickerVisible(false)}
        transparent
        visible={strokePickerVisible}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.colorDialog}>
            <ScrollView
              contentContainerStyle={styles.colorDialogContent}
              scrollEnabled={!paletteTouching}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.editTitle}>文字描边设置</Text>

              <Text style={styles.strokeSectionLabel}>描边颜色</Text>
              {strokePickerVisible ? (
                <ColorPalette
                  onChange={setTextStrokeColor}
                  onInteractionChange={setPaletteTouching}
                  value={textStrokeColor}
                />
              ) : null}

              <Text style={styles.strokeSectionLabel}>描边大小</Text>
              <View style={styles.strokeWidthOptions}>
                {TEXT_STROKE_WIDTHS.map((width) => {
                  const selected = textStrokeWidth === width;

                  return (
                    <Pressable
                      accessibilityLabel={`将描边大小设为 ${width}px`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={width}
                      onPress={() => setTextStrokeWidth(width)}
                      style={({ pressed }) => [
                        styles.strokeWidthButton,
                        selected && styles.strokeWidthButtonSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.strokeWidthOptionText,
                          selected && styles.strokeWidthOptionTextSelected,
                        ]}
                      >
                        {width}px
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => setStrokePickerVisible(false)}
                style={({ pressed }) => [
                  styles.strokeDoneButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.confirmText}>完成</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  avatar: {
    height: '100%',
    width: '100%',
  },
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: '#000000',
    borderRadius: 49,
    borderWidth: 1,
    height: 98,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 98,
  },
  backgroundImage: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  bioBlock: {
    marginTop: 30,
  },
  bioInput: {
    height: 120,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  bioText: {
    fontSize: 17,
    lineHeight: 26,
  },
  bioTextContainer: {
    alignSelf: 'stretch',
    marginTop: 9,
  },
  bioTitle: {
    fontSize: 19,
    fontWeight: '700',
  },
  cameraButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 14,
    top: 14,
    width: 50,
    zIndex: 2,
  },
  cameraIcon: {
    height: 32,
    width: 32,
  },
  cancelButton: {
    backgroundColor: colors.graySoft,
  },
  cancelText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 24,
    minHeight: 520,
    overflow: 'hidden',
    paddingBottom: 26,
    paddingHorizontal: 22,
    paddingTop: 26,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  colorDialog: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    maxHeight: '86%',
    overflow: 'hidden',
    width: '86%',
  },
  colorDialogContent: {
    padding: 24,
  },
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
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  editButton: {
    alignItems: 'center',
    borderRadius: 22,
    flex: 1,
    height: 50,
    justifyContent: 'center',
  },
  editDialog: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 24,
    width: '86%',
  },
  editError: {
    color: colors.red,
    fontSize: 14,
    marginTop: 8,
  },
  editInput: {
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
  editTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '700',
  },
  loading: {
    alignItems: 'center',
    minHeight: 500,
    paddingTop: 100,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 27,
  },
  nameBlock: {
    flex: 1,
    marginLeft: 18,
  },
  nameLines: {
    alignItems: 'flex-start',
    gap: 2,
  },
  nameCounter: {
    fontSize: 12,
    textAlign: 'right',
  },
  nameCounterContainer: {
    alignItems: 'flex-end',
    marginTop: 5,
  },
  nameUnderline: {
    height: 1,
    marginTop: 9,
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.68,
  },
  profileHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 34,
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
  statDivider: {
    height: 80,
    opacity: 0.3,
    width: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
  },
  statLabelContainer: {
    alignItems: 'center',
    marginTop: 7,
  },
  statValue: {
    fontSize: 34,
    fontWeight: '800',
  },
  statValueContainer: {
    alignItems: 'center',
    marginTop: 7,
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 34,
  },
  strokeColorSwatch: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 20,
    width: 20,
  },
  strokeDoneButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    height: 50,
    justifyContent: 'center',
    marginTop: 24,
  },
  strokeOption: {
    marginTop: 12,
  },
  strokeSectionLabel: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 22,
  },
  strokeValue: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  strokeWidthButton: {
    alignItems: 'center',
    backgroundColor: colors.graySoft,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 46,
  },
  strokeWidthButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.accentText,
  },
  strokeWidthLabel: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  strokeWidthOptionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  strokeWidthOptionTextSelected: {
    color: colors.onPrimary,
  },
  strokeWidthOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
    marginTop: 14,
  },
});
