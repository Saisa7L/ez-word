import { PROFILE_TEXT_STROKE_MAX_WIDTH } from '@/constants/profile';

export const BIO_MAX_LENGTH = 120;
export const AVATAR_MAX_BYTES = 3 * 1024 * 1024;
export const BACKGROUND_MAX_BYTES = 6 * 1024 * 1024;

const NAME_CHARS_PER_LINE = 5;

export const TEXT_STROKE_WIDTHS = Array.from(
  { length: PROFILE_TEXT_STROKE_MAX_WIDTH + 1 },
  (_, index) => index,
);

export type EditMode = 'bio' | 'name' | null;
export type ImageTarget = 'avatar' | 'background';

export function estimateBase64Bytes(base64: string): number {
  return Math.floor((base64.length * 3) / 4);
}

export function buildCardFileName(): string {
  const now = new Date();
  return `vocab-profile-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}.png`;
}

export function splitDisplayName(displayName: string): string[] {
  const characters = Array.from(displayName || 'User');
  const lines: string[] = [];

  for (let index = 0; index < characters.length; index += NAME_CHARS_PER_LINE) {
    lines.push(
      characters.slice(index, index + NAME_CHARS_PER_LINE).join(''),
    );
  }

  return lines;
}
