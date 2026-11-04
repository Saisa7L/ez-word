import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import {
  DEFAULT_PROFILE_CARD_CONTENT_COLOR,
  DEFAULT_PROFILE_TEXT_STROKE_COLOR,
  DEFAULT_PROFILE_TEXT_STROKE_WIDTH,
} from '@/constants/profile';
import { getHomeStats, type HomeStats } from '@/database/statsRepository';
import {
  getUserProfile,
  updateUserProfile,
} from '@/database/userProfileRepository';
import type { EditMode } from '@/features/profile/profileUtils';

type Notify = (title: string, message?: string) => void;

type UseProfileDataOptions = {
  notify: Notify;
};

/**
 * 个人资料页的数据与表单状态：加载、编辑、保存。
 * 只持有状态与副作用，不涉及任何卡片渲染细节。
 */
export function useProfileData({ notify }: UseProfileDataOptions) {
  const db = useSQLiteContext();
  const [displayName, setDisplayName] = useState('User');
  const [bio, setBio] = useState('');
  const [avatarData, setAvatarData] = useState('');
  const [backgroundData, setBackgroundData] = useState('');
  const [cardContentColor, setCardContentColor] = useState(
    DEFAULT_PROFILE_CARD_CONTENT_COLOR,
  );
  const [textStrokeColor, setTextStrokeColor] = useState(
    DEFAULT_PROFILE_TEXT_STROKE_COLOR,
  );
  const [textStrokeWidth, setTextStrokeWidth] = useState(
    DEFAULT_PROFILE_TEXT_STROKE_WIDTH,
  );
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    let active = true;

    Promise.all([getUserProfile(db), getHomeStats(db)])
      .then(([profile, nextStats]) => {
        if (!active) {
          return;
        }
        setDisplayName(profile.displayName);
        setBio(profile.bio);
        setAvatarData(profile.avatarData);
        setBackgroundData(profile.backgroundData);
        setCardContentColor(profile.cardContentColor);
        setTextStrokeColor(profile.textStrokeColor);
        setTextStrokeWidth(profile.textStrokeWidth);
        setStats(nextStats);
      })
      .catch(() => {
        if (active) {
          notify('读取失败', '无法读取个人资料，请稍后重试');
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [db, notify]);

  function openEditor(mode: Exclude<EditMode, null>) {
    setEditMode(mode);
    setEditValue(mode === 'name' ? displayName : bio);
    setEditError('');
  }

  function updateEditValue(value: string) {
    setEditValue(value);
    setEditError('');
  }

  function closeEditor() {
    setEditMode(null);
  }

  function submitEdit() {
    const nextValue = editValue.trim();
    if (editMode === 'name' && !nextValue) {
      setEditError('用户名不能为空');
      return;
    }

    if (editMode === 'name') {
      setDisplayName(nextValue);
    } else {
      setBio(nextValue);
    }
    setEditMode(null);
  }

  async function handleSave() {
    if (!displayName.trim()) {
      notify('无法保存', '用户名不能为空');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile(db, {
        avatarData,
        backgroundData,
        bio,
        cardContentColor,
        displayName,
        textStrokeColor,
        textStrokeWidth,
      });
      notify('保存成功', '个人资料已经更新');
    } catch {
      notify('保存失败', '无法保存个人资料，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  }

  return {
    avatarData,
    backgroundData,
    bio,
    cardContentColor,
    closeEditor,
    displayName,
    editError,
    editMode,
    editValue,
    handleSave,
    isLoading,
    isSaving,
    openEditor,
    setAvatarData,
    setBackgroundData,
    setCardContentColor,
    setTextStrokeColor,
    setTextStrokeWidth,
    stats,
    submitEdit,
    textStrokeColor,
    textStrokeWidth,
    updateEditValue,
  };
}
