import type { RefObject } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { OutlinedText } from '@/components/OutlinedText';
import {
  BookStatIcon,
  CalendarStatIcon,
} from '@/components/icons/ProfileStatIcons';
import { PROFILE_USERNAME_MAX_LENGTH } from '@/constants/profile';
import type { ThemeColors } from '@/constants/theme';
import { uiAssets } from '@/constants/uiAssets';
import { useThemedStyles } from '@/features/theme/ThemeProvider';

import { splitDisplayName } from './profileUtils';

type ProfileStats = {
  studyDays: number;
  totalLearned: number;
} | null;

type ProfileCardProps = {
  avatarData: string;
  backgroundData: string;
  bio: string;
  cardContentColor: string;
  cardRef: RefObject<View | null>;
  displayName: string;
  isCapturing: boolean;
  onAvatarPress: () => void;
  onBioPress: () => void;
  onCameraPress: () => void;
  onNamePress: () => void;
  stats: ProfileStats;
  textStrokeColor: string;
  textStrokeWidth: number;
};

export function ProfileCard({
  avatarData,
  backgroundData,
  bio,
  cardContentColor,
  cardRef,
  displayName,
  isCapturing,
  onAvatarPress,
  onBioPress,
  onCameraPress,
  onNamePress,
  stats,
  textStrokeColor,
  textStrokeWidth,
}: ProfileCardProps) {
  const styles = useThemedStyles(createStyles);
  const avatarSource = avatarData ? { uri: avatarData } : uiAssets.avatars.user;
  const displayNameLines = splitDisplayName(displayName);

  return (
    <View collapsable={false} ref={cardRef} style={styles.card}>
      {backgroundData ? (
        <Image
          resizeMode="cover"
          source={{ uri: backgroundData }}
          style={styles.backgroundImage}
        />
      ) : null}
      {!isCapturing ? (
        <Pressable
          accessibilityLabel="名片图片操作"
          accessibilityRole="button"
          onPress={onCameraPress}
          style={({ pressed }) => [
            styles.cameraButton,
            pressed && styles.pressed,
          ]}
        >
          <Image
            source={uiAssets.settings.camera}
            style={[styles.cameraIcon, { tintColor: cardContentColor }]}
          />
        </Pressable>
      ) : null}

      <View style={styles.profileHeader}>
        <Pressable
          accessibilityLabel="更换头像"
          accessibilityRole="button"
          onPress={onAvatarPress}
          style={({ pressed }) => [
            styles.avatarCircle,
            pressed && styles.pressed,
          ]}
        >
          <Image source={avatarSource} style={styles.avatar} />
        </Pressable>

        <Pressable
          accessibilityLabel="修改用户名"
          accessibilityRole="button"
          onPress={onNamePress}
          style={({ pressed }) => [styles.nameBlock, pressed && styles.pressed]}
        >
          <View style={styles.nameLines}>
            {displayNameLines.map((line, index) => (
              <OutlinedText
                fillColor={cardContentColor}
                key={`${line}-${index}`}
                outlineColor={textStrokeColor}
                outlineWidth={textStrokeWidth}
                style={styles.name}
              >
                {line}
              </OutlinedText>
            ))}
          </View>
          <View
            style={[
              styles.nameUnderline,
              { backgroundColor: cardContentColor },
            ]}
          />
          <OutlinedText
            containerStyle={styles.nameCounterContainer}
            fillColor={cardContentColor}
            outlineColor={textStrokeColor}
            outlineWidth={textStrokeWidth}
            style={styles.nameCounter}
          >
            {displayName.length}/{PROFILE_USERNAME_MAX_LENGTH}
          </OutlinedText>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <CalendarStatIcon color={cardContentColor} size={44} />
          <OutlinedText
            containerStyle={styles.statLabelContainer}
            fillColor={cardContentColor}
            outlineColor={textStrokeColor}
            outlineWidth={textStrokeWidth}
            style={styles.statLabel}
          >
            已学习天数
          </OutlinedText>
          <OutlinedText
            containerStyle={styles.statValueContainer}
            fillColor={cardContentColor}
            outlineColor={textStrokeColor}
            outlineWidth={textStrokeWidth}
            style={styles.statValue}
          >
            {stats?.studyDays ?? 0}
          </OutlinedText>
        </View>
        <View
          style={[styles.statDivider, { backgroundColor: cardContentColor }]}
        />
        <View style={styles.statItem}>
          <BookStatIcon color={cardContentColor} size={48} />
          <OutlinedText
            containerStyle={styles.statLabelContainer}
            fillColor={cardContentColor}
            outlineColor={textStrokeColor}
            outlineWidth={textStrokeWidth}
            style={styles.statLabel}
          >
            已学习单词总数
          </OutlinedText>
          <OutlinedText
            containerStyle={styles.statValueContainer}
            fillColor={cardContentColor}
            outlineColor={textStrokeColor}
            outlineWidth={textStrokeWidth}
            style={styles.statValue}
          >
            {stats?.totalLearned ?? 0}
          </OutlinedText>
        </View>
      </View>

      <Pressable
        accessibilityLabel="修改个人简介"
        accessibilityRole="button"
        onPress={onBioPress}
        style={({ pressed }) => [styles.bioBlock, pressed && styles.pressed]}
      >
        <OutlinedText
          fillColor={cardContentColor}
          outlineColor={textStrokeColor}
          outlineWidth={textStrokeWidth}
          style={styles.bioTitle}
        >
          个人简介
        </OutlinedText>
        <OutlinedText
          containerStyle={styles.bioTextContainer}
          fillColor={cardContentColor}
          outlineColor={textStrokeColor}
          outlineWidth={textStrokeWidth}
          style={styles.bioText}
        >
          {bio || '暂无个人简介'}
        </OutlinedText>
      </Pressable>
    </View>
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
      backgroundColor: colors.surface,
      borderColor: '#000000',
      borderRadius: 49,
      borderWidth: 1,
      height: 98,
      justifyContent: 'center',
      overflow: 'hidden',
      width: 98,
    },
    backgroundImage: {
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    bioBlock: {
      marginTop: 30,
    },
    bioText: {
      fontSize: 17,
      lineHeight: 26,
    },
    bioTextContainer: {
      alignSelf: 'stretch',
      marginTop: 9,
    },
    bioTitle: {
      fontSize: 19,
      fontWeight: '700',
    },
    cameraButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      position: 'absolute',
      right: 14,
      top: 14,
      width: 50,
      zIndex: 2,
    },
    cameraIcon: {
      height: 32,
      width: 32,
    },
    card: {
      backgroundColor: 'transparent',
      borderRadius: 24,
      minHeight: 520,
      overflow: 'hidden',
      paddingBottom: 26,
      paddingHorizontal: 22,
      paddingTop: 26,
    },
    name: {
      fontSize: 20,
      fontWeight: '700',
      lineHeight: 27,
    },
    nameBlock: {
      flex: 1,
      marginLeft: 18,
    },
    nameCounter: {
      fontSize: 12,
      textAlign: 'right',
    },
    nameCounterContainer: {
      alignItems: 'flex-end',
      marginTop: 5,
    },
    nameLines: {
      alignItems: 'flex-start',
      gap: 2,
    },
    nameUnderline: {
      height: 1,
      marginTop: 9,
      opacity: 0.55,
    },
    pressed: {
      opacity: 0.68,
    },
    profileHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: 34,
    },
    statDivider: {
      height: 80,
      opacity: 0.3,
      width: 1,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statLabel: {
      fontSize: 14,
    },
    statLabelContainer: {
      alignItems: 'center',
      marginTop: 7,
    },
    statValue: {
      fontSize: 34,
      fontWeight: '800',
    },
    statValueContainer: {
      alignItems: 'center',
      marginTop: 7,
    },
    statsRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: 34,
    },
  });
