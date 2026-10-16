export const colors = {
  background: '#F0F0F8',
  blue: '#4F97F8',
  blueSoft: '#E7EFFF',
  border: '#E4E7EF',
  graySoft: '#EEF0F5',
  mint: '#DDF4EF',
  orange: '#F1A173',
  orangeSoft: '#FCE9DD',
  pinkSoft: '#F8E4F4',
  primary: '#30BFAE',
  red: '#F85864',
  redSoft: '#FDE7EA',
  surface: '#FFFFFF',
  text: '#1D2430',
  textMuted: '#8992A3',
  textSecondary: '#657080',
} as const;

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
  shadowColor: '#A5AEC0',
  shadowOffset: { height: 6, width: 0 },
  shadowOpacity: 0.15,
  shadowRadius: 14,
} as const;
