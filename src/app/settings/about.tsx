import Constants from 'expo-constants';
import {
  GitBranch,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Tag,
  UserRound,
} from 'lucide-react-native';
import { Linking, Image, StyleSheet, Text, View } from 'react-native';

import { useAppFeedback } from '@/components/AppFeedbackProvider';
import { GreenSheetScreen } from '@/components/GreenSheetScreen';
import {
  APP_AUTHOR,
  APP_DESCRIPTION,
  APP_ENGLISH_NAME,
  APP_NAME,
  GITHUB_ISSUES_URL,
  GITHUB_REPOSITORY_URL,
  IS_GITHUB_CONFIGURED,
} from '@/constants/appInfo';
import { radii, type ThemeColors } from '@/constants/theme';
import { uiAssets } from '@/constants/uiAssets';
import { AboutInfoRow } from '@/features/settings/AboutInfoRow';
import { AboutUpdateDialog } from '@/features/settings/AboutUpdateDialog';
import { useAppTheme, useThemedStyles } from '@/features/theme/ThemeProvider';
import { useAppUpdate } from '@/features/updates/useAppUpdate';
import { useSettingsBackNavigation } from '@/hooks/useSettingsBackNavigation';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const BUILD_NUMBER = Constants.expoConfig?.android?.versionCode ?? 1;

export default function AboutScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { showNotice } = useAppFeedback();
  const handleBack = useSettingsBackNavigation();
  const {
    cancelDownload,
    checkUpdate,
    closeDialog,
    dialog,
    isCheckingUpdate,
    startUpdate,
  } = useAppUpdate({ currentVersion: APP_VERSION, notify: showNotice });

  async function openLink(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      showNotice('无法打开链接', '请稍后重试或手动复制链接');
    }
  }

  return (
    <>
      <GreenSheetScreen onBack={handleBack} title="关于">
        <View style={styles.content}>
          <View style={styles.brand}>
            <View style={styles.appIconBox}>
              <Image
                resizeMode="contain"
                source={uiAssets.app.icon}
                style={styles.appIcon}
              />
            </View>
            <Text style={styles.appName}>{APP_NAME}</Text>
            <Text style={styles.englishName}>{APP_ENGLISH_NAME}</Text>
            <Text style={styles.description}>{APP_DESCRIPTION}</Text>
          </View>

          <View style={styles.infoList}>
            <AboutInfoRow
              icon={<Tag color={colors.pink} size={21} strokeWidth={2.2} />}
              iconBackground={colors.pinkSoft}
              label="软件版本"
              value={`${APP_VERSION} (Build ${BUILD_NUMBER})`}
            />
            <AboutInfoRow
              accessibilityRole="button"
              icon={
                <RefreshCw
                  color={colors.accentText}
                  size={21}
                  strokeWidth={2.2}
                />
              }
              iconBackground={colors.graySoft}
              label="检查更新"
              onPress={
                isCheckingUpdate
                  ? undefined
                  : () => {
                      void checkUpdate();
                    }
              }
              value={isCheckingUpdate ? '正在检查…' : '点击检查'}
            />
            <AboutInfoRow
              icon={
                <GitBranch color={colors.blue} size={21} strokeWidth={2.2} />
              }
              iconBackground={colors.blueSoft}
              label="GitHub"
              onPress={
                IS_GITHUB_CONFIGURED
                  ? () => {
                      void openLink(GITHUB_REPOSITORY_URL);
                    }
                  : undefined
              }
              value={GITHUB_REPOSITORY_URL}
            />
            <AboutInfoRow
              icon={
                <MessageSquare
                  color={colors.orange}
                  size={21}
                  strokeWidth={2.2}
                />
              }
              iconBackground={colors.orangeSoft}
              label="问题反馈"
              onPress={
                IS_GITHUB_CONFIGURED
                  ? () => {
                      void openLink(GITHUB_ISSUES_URL);
                    }
                  : undefined
              }
              value={GITHUB_ISSUES_URL}
            />
            <AboutInfoRow
              icon={
                <UserRound color={colors.slate} size={21} strokeWidth={2.2} />
              }
              iconBackground={colors.graySoft}
              label="软件制作者"
              last
              value={APP_AUTHOR}
            />
          </View>

          <View style={styles.privacy}>
            <View style={styles.privacyHeader}>
              <ShieldCheck
                color={colors.accentText}
                size={23}
                strokeWidth={2.2}
              />
              <Text style={styles.privacyTitle}>数据与隐私</Text>
            </View>
            <Text style={styles.privacyText}>
              本版本不连接自建服务器。词库、学习记录、错题本、个人资料和设置保存在本机。
            </Text>
            <Text style={styles.privacyText}>
              使用 DeepSeek 生成或测试例句时，相关单词内容会发送到 DeepSeek；API
              Key 保存在本机安全存储中。
            </Text>
          </View>
        </View>
      </GreenSheetScreen>

      <AboutUpdateDialog
        dialog={dialog}
        onCancelDownload={cancelDownload}
        onClose={closeDialog}
        onStartUpdate={startUpdate}
      />
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    appIcon: {
      height: 68,
      width: 68,
    },
    appIconBox: {
      alignItems: 'center',
      backgroundColor: colors.graySoft,
      borderRadius: 30,
      height: 92,
      justifyContent: 'center',
      overflow: 'hidden',
      width: 92,
    },
    appName: {
      color: colors.text,
      fontSize: 32,
      fontWeight: '800',
      marginTop: 18,
    },
    brand: {
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    content: {
      paddingHorizontal: 22,
      paddingTop: 16,
    },
    description: {
      color: colors.textSecondary,
      fontSize: 16,
      lineHeight: 24,
      marginTop: 10,
      textAlign: 'center',
    },
    englishName: {
      color: colors.accentText,
      fontSize: 18,
      fontWeight: '700',
      marginTop: 4,
    },
    infoList: {
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      marginTop: 30,
    },
    privacy: {
      backgroundColor: colors.graySoft,
      borderRadius: radii.md,
      marginTop: 24,
      padding: 18,
    },
    privacyHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 9,
    },
    privacyText: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 22,
      marginTop: 12,
    },
    privacyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
  });
