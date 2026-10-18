import type { WordRecord } from '@/database/wordsRepository';

import type { DailyTaskQuestion } from './types';

const SENTENCE_TEMPLATES: Record<string, string> = {
  abandon: 'They had to ______ the old plan and start again.',
  achieve: 'She worked hard to ______ her goal.',
  approach: 'We need a different ______ to this problem.',
  benefit: 'Regular exercise can ______ your health.',
  challenge: 'Learning a new language is a ______.',
  determine: 'The test will ______ whether the solution works.',
  efficient: 'This method is more ______ than the old one.',
  generate: 'The program can ______ new examples automatically.',
  improve: 'Daily practice will ______ your vocabulary.',
  maintain: 'It is important to ______ a steady learning habit.',
  obvious: 'The answer became ______ after the explanation.',
  observe: 'Scientists ______ the process very carefully.',
  persistent: 'A ______ learner can make progress over time.',
  significant: 'The new method produced a ______ improvement.',
  solution: 'We finally found a practical ______.',
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildClozeSentence(
  sentence: string,
  word: string,
): string | null {
  const trimmedSentence = sentence.trim();
  if (!trimmedSentence) {
    return null;
  }

  const pattern = new RegExp(`\\b${escapeRegExp(word.trim())}\\b`, 'i');
  if (!pattern.test(trimmedSentence)) {
    return null;
  }

  return trimmedSentence.replace(pattern, '______');
}

export function buildDailyTaskQuestions(words: WordRecord[]): DailyTaskQuestion[] {
  return words.map((word) => ({
    sentence:
      buildClozeSentence(word.example_sentence, word.word) ??
      SENTENCE_TEMPLATES[word.word.toLocaleLowerCase('en-US')] ??
      'Complete the sentence with the correct word: ______.',
    word,
  }));
}
