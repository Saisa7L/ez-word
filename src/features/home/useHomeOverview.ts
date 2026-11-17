import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { getDailyTaskSettings } from '@/database/settingsRepository';
import {
  getHomeStats,
  getLastReviewPromptStudyDay,
  markReviewPrompted,
  type HomeStats,
} from '@/database/statsRepository';
import { getUserProfile } from '@/database/userProfileRepository';

export type HomeOverview = {
  avatarData: string;
  dismissReviewReminder: () => void;
  displayName: string;
  reviewReminderVisible: boolean;
  stats: HomeStats | null;
};

/**
 * 首页概览：聚合统计与资料、按设置判断是否该弹出复习提醒。
 * 提醒一旦弹出即写入已提示天数，保证同一个学习天数只提醒一次。
 * 只持有数据与提醒状态，不涉及任何渲染细节。
 */
export function useHomeOverview(): HomeOverview {
  const db = useSQLiteContext();
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [displayName, setDisplayName] = useState('User');
  const [avatarData, setAvatarData] = useState('');
  const [reviewReminderVisible, setReviewReminderVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadOverview() {
        try {
          const [nextStats, profile] = await Promise.all([
            getHomeStats(db),
            getUserProfile(db),
          ]);
          if (!active) {
            return;
          }

          setStats(nextStats);
          setDisplayName(profile.displayName);
          setAvatarData(profile.avatarData);

          const settings = await getDailyTaskSettings(db);
          if (
            settings.reviewReminderEnabled &&
            nextStats.studyDays > 0 &&
            nextStats.studyDays % settings.reviewReminderIntervalDays === 0
          ) {
            const lastPrompted = await getLastReviewPromptStudyDay(db);
            if (active && lastPrompted < nextStats.studyDays) {
              await markReviewPrompted(db, nextStats.studyDays);
              if (active) {
                setReviewReminderVisible(true);
              }
            }
          }
        } catch {
          if (active) {
            setStats(null);
          }
        }
      }

      void loadOverview();

      return () => {
        active = false;
      };
    }, [db]),
  );

  const dismissReviewReminder = useCallback(() => {
    setReviewReminderVisible(false);
  }, []);

  return {
    avatarData,
    dismissReviewReminder,
    displayName,
    reviewReminderVisible,
    stats,
  };
}
