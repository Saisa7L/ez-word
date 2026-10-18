import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

const OUTLINE_DIRECTIONS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const;

type OutlinedTextProps = {
  children: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  fillColor: string;
  numberOfLines?: number;
  outlineColor: string;
  outlineWidth: number;
  style?: StyleProp<TextStyle>;
};

export function OutlinedText({
  children,
  containerStyle,
  fillColor,
  numberOfLines,
  outlineColor,
  outlineWidth,
  style,
}: OutlinedTextProps) {
  const accessibilityLabel =
    typeof children === 'string' || typeof children === 'number'
      ? String(children)
      : undefined;
  const hasOutline = outlineWidth > 0;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
      accessible={accessibilityLabel !== undefined}
      pointerEvents="none"
      style={containerStyle}
    >
      <Text
        accessible={false}
        numberOfLines={numberOfLines}
        style={[style, styles.measurement]}
      >
        {children}
      </Text>

      {hasOutline
        ? OUTLINE_DIRECTIONS.map(([x, y]) => (
            <Text
              accessible={false}
              key={`${x}-${y}`}
              numberOfLines={numberOfLines}
              style={[
                style,
                styles.absoluteLayer,
                {
                  color: outlineColor,
                  transform: [
                    { translateX: x * outlineWidth },
                    { translateY: y * outlineWidth },
                  ],
                },
              ]}
            >
              {children}
            </Text>
          ))
        : null}

      <Text
        accessible={false}
        numberOfLines={numberOfLines}
        style={[style, styles.absoluteLayer, { color: fillColor }]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  absoluteLayer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  measurement: {
    color: 'transparent',
  },
});
