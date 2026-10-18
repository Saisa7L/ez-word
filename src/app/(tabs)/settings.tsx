import { Image, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { GreenSheetScreen } from '@/components/GreenSheetScreen';
import { SettingsRow } from '@/components/SettingsRow';
import { ArchiveIcon } from '@/components/icons/ArchiveIcon';
import { f1Assets } from '@/constants/f1Assets';
import { colors } from '@/constants/theme';

export default function SettingsScreen() {
  return (
    <GreenSheetScreen title="我的">
      <View style={styles.content}>
        <View style={styles.menuCard}>
          <View style={styles.avatarRow}>
            <SettingsRow
              backgroundColor={colors.pinkSoft}
              icon={f1Assets.settingsAvatar}
              iconColor="#E765B8"
              label="个人资料"
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
            backgroundColor={colors.orangeSoft}
            iconColor={colors.orange}
            iconElement={<ArchiveIcon color={colors.orange} />}
            label="本地存档"
            onPress={() => router.push('/settings/archive')}
          />
          <SettingsRow
            backgroundColor={colors.blueSoft}
            icon={f1Assets.settingsAi}
            iconColor={colors.blue}
            label="AI 设置"
            onPress={() => router.push('/settings/ai')}
          />
          <SettingsRow
            backgroundColor={colors.graySoft}
            icon={f1Assets.settingsAbout}
            iconColor="#7C8798"
            label="关于"
            last
          />
        </View>
      </View>
    </GreenSheetScreen>
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
    paddingHorizontal: 0,
  },
  menuCard: {
    marginTop: 8,
    paddingHorizontal: 26,
    paddingVertical: 10,
  },
});
