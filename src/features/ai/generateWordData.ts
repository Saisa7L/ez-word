import type { SQLiteDatabase } from 'expo-sqlite';

import {
  listWordsForDataGeneration,
  updateWordGeneratedData,
} from '@/database/wordsRepository';
import {
  DeepSeekError,
  generateWordData,
  type GeneratedWordData,
} from '@/services/deepSeekService';

const BATCH_SIZE = 10;

export type WordDataGenerationProgress = {
  completed: number;
  failed: number;
  success: number;
  total: number;
};

type GenerateWordDataOptions = {
  apiKey: string;
  db: SQLiteDatabase;
  onProgress: (progress: WordDataGenerationProgress) => void;
  overwriteExisting: boolean;
};

export async function generateMissingWordData({
  apiKey,
  db,
  onProgress,
  overwriteExisting,
}: GenerateWordDataOptions): Promise<WordDataGenerationProgress> {
  const words = await listWordsForDataGeneration(db, overwriteExisting);
  const progress: WordDataGenerationProgress = {
    completed: 0,
    failed: 0,
    success: 0,
    total: words.length,
  };
  onProgress({ ...progress });

  for (let index = 0; index < words.length; index += BATCH_SIZE) {
    const batch = words.slice(index, index + BATCH_SIZE);
    let generatedData = new Map<string, GeneratedWordData>();

    try {
      generatedData = await generateWordData(apiKey, batch);
    } catch (error) {
      if (error instanceof DeepSeekError) {
        throw error;
      }
      throw new DeepSeekError('生成单词数据失败，请稍后重试');
    }

    for (const word of batch) {
      const generated = generatedData.get(word.word);
      const needsPhonetic =
        overwriteExisting || word.phonetic.trim().length === 0;
      const needsExample =
        overwriteExisting || word.example_sentence.trim().length === 0;

      if (
        !generated ||
        (needsPhonetic && !generated.phonetic) ||
        (needsExample && !generated.sentence)
      ) {
        progress.failed += 1;
      } else {
        await updateWordGeneratedData(db, word.id, {
          ...(needsExample ? { exampleSentence: generated.sentence } : {}),
          ...(needsPhonetic ? { phonetic: generated.phonetic } : {}),
        });
        progress.success += 1;
      }

      progress.completed += 1;
      onProgress({ ...progress });
    }
  }

  return progress;
}
