import {
  useId,
  useState,
} from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/features/theme/ThemeProvider';

type HsvColor = {
  hue: number;
  saturation: number;
  value: number;
};

type ColorPaletteProps = {
  onChange: (color: string) => void;
  onInteractionChange?: (active: boolean) => void;
  value: string;
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function roundComponent(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function getCursorPosition(
  ratio: number,
  size: number,
  radius: number,
): number {
  if (size <= radius * 2) {
    return size / 2;
  }
  return clamp(ratio * size, radius, size - radius);
}

function parseColorInput(value: string): string | null {
  const trimmed = value.trim();
  const hex = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (/^#[0-9a-f]{6}$/i.test(hex)) {
    return hex.toUpperCase();
  }

  const rgbMatch = trimmed.match(
    /^(\d{1,3})\s*[,，\s]\s*(\d{1,3})\s*[,，\s]\s*(\d{1,3})$/,
  );
  if (!rgbMatch) {
    return null;
  }

  const channels = rgbMatch.slice(1).map((channel) =>
    Math.min(255, Number(channel)),
  );
  return `#${channels
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function normalizeHex(value: string): string {
  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return value.toUpperCase();
  }
  return '#000000';
}

function hexToHsv(value: string): HsvColor {
  const hex = normalizeHex(value);
  const red = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const green = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;

  let hue = 0;
  if (delta > 0) {
    if (maximum === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (maximum === green) {
      hue = 60 * ((blue - red) / delta + 2);
    } else {
      hue = 60 * ((red - green) / delta + 4);
    }
  }

  return {
    hue: hue < 0 ? hue + 360 : hue,
    saturation: maximum === 0 ? 0 : delta / maximum,
    value: maximum,
  };
}

function hsvToHex({
  hue,
  saturation,
  value,
}: HsvColor): string {
  const chroma = value * saturation;
  const sector = ((hue % 360) + 360) % 360 / 60;
  const second = chroma * (1 - Math.abs((sector % 2) - 1));

  let red = 0;
  let green = 0;
  let blue = 0;

  if (sector < 1) {
    red = chroma;
    green = second;
  } else if (sector < 2) {
    red = second;
    green = chroma;
  } else if (sector < 3) {
    green = chroma;
    blue = second;
  } else if (sector < 4) {
    green = second;
    blue = chroma;
  } else if (sector < 5) {
    red = second;
    blue = chroma;
  } else {
    red = chroma;
    blue = second;
  }

  const offset = value - chroma;
  return `#${[red, green, blue]
    .map((channel) =>
      Math.round((channel + offset) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`;
}

export function ColorPalette({
  onChange,
  onInteractionChange,
  value,
}: ColorPaletteProps) {
  const styles = useThemedStyles(createStyles);
  const gradientId = useId().replace(/:/g, '');
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const [colorInput, setColorInput] = useState(() => hsvToHex(hsv));
  const [squareLayout, setSquareLayout] = useState({
    height: 0,
    width: 0,
  });
  const [hueLayout, setHueLayout] = useState({
    width: 0,
  });

  function handleColorInput(value: string) {
    setColorInput(value);
    const parsedColor = parseColorInput(value);
    if (!parsedColor) {
      return;
    }

    const next = hexToHsv(parsedColor);
    setHsv(next);
    onChange(parsedColor);
  }

  function handleSquareTouch(event: GestureResponderEvent) {
    const { locationX, locationY } = event.nativeEvent ?? {};
    if (
      !Number.isFinite(locationX) ||
      !Number.isFinite(locationY) ||
      squareLayout.width === 0 ||
      squareLayout.height === 0
    ) {
      return;
    }

    const saturation = roundComponent(
      clamp(locationX / squareLayout.width, 0, 1),
    );
    const value = roundComponent(
      1 - clamp(locationY / squareLayout.height, 0, 1),
    );

    if (hsv.saturation === saturation && hsv.value === value) {
      return;
    }

    const next = { ...hsv, saturation, value };
    setHsv(next);
    setColorInput(hsvToHex(next));
    onChange(hsvToHex(next));
  }

  function handleHueTouch(event: GestureResponderEvent) {
    const { locationX } = event.nativeEvent ?? {};
    if (!Number.isFinite(locationX) || hueLayout.width === 0) {
      return;
    }

    const hue = roundComponent(
      clamp(locationX / hueLayout.width, 0, 1) * 359.9,
    );

    if (hsv.hue === hue) {
      return;
    }

    const next = { ...hsv, hue };
    setHsv(next);
    setColorInput(hsvToHex(next));
    onChange(hsvToHex(next));
  }

  const currentColor = hsvToHex(hsv);
  const hueColor = hsvToHex({ hue: hsv.hue, saturation: 1, value: 1 });
  const saturationGradientId = `${gradientId}-saturation`;
  const valueGradientId = `${gradientId}-value`;
  const hueGradientId = `${gradientId}-hue`;

  function handleSquareLayout(event: LayoutChangeEvent) {
    const { height, width } = event.nativeEvent.layout;
    setSquareLayout({ height, width });
  }

  function handleHueLayout(event: LayoutChangeEvent) {
    const { width } = event.nativeEvent.layout;
    setHueLayout({ width });
  }

  return (
    <View>
      <View style={styles.previewRow}>
        <View
          style={[
            styles.previewSwatch,
            { backgroundColor: currentColor },
          ]}
        />
        <TextInput
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={11}
          onBlur={() => setColorInput(currentColor)}
          onChangeText={handleColorInput}
          onSubmitEditing={() => setColorInput(currentColor)}
          selectTextOnFocus
          style={styles.previewInput}
          value={colorInput}
        />
      </View>

      <View
        accessibilityLabel="颜色饱和度与明度调色盘"
        onMoveShouldSetResponderCapture={() => true}
        onLayout={handleSquareLayout}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          onInteractionChange?.(true);
          handleSquareTouch(event);
        }}
        onResponderMove={handleSquareTouch}
        onResponderRelease={() => onInteractionChange?.(false)}
        onResponderTerminate={() => onInteractionChange?.(false)}
        onResponderTerminationRequest={() => false}
        onStartShouldSetResponderCapture={() => true}
        onStartShouldSetResponder={() => true}
        style={styles.square}
      >
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient
              id={saturationGradientId}
              x1="0"
              x2="1"
              y1="0"
              y2="0"
            >
              <Stop offset="0" stopColor="#FFFFFF" />
              <Stop offset="1" stopColor={hueColor} />
            </LinearGradient>
            <LinearGradient
              id={valueGradientId}
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <Stop offset="0" stopColor="#000000" stopOpacity="0" />
              <Stop offset="1" stopColor="#000000" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect
            fill={`url(#${saturationGradientId})`}
            height="100%"
            rx="18"
            width="100%"
          />
          <Rect
            fill={`url(#${valueGradientId})`}
            height="100%"
            rx="18"
            width="100%"
          />
        </Svg>
        <View
          pointerEvents="none"
          style={[
            styles.squareCursor,
            {
              backgroundColor: currentColor,
              left: getCursorPosition(
                hsv.saturation,
                squareLayout.width,
                10,
              ),
              top: getCursorPosition(
                1 - hsv.value,
                squareLayout.height,
                10,
              ),
            },
          ]}
        />
      </View>

      <View
        accessibilityLabel="色相调色条"
        onMoveShouldSetResponderCapture={() => true}
        onLayout={handleHueLayout}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          onInteractionChange?.(true);
          handleHueTouch(event);
        }}
        onResponderMove={handleHueTouch}
        onResponderRelease={() => onInteractionChange?.(false)}
        onResponderTerminate={() => onInteractionChange?.(false)}
        onResponderTerminationRequest={() => false}
        onStartShouldSetResponderCapture={() => true}
        onStartShouldSetResponder={() => true}
        style={styles.hueTrack}
      >
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient
              id={hueGradientId}
              x1="0"
              x2="1"
              y1="0"
              y2="0"
            >
              <Stop offset="0" stopColor="#FF0000" />
              <Stop offset="0.17" stopColor="#FFFF00" />
              <Stop offset="0.33" stopColor="#00FF00" />
              <Stop offset="0.5" stopColor="#00FFFF" />
              <Stop offset="0.67" stopColor="#0000FF" />
              <Stop offset="0.83" stopColor="#FF00FF" />
              <Stop offset="1" stopColor="#FF0000" />
            </LinearGradient>
          </Defs>
          <Rect
            fill={`url(#${hueGradientId})`}
            height="100%"
            rx="16"
            width="100%"
          />
        </Svg>
        <View
          pointerEvents="none"
          style={[
            styles.hueCursor,
            {
              backgroundColor: hueColor,
              left: getCursorPosition(
                hsv.hue / 360,
                hueLayout.width,
                10,
              ),
            },
          ]}
        />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  hueCursor: {
    borderColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    marginLeft: -10,
    marginTop: -10,
    position: 'absolute',
    top: '50%',
    width: 20,
  },
  hueTrack: {
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    marginTop: 14,
    overflow: 'visible',
    position: 'relative',
  },
  previewRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  previewSwatch: {
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 34,
    width: 34,
  },
  previewInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    borderRadius: 10,
    borderWidth: 1,
    color: '#000000',
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    height: 38,
    paddingHorizontal: 12,
  },
  square: {
    aspectRatio: 1,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  squareCursor: {
    borderColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    marginLeft: -10,
    marginTop: -10,
    position: 'absolute',
    width: 20,
  },
});
