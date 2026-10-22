import { File, Paths } from 'expo-file-system';

import {
  parseUpdateManifest,
  type UpdateRelease,
} from '@/features/updates/updateManifest';

const GITHUB_REPOSITORY_API =
  'https://api.github.com/repos/Saisa7L/ez-word/releases/latest';
const GITHUB_RELEASES_URL =
  'https://github.com/Saisa7L/ez-word/releases/latest';
const UPDATE_MANIFEST_MIRROR_URL =
  'https://ghproxy.net/https://raw.githubusercontent.com/Saisa7L/ez-word/main/update/latest.json';
const UPDATE_MANIFEST_GITHUB_URL =
  'https://raw.githubusercontent.com/Saisa7L/ez-word/main/update/latest.json';
const MIRROR_PREFIX = 'https://ghproxy.net/';
const REQUEST_TIMEOUT_MS = 10_000;

type UpdateDownloadOptions = {
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
};

function getManifestUrls(): string[] {
  const override = process.env.EXPO_PUBLIC_UPDATE_MANIFEST_URL?.trim();
  return override
    ? [override]
    : [UPDATE_MANIFEST_MIRROR_URL, UPDATE_MANIFEST_GITHUB_URL];
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`更新请求失败：${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function mapGitHubRelease(value: unknown): UpdateRelease {
  if (!value || typeof value !== 'object') {
    throw new Error('GitHub 更新信息格式无效');
  }

  const release = value as Record<string, unknown>;
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const apkAsset = assets.find((asset) => {
    if (!asset || typeof asset !== 'object') {
      return false;
    }
    const item = asset as Record<string, unknown>;
    return (
      typeof item.name === 'string' &&
      item.name.endsWith('.apk') &&
      typeof item.browser_download_url === 'string'
    );
  }) as Record<string, unknown> | undefined;
  const apkUrl = apkAsset?.browser_download_url;

  if (typeof apkUrl !== 'string') {
    throw new Error('未找到 APK 更新包');
  }

  return parseUpdateManifest({
    apkMirrorUrls: [`${MIRROR_PREFIX}${apkUrl}`],
    apkUrl,
    notes: typeof release.body === 'string' ? release.body : '',
    publishedAt:
      typeof release.published_at === 'string'
        ? release.published_at
        : undefined,
    releaseUrl:
      typeof release.html_url === 'string'
        ? release.html_url
        : GITHUB_RELEASES_URL,
    sha256:
      typeof apkAsset?.digest === 'string'
        ? apkAsset.digest.replace(/^sha256:/i, '')
        : undefined,
    size: apkAsset?.size,
    tagName: release.tag_name,
    version: release.tag_name,
  });
}

export async function fetchLatestRelease(): Promise<UpdateRelease> {
  for (const url of getManifestUrls()) {
    try {
      return parseUpdateManifest(await fetchJson(url));
    } catch {
      // Try the remaining mirror and GitHub fallbacks.
    }
  }

  return mapGitHubRelease(await fetchJson(GITHUB_REPOSITORY_API));
}

export async function downloadUpdate(
  release: UpdateRelease,
  { onProgress, signal }: UpdateDownloadOptions = {},
): Promise<File> {
  const destination = new File(Paths.cache, `ez-word-${release.version}.apk`);
  if (destination.exists) {
    destination.delete();
  }

  const sources = [...new Set([...release.apkMirrorUrls, release.apkUrl])];
  let lastError: unknown = null;

  for (const source of sources) {
    try {
      const task = File.createDownloadTask(source, destination, {
        onProgress: ({ bytesWritten, totalBytes }) => {
          if (totalBytes > 0) {
            onProgress?.(
              Math.min(100, Math.round((bytesWritten / totalBytes) * 100)),
            );
          }
        },
        signal,
      });
      const file = await task.downloadAsync();
      if (!file) {
        throw new Error('下载未完成');
      }
      if (release.size !== null && file.size !== release.size) {
        throw new Error('安装包大小校验失败');
      }
      if (
        release.md5 !== null &&
        file.md5?.toLowerCase() !== release.md5.toLowerCase()
      ) {
        throw new Error('安装包完整性校验失败');
      }
      return file;
    } catch (error) {
      lastError = error;
      if (signal?.aborted) {
        throw error;
      }
      if (destination.exists) {
        destination.delete();
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('所有更新镜像均不可用');
}

export async function installUpdate(file: File): Promise<void> {
  const IntentLauncher = await import('expo-intent-launcher');
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: file.contentUri,
    flags: 1,
    type: 'application/vnd.android.package-archive',
  });
}
