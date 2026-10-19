import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/features/theme/ThemeProvider';

type ScrollIndicatorProps = {
  contentHeight: number;
  scrollY: number;
  viewportHeight: number;
};

export function ScrollIndicator({
  contentHeight,
  scrollY,
  viewportHeight,
}: ScrollIndicatorProps) {
  const styles = useThemedStyles(createStyles);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (contentHeight <= viewportHeight || scrollY <= 0) {
      return;
    }

    Animated.timing(opacity, {
      duration: 120,
      toValue: 1,
      useNativeDriver: true,
    }).start();
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    hideTimer.current = setTimeout(() => {
      Animated.timing(opacity, {
        duration: 220,
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }, 800);

    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, [contentHeight, opacity, scrollY, viewportHeight]);

  if (contentHeight <= viewportHeight || viewportHeight <= 0) {
    return null;
  }

  const trackHeight = Math.max(0, viewportHeight - 16);
  const thumbHeight = Math.max(
    36,
    (viewportHeight / contentHeight) * trackHeight,
  );
  const scrollRange = Math.max(1, contentHeight - viewportHeight);
  const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
  const thumbTop = Math.min(maxThumbTop, (scrollY / scrollRange) * maxThumbTop);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.track, { opacity }]}
    >
      <Animated.View style={[styles.thumb, { height: thumbHeight, top: thumbTop }]} />
    </Animated.View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  thumb: {
    backgroundColor: colors.accentText,
    borderRadius: 2,
    position: 'absolute',
    right: 0,
    width: 4,
  },
  track: {
    backgroundColor: colors.border,
    borderRadius: 2,
    bottom: 8,
    position: 'absolute',
    right: 7,
    top: 8,
    width: 4,
  },
});
