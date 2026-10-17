import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsRow } from '@/components/SettingsRow';
import { SurfaceCard } from '@/components/SurfaceCard';
import { f1Assets } from '@/constants/f1Assets';
import { colors, shadow, spacing } from '@/constants/theme';

export default function SettingsScreen() {
  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>我的</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <SurfaceCard style={styles.menuCard}>
          <View style={styles.avatarRow}>
            <SettingsRow
              backgroundColor={colors.pinkSoft}
              icon={f1Assets.settingsAvatar}
              iconColor="#E765B8"
              label="更换头像"
              hideChevron
              style={styles.avatarRowContent}
            />
            <View style={styles.avatarCircle}>
              <Image source={f1Assets.avatarUser} style={styles.avatar} />
            </View>
          </View>

          <SettingsRow
            backgroundColor={colors.orangeSoft}
            icon={f1Assets.settingsDailyGoal}
            iconColor={colors.orange}
            label="通用设置"
            onPress={() => router.push('/settings/daily-task')}
          />
          <SettingsRow
            backgroundColor={colors.mint}
            icon={f1Assets.settingsImport}
            iconColor={colors.primary}
            label="导入单词"
            onPress={() => router.push('/settings/import')}
          />
          <SettingsRow
            backgroundColor={colors.blueSoft}
            icon={f1Assets.settingsAi}
            iconColor={colors.blue}
            label="AI 设置"
          />
          <SettingsRow
            backgroundColor={colors.graySoft}
            icon={f1Assets.settingsAbout}
            iconColor="#7C8798"
            label="关于"
            last
          />
        </SurfaceCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    height: 48,
    width: 48,
  },
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: '#F1F3F8',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 56,
  },
  avatarRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  avatarRowContent: {
    flex: 1,
    borderBottomWidth: 0,
  },
  content: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    height: 150,
    justifyContent: 'center',
  },
  headerSafeArea: {
    backgroundColor: colors.primary,
  },
  headerTitle: {
    color: colors.surface,
    fontSize: 25,
    fontWeight: '700',
  },
  menuCard: {
    ...shadow,
    marginTop: 24,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scroll: {
    flex: 1,
    marginTop: -72,
  },
});
