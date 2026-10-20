import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createThemeColors,
  DEFAULT_GREEN,
  getContrastColor,
} from '../src/constants/theme';

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => {
    const channel = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

test('light theme helper text meets WCAG AA contrast', () => {
  const colors = createThemeColors('day');
  for (const background of [colors.background, colors.surface]) {
    assert.ok(contrastRatio(colors.textSecondary, background) >= 4.5);
    assert.ok(contrastRatio(colors.textMuted, background) >= 4.5);
  }
});

test('night theme helper text meets WCAG AA contrast', () => {
  const colors = createThemeColors('night');
  for (const background of [colors.background, colors.surface]) {
    assert.ok(contrastRatio(colors.textSecondary, background) >= 4.5);
    assert.ok(contrastRatio(colors.textMuted, background) >= 4.5);
  }
});

test('button foreground colors are valid contrast choices', () => {
  for (const background of [DEFAULT_GREEN, '#F85864', '#F28B92']) {
    const foreground = getContrastColor(background);
    assert.ok(contrastRatio(foreground, background) >= 3);
  }
});
