import { Gauge, Play, RotateCcw, Square } from 'lucide-react-native';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from 'react-native';

import { radii, shadow, type ThemeColors } from '@/constants/theme';
import { formatListeningRate } from '@/features/daily-task/taskPresentation';
import { useAppTheme, useThemedStyles } from '@/features/theme/ThemeProvider';

type ListeningPlayerCardProps = {
  currentRead: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onRewind: () => void;
  onSpeedChange: () => void;
  progress: number;
  speed: number;
  totalWords: number;
};

export function ListeningPlayerCard({
  currentRead,
  isPlaying,
  onPlayPause,
  onRewind,
  onSpeedChange,
  progress,
  speed,
  totalWords,
}: ListeningPlayerCardProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const currentWordIndex = Math.min(
    totalWords,
    Math.floor(currentRead / 2) + 1,
  );

  return (
    <View style={styles.playerCard}>
      <View style={styles.playerControls}>
        <Pressable
          accessibilityLabel="回退一个单词"
          accessibilityRole="button"
          onPress={onRewind}
          style={({ pressed }) => [
            styles.roundButton,
            pressed && styles.pressed,
          ]}
        >
          <RotateCcw color={colors.accentText} size={28} strokeWidth={2.2} />
        </Pressable>
        <Pressable
          accessibilityLabel={isPlaying ? '停止' : '播放'}
          accessibilityRole="button"
          onPress={onPlayPause}
          style={({ pressed }) => [
            styles.playButton,
            pressed && styles.pressed,
          ]}
        >
          {isPlaying ? (
            <Square
              color={colors.accentText}
              fill={colors.accentText}
              size={32}
            />
          ) : (
            <Play
              color={colors.accentText}
              fill={colors.accentText}
              size={44}
            />
          )}
        </Pressable>
        <Pressable
          accessibilityLabel="切换倍速"
          accessibilityRole="button"
          onPress={onSpeedChange}
          style={({ pressed }) => [
            styles.roundButton,
            pressed && styles.pressed,
          ]}
        >
          <Gauge color={colors.accentText} size={25} strokeWidth={2.2} />
          <Text style={styles.speedText}>
            {formatListeningRate(speed, true)}
          </Text>
        </Pressable>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress}%` as DimensionValue },
          ]}
        />
      </View>
      <Text style={styles.positionText}>
        {currentWordIndex}/{totalWords}
      </Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    playButton: {
      alignItems: 'center',
      backgroundColor: colors.graySoft,
      borderRadius: 55,
      height: 110,
      justifyContent: 'center',
      width: 110,
    },
    playerCard: {
      ...shadow,
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      marginBottom: 20,
      marginHorizontal: 18,
      padding: 22,
    },
    playerControls: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    positionText: {
      color: colors.textSecondary,
      fontSize: 20,
      fontWeight: '600',
      marginTop: 12,
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.7,
    },
    progressFill: {
      backgroundColor: colors.accentText,
      borderRadius: 5,
      height: 10,
    },
    progressTrack: {
      backgroundColor: colors.border,
      borderRadius: 5,
      height: 10,
      marginTop: 24,
      overflow: 'hidden',
    },
    roundButton: {
      alignItems: 'center',
      backgroundColor: colors.mint,
      borderRadius: 42,
      height: 84,
      justifyContent: 'center',
      width: 84,
    },
    speedText: {
      color: colors.accentText,
      fontSize: 14,
      fontWeight: '700',
      marginTop: 2,
    },
  });
