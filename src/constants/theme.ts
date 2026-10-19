export type ThemeMode = 'custom' | 'day' | 'night';

export type ThemeColors = {
  accentText: string;
  background: string;
  blue: string;
  blueSoft: string;
  border: string;
  disabled: string;
  graySoft: string;
  mint: string;
  onPrimary: string;
  orange: string;
  orangeSoft: string;
  overlay: string;
  pink: string;
  pinkSoft: string;
  primary: string;
  red: string;
  redSoft: string;
  shadow: string;
  slate: string;
  surface: string;
  text: string;
  textMuted: string;
  textSecondary: string;
};

export const DEFAULT_GREEN = '#30BFAE';

export const DEFAULT_GREEN_SOFT = '#DDF4EF';

// Legacy name retained for code that still imports it.
export const BRAND_GREEN = DEFAULT_GREEN;

export const DEFAULT_THEME_MODE: ThemeMode = 'day';

export const DEFAULT_THEME_PRIMARY_COLOR = '#FFFFFF';

// Legacy exports retained for database and archive compatibility.
export const DEFAULT_CUSTOM_SURFACE_COLOR = DEFAULT_THEME_PRIMARY_COLOR;
export const DEFAULT_CUSTOM_ACCENT_COLOR = DEFAULT_THEME_PRIMARY_COLOR;
export const DEFAULT_CUSTOM_BACKGROUND_COLOR = '#F0F0F8';

function normalizeHex(value: string, fallback: string): string {
  return /^#[0-9A-F]{6}$/i.test(value)
    ? value.toUpperCase()
    : fallback;
}

function hexToRgb(value: string): [number, number, number] {
  const hex = normalizeHex(value, DEFAULT_THEME_PRIMARY_COLOR);
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue]
    .map((channel) =>
      Math.round(Math.min(255, Math.max(0, channel)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`;
}

function mixColors(
  base: string,
  blend: string,
  blendWeight: number,
): string {
  const [baseRed, baseGreen, baseBlue] = hexToRgb(base);
  const [blendRed, blendGreen, blendBlue] = hexToRgb(blend);
  const weight = Math.min(1, Math.max(0, blendWeight));

  return rgbToHex(
    baseRed * (1 - weight) + blendRed * weight,
    baseGreen * (1 - weight) + blendGreen * weight,
    baseBlue * (1 - weight) + blendBlue * weight,
  );
}

function getContrastColor(background: string): string {
  const [red, green, blue] = hexToRgb(background);
  const luminance =
    (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.58 ? '#000000' : '#FFFFFF';
}

export function normalizeThemeColor(
  value: string,
  fallback = DEFAULT_THEME_PRIMARY_COLOR,
): string {
  return normalizeHex(value, fallback);
}

function createLightPalette(
  primaryColor: string,
  keepSoftColor = false,
): ThemeColors {
  const primary = normalizeThemeColor(primaryColor, DEFAULT_THEME_PRIMARY_COLOR);

  return {
    accentText: '#000000',
    background: '#F0F0F8',
    blue: '#4F97F8',
    blueSoft: '#E7EFFF',
    border: '#E4E7EF',
    disabled: '#B9C0CA',
    graySoft: '#EEF0F5',
    mint: keepSoftColor
      ? mixColors(primary, '#FFFFFF', 0.84)
      : '#EEF0F5',
    onPrimary: getContrastColor(primary),
    orange: '#F1A173',
    orangeSoft: '#FCE9DD',
    overlay: 'rgba(0, 0, 0, 0.42)',
    pink: '#E765B8',
    pinkSoft: '#F8E4F4',
    primary,
    red: '#F85864',
    redSoft: '#FDE7EA',
    shadow: '#A5AEC0',
    slate: '#7C8798',
    surface: '#FFFFFF',
    text: '#1D2430',
    textMuted: '#8992A3',
    textSecondary: '#657080',
  };
}

const NIGHT_COLORS: ThemeColors = {
  accentText: '#FFFFFF',
  background: '#000000',
  blue: '#9BBDFF',
  blueSoft: '#26303D',
  border: '#4A4A4A',
  disabled: '#4B4B4B',
  graySoft: '#3A3A3A',
  mint: '#3A3A3A',
  onPrimary: '#FFFFFF',
  orange: '#D8B18E',
  orangeSoft: '#3A342F',
  overlay: 'rgba(0, 0, 0, 0.72)',
  pink: '#D7A9C6',
  pinkSoft: '#393138',
  primary: '#3D3D3D',
  red: '#F28B92',
  redSoft: '#402C2E',
  shadow: '#000000',
  slate: '#A5A5A5',
  surface: '#292929',
  text: '#F5F5F5',
  textMuted: '#A0A0A0',
  textSecondary: '#C8C8C8',
};

export function createThemeColors(
  mode: ThemeMode,
  themePrimaryColor = DEFAULT_THEME_PRIMARY_COLOR,
): ThemeColors {
  if (mode === 'night') {
    return NIGHT_COLORS;
  }

  if (mode === 'custom') {
    return createLightPalette(themePrimaryColor, true);
  }

  return createLightPalette('#FFFFFF');
}

export const colors = createThemeColors(DEFAULT_THEME_MODE);

export const radii = {
  sm: 8,
  md: 14,
  lg: 24,
  xl: 28,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 28,
} as const;

export const shadow = {
  elevation: 3,
  shadowColor: '#000000',
  shadowOffset: { height: 6, width: 0 },
  shadowOpacity: 0.15,
  shadowRadius: 14,
} as const;
