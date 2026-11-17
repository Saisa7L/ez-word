import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { findWordByWord } from '@/database/wordsRepository';
import {
  addWrongBookWord,
  addWrongBookWords,
} from '@/database/wrongBookRepository';

export type WrongBookAddMode = 'existing' | 'manual';

type Notify = (title: string, message: string) => void;

type UseWrongBookAddOptions = {
  notify: Notify;
  onAdded: () => void;
};

export type WrongBookAdd = {
  addManual: () => Promise<void>;
  addSelected: (selectedIds: Set<number>) => Promise<void>;
  isSaving: boolean;
  manualWord: string;
  mode: WrongBookAddMode;
  setManualWord: (value: string) => void;
  setMode: (mode: WrongBookAddMode) => void;
};

/**
 * 添加错题的两种提交路径：勾选现有词库、手动输入单词。
 * 手动输入先在词库中查重，词不存在时提示并中止，不写入错题本。
 * 只持有提交状态与业务判断，不涉及分页读取与渲染。
 */
export function useWrongBookAdd({
  notify,
  onAdded,
}: UseWrongBookAddOptions): WrongBookAdd {
  const db = useSQLiteContext();
  const [mode, setMode] = useState<WrongBookAddMode>('existing');
  const [isSaving, setIsSaving] = useState(false);
  const [manualWord, setManualWord] = useState('');

  const addSelected = useCallback(
    async (selectedIds: Set<number>) => {
      if (selectedIds.size === 0 || isSaving) {
        return;
      }

      setIsSaving(true);
      try {
        await addWrongBookWords(db, [...selectedIds], 'manual');
        onAdded();
      } catch {
        notify('添加失败', '无法加入错题本，请稍后重试');
      } finally {
        setIsSaving(false);
      }
    },
    [db, isSaving, notify, onAdded],
  );

  const addManual = useCallback(async () => {
    const word = manualWord.trim();

    if (!word) {
      notify('请输入单词', '单词不能为空');
      return;
    }

    if (isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const existing = await findWordByWord(db, word);
      if (!existing) {
        notify('单词不存在', `当前词库中没有“${word}”，请先导入该单词`);
        return;
      }
      await addWrongBookWord(db, existing.id, 'manual');
      onAdded();
    } catch {
      notify('添加失败', '无法保存并加入错题本，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  }, [db, isSaving, manualWord, notify, onAdded]);

  return {
    addManual,
    addSelected,
    isSaving,
    manualWord,
    mode,
    setManualWord,
    setMode,
  };
}
