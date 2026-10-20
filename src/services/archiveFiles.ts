import { File } from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system/legacy';

import { MAX_ARCHIVE_BYTES } from '@/constants/archive';

const ARCHIVE_MIME_TYPES = [
  'application/json',
  'application/octet-stream',
  'text/plain',
];

export type PickedArchiveFile = {
  content: string;
  name: string;
  size: number | undefined;
};

function buildArchiveFileName(): string {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const time = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  return `vocab-archive-${date}-${time}.json`;
}

export async function exportArchiveFile(content: string): Promise<boolean> {
  if (content.length > MAX_ARCHIVE_BYTES) {
    throw new Error('存档文件过大，请先精简本地数据');
  }

  const permission =
    await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permission.granted) {
    return false;
  }

  const fileUri = await StorageAccessFramework.createFileAsync(
    permission.directoryUri,
    buildArchiveFileName(),
    'application/json',
  );
  await StorageAccessFramework.writeAsStringAsync(fileUri, content);
  return true;
}

export async function pickArchiveFile(): Promise<PickedArchiveFile | null> {
  const result = await File.pickFileAsync({
    mimeTypes: ARCHIVE_MIME_TYPES,
  });

  if (result.canceled || !result.result) {
    return null;
  }

  const file = result.result;
  if (file.size !== undefined && file.size > MAX_ARCHIVE_BYTES) {
    throw new Error('存档文件超过 20 MB，已拒绝读取');
  }

  return {
    content: await file.text(),
    name: file.name,
    size: file.size,
  };
}
