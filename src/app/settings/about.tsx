import Constants from 'expo-constants';
import { router } from 'expo-router';
import {
  ExternalLink,
  GitBranch,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Tag,
  UserRound,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
import {
  useAppTheme,
  useThemedStyles,
} from '@/features/theme/ThemeProvider';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const BUILD_NUMBER = Constants.expoConfig?.android?.versionCode ?? 1;

type AboutInfoRowProps = {
  icon: ReactNode;
  iconBackground: string;
  label: string;
  last?: boolean;
  onPress?: () => void;
  value: string;
};

function AboutInfoRow({
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
        <Text
          ellipsizeMode="middle"
          numberOfLines={1}
          style={styles.rowValue}
        >
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
        accessibilityRole="link"
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

  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      {content}
    </View>
  );
}

export default function AboutScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { showNotice } = useAppFeedback();

  async function openLink(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      showNotice('无法打开链接', '请稍后重试或手动复制链接');
    }
  }

  return (
    <GreenSheetScreen
      onBack={() => router.back()}
      title="关于"
    >
      <View style={styles.content}>
        <View style={styles.brand}>
          <View style={styles.appIconBox}>
            <Image
              resizeMode="contain"
              source={require('../../../assets/icon.png')}
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
            icon={
              <RefreshCw
                color={colors.accentText}
                size={21}
                strokeWidth={2.2}
              />
            }
            iconBackground={colors.graySoft}
            label="检查更新"
            value="暂未开放"
          />
          <AboutInfoRow
            icon={<GitBranch color={colors.blue} size={21} strokeWidth={2.2} />}
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
            icon={<UserRound color={colors.slate} size={21} strokeWidth={2.2} />}
            iconBackground={colors.graySoft}
            label="软件制作者"
            last
            value={APP_AUTHOR}
          />
        </View>

        <View style={styles.privacy}>
          <View style={styles.privacyHeader}>
            <ShieldCheck color={colors.accentText} size={23} strokeWidth={2.2} />
            <Text style={styles.privacyTitle}>数据与隐私</Text>
          </View>
          <Text style={styles.privacyText}>
            本版本不连接自建服务器。词库、学习记录、错题本、个人资料和设置保存在本机。
          </Text>
          <Text style={styles.privacyText}>
            使用 DeepSeek 生成或测试例句时，相关单词内容会发送到 DeepSeek；API Key
            保存在本机安全存储中。
          </Text>
        </View>
      </View>
    </GreenSheetScreen>
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
