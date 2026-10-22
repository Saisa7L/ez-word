import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  ExternalLink,
  GitBranch,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Tag,
  UserRound,
} from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ActionOptionModal } from '@/components/ActionOptionModal';
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
import {
  compareVersions,
  type UpdateRelease,
} from '@/features/updates/updateManifest';
import { useAppTheme, useThemedStyles } from '@/features/theme/ThemeProvider';
import { useSettingsBackNavigation } from '@/hooks/useSettingsBackNavigation';
import {
  downloadUpdate,
  fetchLatestRelease,
  installUpdate,
} from '@/services/updateService';
import { formatBytes } from '@/utils/formatBytes';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const BUILD_NUMBER = Constants.expoConfig?.android?.versionCode ?? 1;

type UpdateDialogState =
  | { kind: 'available'; release: UpdateRelease }
  | { kind: 'downloading'; progress: number; release: UpdateRelease }
  | { kind: 'error'; message: string; release: UpdateRelease };

type AboutInfoRowProps = {
  accessibilityRole?: 'button' | 'link';
  icon: ReactNode;
  iconBackground: string;
  label: string;
  last?: boolean;
  onPress?: () => void;
  value: string;
};

function AboutInfoRow({
  accessibilityRole = 'link',
  icon,
  iconBackground,
  label,
  last = false,
  onPress,
  value,
}: AboutInfoRowProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const content = (
    <>
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, { backgroundColor: iconBackground }]}>
          {icon}
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowValueBox}>
        <Text ellipsizeMode="middle" numberOfLines={1} style={styles.rowValue}>
          {value}
        </Text>
        {onPress ? (
          <ExternalLink color={colors.textMuted} size={16} strokeWidth={2} />
        ) : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole={accessibilityRole}
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          !last && styles.rowBorder,
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.row, !last && styles.rowBorder]}>{content}</View>;
}

export default function AboutScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { showNotice } = useAppFeedback();
  const handleBack = useSettingsBackNavigation();
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateDialog, setUpdateDialog] = useState<UpdateDialogState | null>(
    null,
  );
  const downloadAbortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      downloadAbortRef.current?.abort();
    },
    [],
  );

  async function openLink(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      showNotice('无法打开链接', '请稍后重试或手动复制链接');
    }
  }

  async function handleCheckUpdate() {
    if (isCheckingUpdate) {
      return;
    }

    setIsCheckingUpdate(true);
    try {
      const release = await fetchLatestRelease();
      if (compareVersions(release.version, APP_VERSION) > 0) {
        setUpdateDialog({ kind: 'available', release });
      } else {
        showNotice(
          '已是最新版本',
          `当前版本 ${APP_VERSION} 已是 GitHub 最新正式版。`,
        );
      }
    } catch {
      showNotice('检查更新失败', '请自行前往 GitHub Releases 检查最新版本。');
    } finally {
      setIsCheckingUpdate(false);
    }
  }

  async function startUpdate(release: UpdateRelease) {
    const controller = new AbortController();
    downloadAbortRef.current?.abort();
    downloadAbortRef.current = controller;
    let lastProgress = -1;

    setUpdateDialog({ kind: 'downloading', progress: 0, release });

    try {
      const file = await downloadUpdate(release, {
        onProgress: (progress) => {
          if (progress === lastProgress) {
            return;
          }
          lastProgress = progress;
          setUpdateDialog({ kind: 'downloading', progress, release });
        },
        signal: controller.signal,
      });
      setUpdateDialog(null);
      if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
        showNotice(
          '下载和校验完成',
          'Expo Go 无法验收 Android 系统安装器，请使用正式 APK 验证最后一步。',
        );
        return;
      }
      await installUpdate(file);
    } catch (error) {
      if (controller.signal.aborted) {
        setUpdateDialog(null);
        return;
      }

      setUpdateDialog({
        kind: 'error',
        message:
          error instanceof Error
            ? error.message
            : '下载或安装更新时发生未知错误',
        release,
      });
    } finally {
      if (downloadAbortRef.current === controller) {
        downloadAbortRef.current = null;
      }
    }
  }

  function closeUpdateDialog() {
    if (updateDialog?.kind === 'downloading') {
      downloadAbortRef.current?.abort();
    }
    setUpdateDialog(null);
  }

  const releaseNotes =
    updateDialog && updateDialog.kind !== 'error'
      ? updateDialog.release.notes.replace(/\s+/g, ' ').trim().slice(0, 240)
      : '';
  const updateDialogTitle =
    updateDialog?.kind === 'available'
      ? `发现新版本 v${updateDialog.release.version}`
      : updateDialog?.kind === 'downloading'
        ? '正在下载更新'
        : updateDialog?.kind === 'error'
          ? '更新失败'
          : '';
  const updateDialogMessage =
    updateDialog?.kind === 'available'
      ? `${releaseNotes || '发现可安装的新版本。'}\n\n安装包 ${formatBytes(updateDialog.release.size ?? undefined)}。下载完成后会打开 Android 系统安装器，请确认覆盖安装。`
      : updateDialog?.kind === 'downloading'
        ? `正在下载 v${updateDialog.release.version}（${updateDialog.progress}%）。请保持网络连接。`
        : updateDialog?.kind === 'error'
          ? `${updateDialog.message}\n\n请确认已允许本应用安装未知来源应用，或稍后重试。`
          : undefined;

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
                      void handleCheckUpdate();
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

      <ActionOptionModal
        message={updateDialogMessage}
        onClose={closeUpdateDialog}
        options={
          updateDialog?.kind === 'available'
            ? [
                {
                  label: '下载并安装',
                  onPress: () => {
                    void startUpdate(updateDialog.release);
                  },
                  tone: 'primary',
                },
                {
                  label: '稍后',
                  onPress: () => {},
                },
              ]
            : updateDialog?.kind === 'downloading'
              ? [
                  {
                    label: '取消下载',
                    onPress: () => {
                      downloadAbortRef.current?.abort();
                    },
                    tone: 'danger',
                  },
                ]
              : updateDialog?.kind === 'error'
                ? [
                    {
                      label: '重试',
                      onPress: () => {
                        void startUpdate(updateDialog.release);
                      },
                      tone: 'primary',
                    },
                    {
                      label: '关闭',
                      onPress: () => {},
                    },
                  ]
                : []
        }
        title={updateDialogTitle}
        visible={updateDialog !== null}
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
    pressed: {
      opacity: 0.65,
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
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 72,
    },
    rowBorder: {
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    rowIcon: {
      alignItems: 'center',
      borderRadius: 12,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    rowLabel: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '600',
      marginLeft: 13,
    },
    rowLeft: {
      alignItems: 'center',
      flexDirection: 'row',
      flexShrink: 1,
    },
    rowValue: {
      color: colors.textSecondary,
      flexShrink: 1,
      fontSize: 13,
      textAlign: 'right',
    },
    rowValueBox: {
      alignItems: 'center',
      flexDirection: 'row',
      flexShrink: 1,
      gap: 6,
      justifyContent: 'flex-end',
      marginLeft: 12,
      maxWidth: '58%',
    },
  });
