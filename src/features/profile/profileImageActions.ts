import { File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef, releaseCapture } from 'react-native-view-shot';

import {
  AVATAR_MAX_BYTES,
  BACKGROUND_MAX_BYTES,
  buildCardFileName,
  estimateBase64Bytes,
  type ImageTarget,
} from '@/features/profile/profileUtils';

type Notify = (title: string, message?: string) => void;

const AVATAR_QUALITY = 0.8;
const BACKGROUND_QUALITY = 0.75;
const AVATAR_ASPECT: [number, number] = [1, 1];
const BACKGROUND_ASPECT: [number, number] = [2, 3];
const CAPTURE_SETTLE_MS = 100;

/**
 * 从相册挑选头像或名片背景，返回 data URI；取消或校验失败返回 null。
 * 体积上限：头像 3MB / 背景 6MB。
 */
export async function pickProfileImage(
  target: ImageTarget,
  notify: Notify,
): Promise<string | null> {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notify('无法选择图片', '请允许 App 访问相册');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: target === 'avatar' ? AVATAR_ASPECT : BACKGROUND_ASPECT,
      base64: true,
      mediaTypes: ['images'],
      quality: target === 'avatar' ? AVATAR_QUALITY : BACKGROUND_QUALITY,
    });
    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];
    if (!asset.base64) {
      notify('读取失败', '无法读取所选图片，请重新选择');
      return null;
    }

    const byteSize = estimateBase64Bytes(asset.base64);
    const maxBytes =
      target === 'avatar' ? AVATAR_MAX_BYTES : BACKGROUND_MAX_BYTES;
    if (byteSize > maxBytes) {
      notify(
        '图片过大',
        `请选择小于 ${target === 'avatar' ? '3MB' : '6MB'} 的图片`,
      );
      return null;
    }

    return `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`;
  } catch {
    notify('无法选择图片', '相册打开失败，请稍后重试');
    return null;
  }
}

/**
 * 把名片卡片截图为 PNG 并写入用户选择的目录。
 * 调用方负责 isCapturing 互斥与 cardRef 就绪判断。
 */
export async function saveProfileCardImage(
  cardRef: RefObject<View | null>,
  notify: Notify,
): Promise<void> {
  let tempUri: string | null = null;
  try {
    const permission =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permission.granted) {
      notify('已取消保存', '没有选择图片保存目录');
      return;
    }

    // 等布局稳定再截图，避免截到未排版的空卡片。
    await new Promise((resolve) => setTimeout(resolve, CAPTURE_SETTLE_MS));
    tempUri = await captureRef(cardRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });
    const base64 = await new File(tempUri).base64();
    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permission.directoryUri,
      buildCardFileName(),
      'image/png',
    );
    await FileSystem.StorageAccessFramework.writeAsStringAsync(
      fileUri,
      base64,
      { encoding: FileSystem.EncodingType.Base64 },
    );
    notify('保存成功', '个人名片已保存到所选目录');
  } catch {
    notify('保存失败', '无法生成名片图片，请稍后重试');
  } finally {
    if (tempUri) {
      releaseCapture(tempUri);
    }
  }
}
