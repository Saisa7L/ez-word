const MAX_WORD_FONT_SIZE = 54;
const MIN_WORD_FONT_SIZE = 16;
const AVERAGE_CHARACTER_WIDTH_RATIO = 0.64;

export function calculateFittedWordFontSize(
  availableWidth: number,
  characterCount: number,
): number {
  if (!Number.isFinite(availableWidth) || availableWidth <= 0) {
    return MAX_WORD_FONT_SIZE;
  }

  const safeCharacterCount = Math.max(1, Math.ceil(characterCount));
  const fittedSize =
    availableWidth / (safeCharacterCount * AVERAGE_CHARACTER_WIDTH_RATIO);

  return (
    Math.floor(
      Math.min(MAX_WORD_FONT_SIZE, Math.max(MIN_WORD_FONT_SIZE, fittedSize)) *
        2,
    ) / 2
  );
}
