import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionOptionModal } from '@/components/ActionOptionModal';
import { HomeActionCard } from '@/components/HomeActionCard';
import { radii, shadow, spacing, type ThemeColors } from '@/constants/theme';
import { uiAssets } from '@/constants/uiAssets';
import {
  getHomeStats,
  getLastReviewPromptStudyDay,
  markReviewPrompted,
  type HomeStats,
} from '@/database/statsRepository';
import { getDailyTaskSettings } from '@/database/settingsRepository';
import { getUserProfile } from '@/database/userProfileRepository';
import { useAppTheme, useThemedStyles } from '@/features/theme/ThemeProvider';
import { pushOnce } from '@/utils/navigationActions';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [homeStats, setHomeStats] = useState<HomeStats | null>(null);
  const [displayName, setDisplayName] = useState('User');
  const [avatarData, setAvatarData] = useState('');
  const [reviewReminderVisible, setReviewReminderVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadStats() {
        try {
          const [nextStats, profile] = await Promise.all([
            getHomeStats(db),
            getUserProfile(db),
          ]);
          if (!active) {
            return;
          }

          setHomeStats(nextStats);
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
            setHomeStats(null);
          }
        }
      }

      void loadStats();

      return () => {
        active = false;
      };
    }, [db]),
  );

  const stats = [
    { label: '今日已学', value: String(homeStats?.todayLearned ?? '--') },
    { label: '总计已学', value: String(homeStats?.totalLearned ?? '--') },
    { label: '错题本', value: String(homeStats?.wrongBookCount ?? '--') },
  ];
  const avatarSource = avatarData
    ? { uri: avatarData }
    : uiAssets.avatars.default;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeHeader}>
            <View style={styles.avatarRing}>
              <Image
                resizeMode="cover"
                source={avatarSource}
                style={styles.avatar}
              />
            </View>
            <View style={styles.welcomeCopy}>
              <Text style={styles.welcomeTitle}>欢迎回来，{displayName}！</Text>
              <Text style={styles.welcomeSubtitle}>
                您已经学习了 {homeStats?.studyDays ?? 0} 天
              </Text>
            </View>
          </View>

          <View style={styles.statsPanel}>
            {stats.map((item, index) => (
              <View key={item.label} style={styles.statItem}>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
                {index < stats.length - 1 ? (
                  <View style={styles.statDivider} />
                ) : null}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <HomeActionCard
            backgroundColor={colors.graySoft}
            icon={uiAssets.home.task}
            iconColor={colors.accentText}
            onPress={() => pushOnce('/daily-task')}
            title="今日任务"
          />
          <HomeActionCard
            backgroundColor={colors.orangeSoft}
            icon={uiAssets.home.wrongReview}
            iconColor={colors.orange}
            onPress={() => pushOnce('/wrong-book/review')}
            title="错题回顾"
          />
          <HomeActionCard
            backgroundColor={colors.blueSoft}
            icon={uiAssets.home.wordPractice}
            iconColor={colors.blue}
            onPress={() => pushOnce('/review')}
            title="单词再练"
          />
        </View>
      </ScrollView>

      <ActionOptionModal
        message="已到达规定的复习时间，让我们开始复习吧！"
        onClose={() => setReviewReminderVisible(false)}
        options={[
          {
            label: '去复习',
            onPress: () => pushOnce('/review'),
            tone: 'primary',
          },
          {
            label: '稍后',
            onPress: () => {},
          },
        ]}
        title="该复习了"
        visible={reviewReminderVisible}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    actions: {
      gap: 18,
      marginTop: 26,
    },
    avatar: {
      height: '100%',
      width: '100%',
    },
    avatarRing: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.mint,
      borderRadius: 40,
      borderWidth: 3,
      height: 68,
      justifyContent: 'center',
      overflow: 'hidden',
      width: 68,
    },
    content: {
      paddingBottom: spacing.xl,
      paddingHorizontal: spacing.lg,
      paddingTop: 32,
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    statDivider: {
      backgroundColor: colors.border,
      bottom: 3,
      position: 'absolute',
      right: -11,
      top: 3,
      width: StyleSheet.hairlineWidth,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
      position: 'relative',
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 6,
    },
    statsPanel: {
      ...shadow,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      flexDirection: 'row',
      marginTop: 28,
      paddingVertical: 18,
    },
    statValue: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '700',
    },
    welcomeCard: {
      backgroundColor: colors.primary,
      borderRadius: radii.xl,
      padding: 24,
    },
    welcomeCopy: {
      flex: 1,
      marginLeft: 18,
    },
    welcomeHeader: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    welcomeSubtitle: {
      color: colors.onPrimary,
      fontSize: 17,
      marginTop: 8,
      opacity: 0.82,
    },
    welcomeTitle: {
      color: colors.onPrimary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 30,
    },
  });
