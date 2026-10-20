import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Palette } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { GreenSheetScreen } from '@/components/GreenSheetScreen';
import { SettingsRow } from '@/components/SettingsRow';
import { ArchiveIcon } from '@/components/icons/ArchiveIcon';
import {
  type ThemeColors,
} from '@/constants/theme';
import { uiAssets } from '@/constants/uiAssets';
import { getUserProfile } from '@/database/userProfileRepository';
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';
import { pushOnce } from '@/utils/navigationActions';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [avatarData, setAvatarData] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getUserProfile(db)
        .then((profile) => {
          if (active) {
            setAvatarData(profile.avatarData);
          }
        })
        .catch(() => {
          if (active) {
            setAvatarData('');
          }
        });

      return () => {
        active = false;
      };
    }, [db]),
  );

  const avatarSource = avatarData
    ? { uri: avatarData }
    : uiAssets.avatars.user;

  return (
    <GreenSheetScreen title="我的">
      <View style={styles.content}>
        <View style={styles.menuCard}>
          <Pressable
            accessibilityRole="button"
            onPress={() => pushOnce('/settings/profile')}
            style={({ pressed }) => [
              styles.avatarRow,
              pressed && styles.pressed,
            ]}
          >
            <SettingsRow
              backgroundColor={colors.pinkSoft}
              icon={uiAssets.settings.camera}
              iconColor={colors.pink}
              label="个人资料"
              hideChevron
              style={styles.avatarRowContent}
            />
            <View style={styles.avatarCircle}>
              <Image
                resizeMode="cover"
                source={avatarSource}
                style={styles.avatar}
              />
            </View>
          </Pressable>

          <SettingsRow
            backgroundColor={colors.orangeSoft}
            icon={uiAssets.settings.dailyTask}
            iconColor={colors.orange}
            label="通用设置"
            onPress={() => pushOnce('/settings/daily-task')}
          />
          <SettingsRow
            backgroundColor={colors.blueSoft}
            iconColor={colors.blue}
            iconElement={<Palette color={colors.blue} size={25} strokeWidth={2.2} />}
            label="主题外观"
            onPress={() => pushOnce('/settings/theme')}
          />
          <SettingsRow
            backgroundColor={colors.graySoft}
            icon={uiAssets.settings.import}
            iconColor={colors.accentText}
            label="导入单词"
            onPress={() => pushOnce('/settings/import')}
          />
          <SettingsRow
            backgroundColor={colors.orangeSoft}
            iconColor={colors.orange}
            iconElement={<ArchiveIcon color={colors.orange} />}
            label="本地存档"
            onPress={() => pushOnce('/settings/archive')}
          />
          <SettingsRow
            backgroundColor={colors.blueSoft}
            icon={uiAssets.settings.ai}
            iconColor={colors.blue}
            label="AI 设置"
            onPress={() => pushOnce('/settings/ai')}
          />
          <SettingsRow
            backgroundColor={colors.graySoft}
            icon={uiAssets.settings.about}
            iconColor={colors.slate}
            label="关于"
            last
            onPress={() => pushOnce('/settings/about')}
          />
        </View>
      </View>
    </GreenSheetScreen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  avatar: {
    height: '100%',
    width: '100%',
  },
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: colors.graySoft,
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
  pressed: {
    opacity: 0.68,
  },
});
