import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { findWordByWord, upsertSingleWord } from '@/database/wordsRepository';

type Notify = (title: string, message: string) => void;

type UseWordAddOptions = {
  notify: Notify;
  onAdded: () => void;
};

export type WordAdd = {
  addWord: () => Promise<void>;
  isSaving: boolean;
  meaning: string;
  phonetic: string;
  setMeaning: (value: string) => void;
  setPhonetic: (value: string) => void;
  setWord: (value: string) => void;
  word: string;
};

/**
 * 手动添加单词的提交流程：三字段非空校验、词库查重、写入。
 * 已存在于当前词库时提示并中止；历史存在但未激活时会恢复原状态。
 * 只持有表单与提交状态，不涉及渲染。
 */
export function useWordAdd({ notify, onAdded }: UseWordAddOptions): WordAdd {
  const db = useSQLiteContext();
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const addWord = useCallback(async () => {
    const cleanWord = word.trim();
    const cleanMeaning = meaning.trim();
    const cleanPhonetic = phonetic.trim();

    if (!cleanWord || !cleanMeaning || !cleanPhonetic) {
      notify('信息不完整', '单词、释义和音标都必须填写');
      return;
    }

    if (isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const existing = await findWordByWord(db, cleanWord);
      if (existing?.is_active === 1) {
        notify('单词已存在', `“${cleanWord}”已经在当前词库中`);
        return;
      }

      await upsertSingleWord(db, {
        meaning: cleanMeaning,
        phonetic: cleanPhonetic,
        word: cleanWord,
      });
      onAdded();
    } catch {
      notify('添加失败', '无法添加单词，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  }, [db, isSaving, meaning, notify, onAdded, phonetic, word]);

  return {
    addWord,
    isSaving,
    meaning,
    phonetic,
    setMeaning,
    setPhonetic,
    setWord,
    word,
  };
}
