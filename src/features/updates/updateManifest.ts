export type UpdateRelease = {
  apkMirrorUrls: string[];
  apkUrl: string;
  md5: string | null;
  notes: string;
  publishedAt: string | null;
  releaseUrl: string;
  sha256: string | null;
  size: number | null;
  tagName: string;
  version: string;
};

const TRUSTED_RELEASE_PREFIX =
  'https://github.com/Saisa7L/ez-word/releases/download/';
const TRUSTED_MIRROR_PREFIX =
  'https://ghproxy.net/https://github.com/Saisa7L/ez-word/releases/download/';
const VERSION_PATTERN = /^\d+(?:\.\d+){0,2}$/;

function asOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asOptionalPositiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : null;
}

export function normalizeVersion(value: string): string {
  return value.trim().replace(/^v/i, '').split('-')[0] ?? '';
}

export function compareVersions(left: string, right: string): number {
  const leftParts = normalizeVersion(left).split('.').map(Number);
  const rightParts = normalizeVersion(right).split('.').map(Number);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

export function isTrustedReleaseUrl(value: string): boolean {
  return value.startsWith(TRUSTED_RELEASE_PREFIX);
}

export function isTrustedMirrorUrl(value: string): boolean {
  return value.startsWith(TRUSTED_MIRROR_PREFIX);
}

export function parseUpdateManifest(value: unknown): UpdateRelease {
  if (!value || typeof value !== 'object') {
    throw new Error('更新信息格式无效');
  }

  const record = value as Record<string, unknown>;
  const version = asOptionalString(record.version);
  const tagName = asOptionalString(record.tagName) ?? `v${version ?? ''}`;
  const apkUrl = asOptionalString(record.apkUrl);
  const releaseUrl = asOptionalString(record.releaseUrl);

  if (!version || !VERSION_PATTERN.test(normalizeVersion(version))) {
    throw new Error('更新版本号无效');
  }
  if (!apkUrl || !isTrustedReleaseUrl(apkUrl)) {
    throw new Error('更新安装包地址无效');
  }
  if (
    !releaseUrl ||
    !releaseUrl.startsWith('https://github.com/Saisa7L/ez-word/releases/')
  ) {
    throw new Error('更新发布页地址无效');
  }

  const rawMirrorUrls = Array.isArray(record.apkMirrorUrls)
    ? record.apkMirrorUrls
    : [];
  const apkMirrorUrls = rawMirrorUrls
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(isTrustedMirrorUrl);
  const sha256 = asOptionalString(record.sha256)?.toLowerCase() ?? null;
  const md5 = asOptionalString(record.md5)?.toLowerCase() ?? null;

  return {
    apkMirrorUrls,
    apkUrl,
    md5: md5 && /^[a-f0-9]{32}$/.test(md5) ? md5 : null,
    notes: asOptionalString(record.notes) ?? '',
    publishedAt: asOptionalString(record.publishedAt),
    releaseUrl,
    sha256: sha256 && /^[a-f0-9]{64}$/.test(sha256) ? sha256 : null,
    size: asOptionalPositiveInteger(record.size),
    tagName,
    version: normalizeVersion(version),
  };
}
