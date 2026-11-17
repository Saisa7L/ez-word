import assert from 'node:assert/strict';
import test from 'node:test';

import { generateMissingWordData } from '../src/features/ai/generateWordData';
import {
  DeepSeekError,
  generateWordData,
  parseGeneratedWordDataResponse,
  testDeepSeekConnection,
} from '../src/services/deepSeekService';
import {
  asDatabase,
  createMigratedAdapter,
  insertTestWord,
} from './helpers/nodeSqlite';

const originalFetch = globalThis.fetch;

type FetchCall = {
  body?: string;
  headers?: Record<string, string>;
  url: string;
};

function stubFetch(
  handler: (call: FetchCall) => Response | Promise<Response>,
): FetchCall[] {
  const calls: FetchCall[] = [];
  globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
    const call: FetchCall = {
      body: typeof init?.body === 'string' ? init.body : undefined,
      headers: init?.headers as Record<string, string> | undefined,
      url: String(input),
    };
    calls.push(call);
    return handler(call);
  }) as typeof fetch;
  return calls;
}

function completion(content: string, status = 200): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status,
  });
}

function wordPayload(
  words: { phonetic: string; sentence: string; word: string }[],
) {
  return JSON.stringify({ words });
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('skips the request when there is nothing to generate', async () => {
  const calls = stubFetch(() => completion(''));

  const result = await generateWordData('key', []);

  assert.equal(result.size, 0);
  assert.equal(calls.length, 0);
});

test('sends the API key and parses valid generated words', async () => {
  const calls = stubFetch(() =>
    completion(
      '```json\n' +
        wordPayload([
          {
            phonetic: '/ˈælfə/',
            sentence: 'Alpha is the first letter in the series.',
            word: 'Alpha',
          },
        ]) +
        '\n```',
    ),
  );

  const result = await generateWordData('secret', [
    { meaning: '阿尔法', phonetic: '', word: 'alpha' },
  ]);

  assert.deepEqual(result.get('alpha'), {
    phonetic: '/ˈælfə/',
    sentence: 'Alpha is the first letter in the series.',
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, 'https://api.deepseek.com/chat/completions');
  assert.equal(calls[0]?.headers?.Authorization, 'Bearer secret');
  assert.match(calls[0]?.body ?? '', /"model":"deepseek-chat"/);
  assert.match(calls[0]?.body ?? '', /阿尔法/);
});

test('surfaces the provider error message', async () => {
  stubFetch(
    () =>
      new Response(JSON.stringify({ error: { message: '额度不足' } }), {
        status: 402,
      }),
  );

  await assert.rejects(
    () => testDeepSeekConnection('key'),
    (error: unknown) =>
      error instanceof DeepSeekError && error.message === '额度不足',
  );
});

test('falls back to the status code when the provider sends no message', async () => {
  stubFetch(() => new Response(JSON.stringify({}), { status: 401 }));

  await assert.rejects(
    () => testDeepSeekConnection('key'),
    (error: unknown) =>
      error instanceof DeepSeekError &&
      error.message === 'DeepSeek 请求失败（401）',
  );
});

test('rejects an empty completion', async () => {
  stubFetch(() => completion('   '));

  await assert.rejects(
    () => testDeepSeekConnection('key'),
    (error: unknown) =>
      error instanceof DeepSeekError &&
      error.message === 'DeepSeek 没有返回有效内容',
  );
});

test('maps an aborted request to the timeout message', async () => {
  stubFetch(() => {
    const error = new Error('aborted');
    error.name = 'AbortError';
    throw error;
  });

  await assert.rejects(
    () => testDeepSeekConnection('key'),
    (error: unknown) =>
      error instanceof DeepSeekError &&
      error.message === 'DeepSeek 请求超时，请稍后重试',
  );
});

test('maps network failures to a connection message', async () => {
  stubFetch(() => {
    throw new TypeError('fetch failed');
  });

  await assert.rejects(
    () => testDeepSeekConnection('key'),
    (error: unknown) =>
      error instanceof DeepSeekError &&
      error.message === '无法连接 DeepSeek，请检查网络后重试',
  );
});

test('resolves the connection test on a valid reply', async () => {
  stubFetch(() => completion('OK'));

  await testDeepSeekConnection('key');
});

test('rejects completions without a JSON object', () => {
  assert.throws(
    () => parseGeneratedWordDataResponse('抱歉，我无法回答', []),
    (error: unknown) =>
      error instanceof DeepSeekError &&
      error.message === 'DeepSeek 返回格式无法解析',
  );
});

test('rejects completions whose JSON body is malformed', () => {
  assert.throws(
    () => parseGeneratedWordDataResponse('{ words: [ }', []),
    (error: unknown) =>
      error instanceof DeepSeekError &&
      error.message === 'DeepSeek 返回格式无法解析',
  );
});

test('rejects completions without a words array', () => {
  assert.throws(
    () => parseGeneratedWordDataResponse('{"data":[]}', []),
    (error: unknown) =>
      error instanceof DeepSeekError &&
      error.message === 'DeepSeek 返回内容缺少 words 数组',
  );
});

test('drops generated words that cannot build a cloze sentence', () => {
  const parsed = parseGeneratedWordDataResponse(
    JSON.stringify({
      words: [
        {
          phonetic: '/ˈælfə/',
          sentence: 'Alpha is the first letter.',
          word: 'ALPHA',
        },
        {
          phonetic: '/ˈbiːtə/',
          sentence: 'This sentence never mentions the target.',
          word: 'beta',
        },
        {
          phonetic: `/${'x'.repeat(90)}/`,
          sentence: 'Gamma appears here.',
          word: 'gamma',
        },
        {
          phonetic: '/ˈdeltə/',
          sentence: 'Delta appears here.',
          word: 'delta',
        },
        { phonetic: 1, sentence: 'Unknown appears here.', word: 'unknown' },
      ],
    }),
    [
      { meaning: '阿尔法', phonetic: '', word: 'alpha' },
      { meaning: '贝塔', phonetic: '', word: 'beta' },
      { meaning: '伽马', phonetic: '', word: 'gamma' },
    ],
  );

  assert.deepEqual([...parsed.keys()], ['alpha']);
});

test('generates data only for incomplete words when overwrite is off', async () => {
  const adapter = await createMigratedAdapter();
  const db = asDatabase(adapter);

  await insertTestWord(adapter, { id: 1, word: 'alpha' });
  await insertTestWord(adapter, {
    exampleSentence: 'Beta already has a sentence.',
    id: 2,
    phonetic: '/ˈbiːtə/',
    word: 'beta',
  });
  stubFetch(() =>
    completion(
      wordPayload([
        {
          phonetic: '/ˈælfə/',
          sentence: 'Alpha appears right here.',
          word: 'alpha',
        },
      ]),
    ),
  );

  const progress = await generateMissingWordData({
    apiKey: 'key',
    db,
    onProgress: () => {},
    overwriteExisting: false,
  });

  assert.deepEqual(progress, {
    completed: 1,
    failed: 0,
    success: 1,
    total: 1,
  });
  const alpha = adapter.db
    .prepare(
      "SELECT phonetic, example_sentence FROM words WHERE word = 'alpha'",
    )
    .get() as { example_sentence: string; phonetic: string };
  assert.deepEqual(
    { ...alpha },
    {
      example_sentence: 'Alpha appears right here.',
      phonetic: '/ˈælfə/',
    },
  );
});

test('counts words the model skipped as failures', async () => {
  const adapter = await createMigratedAdapter();
  await insertTestWord(adapter, { id: 1, word: 'alpha' });
  await insertTestWord(adapter, { id: 2, word: 'beta' });
  stubFetch(() =>
    completion(
      wordPayload([
        {
          phonetic: '/ˈælfə/',
          sentence: 'Alpha appears right here.',
          word: 'alpha',
        },
      ]),
    ),
  );

  const snapshots: number[] = [];
  const progress = await generateMissingWordData({
    apiKey: 'key',
    db: asDatabase(adapter),
    onProgress: (value) => snapshots.push(value.success * 10 + value.failed),
    overwriteExisting: false,
  });

  assert.deepEqual(progress, {
    completed: 2,
    failed: 1,
    success: 1,
    total: 2,
  });
  assert.deepEqual(snapshots, [0, 10, 11]);
});

test('regenerates every word when overwrite is on', async () => {
  const adapter = await createMigratedAdapter();
  await insertTestWord(adapter, {
    exampleSentence: 'Alpha already has a sentence.',
    id: 1,
    phonetic: '/old/',
    word: 'alpha',
  });
  const calls = stubFetch(() =>
    completion(
      wordPayload([
        {
          phonetic: '/new/',
          sentence: 'Alpha appears right here.',
          word: 'alpha',
        },
      ]),
    ),
  );

  const progress = await generateMissingWordData({
    apiKey: 'key',
    db: asDatabase(adapter),
    onProgress: () => {},
    overwriteExisting: true,
  });

  assert.equal(progress.success, 1);
  assert.equal(calls.length, 1);
  const alpha = adapter.db
    .prepare(
      "SELECT phonetic, example_sentence FROM words WHERE word = 'alpha'",
    )
    .get() as { example_sentence: string; phonetic: string };
  assert.deepEqual(
    { ...alpha },
    {
      example_sentence: 'Alpha appears right here.',
      phonetic: '/new/',
    },
  );
});

test('splits generation into batches of ten words', async () => {
  const adapter = await createMigratedAdapter();
  for (let index = 0; index < 12; index += 1) {
    await insertTestWord(adapter, { id: index + 1, word: `word${index}` });
  }
  const calls = stubFetch((call) => {
    const requested = (
      JSON.parse(call.body ?? '{}') as {
        messages: { content: string }[];
      }
    ).messages[1].content;
    const words = [...requested.matchAll(/"word":"(word\d+)"/g)].map(
      (match) => ({
        phonetic: '/w/',
        sentence: `We use ${match[1]} in this sentence.`,
        word: match[1],
      }),
    );
    return completion(wordPayload(words));
  });

  const progress = await generateMissingWordData({
    apiKey: 'key',
    db: asDatabase(adapter),
    onProgress: () => {},
    overwriteExisting: false,
  });

  assert.equal(calls.length, 2);
  assert.deepEqual(progress, {
    completed: 12,
    failed: 0,
    success: 12,
    total: 12,
  });
});

test('stops the whole run when the provider rejects the request', async () => {
  const adapter = await createMigratedAdapter();
  await insertTestWord(adapter, { id: 1, word: 'alpha' });
  stubFetch(
    () =>
      new Response(JSON.stringify({ error: { message: '密钥无效' } }), {
        status: 401,
      }),
  );

  await assert.rejects(
    () =>
      generateMissingWordData({
        apiKey: 'key',
        db: asDatabase(adapter),
        onProgress: () => {},
        overwriteExisting: false,
      }),
    (error: unknown) =>
      error instanceof DeepSeekError && error.message === '密钥无效',
  );

  const alpha = adapter.db
    .prepare("SELECT phonetic FROM words WHERE word = 'alpha'")
    .get() as { phonetic: string };
  assert.equal(alpha.phonetic, '');
});
