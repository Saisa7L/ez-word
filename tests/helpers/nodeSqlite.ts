import { DatabaseSync } from 'node:sqlite';

import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateDatabase } from '../../src/database/database';

type SqlParams = Record<string, number | string | null>;

/**
 * 把 Node 内置 SQLite 适配成 expo-sqlite 的调用形态。
 * 只实现代码实际用到的子集（含两种事务入口），用于在 Node 测试里跑真实 SQL。
 */
export class NodeSqliteAdapter {
  constructor(readonly db: DatabaseSync) {}

  async execAsync(source: string): Promise<void> {
    this.db.exec(source);
  }

  async getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]> {
    const statement = this.db.prepare(source);
    const rows =
      params.length === 1 && typeof params[0] === 'object'
        ? statement.all(params[0] as SqlParams)
        : statement.all(...(params as (number | string | null)[]));
    return rows as T[];
  }

  async getFirstAsync<T>(
    source: string,
    ...params: unknown[]
  ): Promise<T | null> {
    const statement = this.db.prepare(source);
    const row =
      params.length === 1 && typeof params[0] === 'object'
        ? statement.get(params[0] as SqlParams)
        : statement.get(...(params as (number | string | null)[]));
    return (row ?? null) as T | null;
  }

  async runAsync(source: string, ...params: unknown[]): Promise<unknown> {
    const statement = this.db.prepare(source);
    const result =
      params.length === 1 && typeof params[0] === 'object'
        ? statement.run(params[0] as SqlParams)
        : statement.run(...(params as (number | string | null)[]));
    // expo-sqlite 返回 lastInsertRowId，Node 内置返回 lastInsertRowid，需对齐。
    return {
      changes: result.changes,
      lastInsertRowId: Number(result.lastInsertRowid),
    };
  }

  async withExclusiveTransactionAsync(
    task: (transaction: NodeSqliteAdapter) => Promise<void>,
  ): Promise<void> {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      await task(this);
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    this.db.exec('BEGIN');
    try {
      await task();
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
}

export function asDatabase(adapter: NodeSqliteAdapter): SQLiteDatabase {
  return adapter as unknown as SQLiteDatabase;
}

export async function createMigratedAdapter(): Promise<NodeSqliteAdapter> {
  const adapter = new NodeSqliteAdapter(new DatabaseSync(':memory:'));
  await migrateDatabase(asDatabase(adapter));
  return adapter;
}

export const TEST_NOW = '2026-10-19T10:00:00.000Z';

export async function insertTestWord(
  adapter: NodeSqliteAdapter,
  options: {
    exampleSentence?: string;
    id: number;
    isActive?: boolean;
    learningStatus?: 'learned' | 'unlearned' | 'wrong';
    phonetic?: string;
    word: string;
  },
): Promise<void> {
  await adapter.runAsync(
    `INSERT INTO words (
       id, word, meaning, phonetic, created_at, updated_at,
       is_active, learning_status, example_sentence,
       example_source, example_generated_at
     ) VALUES (
       $id, $word, $meaning, $phonetic, $now, $now,
       $isActive, $status, $example, '', NULL
     )`,
    {
      $example: options.exampleSentence ?? '',
      $id: options.id,
      $isActive: options.isActive === false ? 0 : 1,
      $meaning: options.word,
      $now: TEST_NOW,
      $phonetic: options.phonetic ?? '',
      $status: options.learningStatus ?? 'unlearned',
      $word: options.word,
    },
  );
}

export async function insertWrongBookEntry(
  adapter: NodeSqliteAdapter,
  wordId: number,
  sources: readonly string[],
  wrongCount = 1,
  now = TEST_NOW,
): Promise<void> {
  await adapter.runAsync(
    `INSERT INTO wrong_book_words (
       word_id, added_at, last_wrong_at, wrong_count
     ) VALUES ($wordId, $now, $now, $wrongCount)`,
    {
      $now: now,
      $wordId: wordId,
      $wrongCount: wrongCount,
    },
  );
  for (const source of sources) {
    await adapter.runAsync(
      `INSERT INTO wrong_book_sources (word_id, source)
       VALUES ($wordId, $source)`,
      {
        $source: source,
        $wordId: wordId,
      },
    );
  }
}
