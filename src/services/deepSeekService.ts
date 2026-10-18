import { buildClozeSentence } from '@/features/daily-task/sentenceTemplates';

export type ExampleInputWord = {
  meaning: string;
  phonetic: string;
  word: string;
};

type ChatCompletionResponse = {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
  error?: {
    message?: string;
  };
};

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

export class DeepSeekError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeepSeekError';
  }
}

async function requestCompletion(
  apiKey: string,
  messages: { content: string; role: 'system' | 'user' }[],
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(DEEPSEEK_ENDPOINT, {
      body: JSON.stringify({
        messages,
        model: DEEPSEEK_MODEL,
        temperature: 0.6,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: controller.signal,
    });

    const data = (await response.json()) as ChatCompletionResponse;
    if (!response.ok) {
      throw new DeepSeekError(
        data.error?.message ?? `DeepSeek 请求失败（${response.status}）`,
      );
    }

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new DeepSeekError('DeepSeek 没有返回有效内容');
    }
    return content;
  } catch (error) {
    if (error instanceof DeepSeekError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new DeepSeekError('DeepSeek 请求超时，请稍后重试');
    }
    throw new DeepSeekError('无法连接 DeepSeek，请检查网络后重试');
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonContent(content: string): unknown {
  const withoutFence = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');
  if (start < 0 || end < start) {
    throw new DeepSeekError('DeepSeek 返回格式无法解析');
  }

  try {
    return JSON.parse(withoutFence.slice(start, end + 1));
  } catch {
    throw new DeepSeekError('DeepSeek 返回格式无法解析');
  }
}

export async function testDeepSeekConnection(apiKey: string): Promise<void> {
  await requestCompletion(apiKey, [
    {
      content: '你是连接测试助手，请只回复 OK。',
      role: 'system',
    },
    {
      content: '连接测试',
      role: 'user',
    },
  ]);
}

export async function generateExampleSentences(
  apiKey: string,
  words: ExampleInputWord[],
): Promise<Map<string, string>> {
  if (words.length === 0) {
    return new Map();
  }

  const content = await requestCompletion(apiKey, [
    {
      content:
        '你是英语学习内容生成器。只输出 JSON，不要输出 Markdown。每个例句必须自然、准确，并在句中只出现一次原始目标单词，不要使用该词的其他词形。',
      role: 'system',
    },
    {
      content: `请为下面每个单词生成一个 8-18 个英文单词的例句。
输出格式：
{"examples":[{"word":"原始单词","sentence":"包含原始单词的英文例句"}]}

单词数据：
${JSON.stringify(
  words.map(({ meaning, phonetic, word }) => ({ meaning, phonetic, word })),
)}`,
      role: 'user',
    },
  ]);

  const parsed = parseJsonContent(content) as {
    examples?: { sentence?: unknown; word?: unknown }[];
  };
  if (!Array.isArray(parsed.examples)) {
    throw new DeepSeekError('DeepSeek 返回内容缺少 examples 数组');
  }

  const expectedWords = new Map(
    words.map((item) => [item.word.toLocaleLowerCase('en-US'), item.word]),
  );
  const result = new Map<string, string>();

  for (const item of parsed.examples) {
    if (typeof item.word !== 'string' || typeof item.sentence !== 'string') {
      continue;
    }

    const key = item.word.trim().toLocaleLowerCase('en-US');
    const originalWord = expectedWords.get(key);
    const sentence = item.sentence.trim();
    if (
      originalWord &&
      sentence &&
      buildClozeSentence(sentence, originalWord) !== null
    ) {
      result.set(originalWord, sentence);
    }
  }

  return result;
}
