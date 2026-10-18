import type { SQLiteDatabase } from 'expo-sqlite';

import {
  listWordsForExampleGeneration,
  updateWordExample,
} from '@/database/wordsRepository';
import {
  DeepSeekError,
  generateExampleSentences,
} from '@/services/deepSeekService';

const BATCH_SIZE = 10;

export type ExampleGenerationProgress = {
  completed: number;
  failed: number;
  success: number;
  total: number;
};

type GenerateWordExamplesOptions = {
  apiKey: string;
  db: SQLiteDatabase;
  onProgress: (progress: ExampleGenerationProgress) => void;
  overwriteExisting: boolean;
};

export async function generateWordExamples({
  apiKey,
  db,
  onProgress,
  overwriteExisting,
}: GenerateWordExamplesOptions): Promise<ExampleGenerationProgress> {
  const words = await listWordsForExampleGeneration(db, overwriteExisting);
  const progress: ExampleGenerationProgress = {
    completed: 0,
    failed: 0,
    success: 0,
    total: words.length,
  };
  onProgress({ ...progress });

  for (let index = 0; index < words.length; index += BATCH_SIZE) {
    const batch = words.slice(index, index + BATCH_SIZE);
    let examples = new Map<string, string>();

    try {
      examples = await generateExampleSentences(apiKey, batch);
    } catch (error) {
      if (error instanceof DeepSeekError) {
        throw error;
      }
      throw new DeepSeekError('生成例句失败，请稍后重试');
    }

    for (const word of batch) {
      const example = examples.get(word.word);
      if (example) {
        await updateWordExample(db, word.id, example, 'ai');
        progress.success += 1;
      } else {
        progress.failed += 1;
      }
      progress.completed += 1;
      onProgress({ ...progress });
    }
  }

  return progress;
}
