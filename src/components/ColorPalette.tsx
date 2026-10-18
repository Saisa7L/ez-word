import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  PanResponder,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type PanResponderGestureState,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';

type HsvColor = {
  hue: number;
  saturation: number;
  value: number;
};

type ColorPaletteProps = {
  onChange: (color: string) => void;
  value: string;
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
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
  value,
}: ColorPaletteProps) {
  const gradientId = useId().replace(/:/g, '');
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const squareRef = useRef<View>(null);
  const hueRef = useRef<View>(null);
  const [squareLayout, setSquareLayout] = useState({
    height: 0,
    width: 0,
    x: 0,
    y: 0,
  });
  const [hueLayout, setHueLayout] = useState({
    width: 0,
    x: 0,
  });

  useEffect(() => {
    onChange(hsvToHex(hsv));
  }, [hsv, onChange]);

  const updateSaturationValue = useCallback(
    (pageX: number, pageY: number) => {
      if (
        !Number.isFinite(pageX) ||
        !Number.isFinite(pageY) ||
        squareLayout.width === 0 ||
        squareLayout.height === 0
      ) {
        return;
      }

      setHsv((current) => ({
        ...current,
        saturation: clamp(
          (pageX - squareLayout.x) / squareLayout.width,
          0,
          1,
        ),
        value:
          1 -
          clamp(
            (pageY - squareLayout.y) / squareLayout.height,
            0,
            1,
          ),
      }));
    },
    [squareLayout],
  );

  const updateHue = useCallback(
    (pageX: number) => {
      if (!Number.isFinite(pageX) || hueLayout.width === 0) {
        return;
      }

      setHsv((current) => ({
        ...current,
        hue:
          clamp((pageX - hueLayout.x) / hueLayout.width, 0, 1) * 359.9,
      }));
    },
    [hueLayout],
  );

  const handleSquareGrant = useCallback(
    (
      _event: unknown,
      gestureState: PanResponderGestureState,
    ) => {
      updateSaturationValue(gestureState.x0, gestureState.y0);
    },
    [updateSaturationValue],
  );

  const handleSquareMove = useCallback(
    (
      _event: unknown,
      gestureState: PanResponderGestureState,
    ) => {
      updateSaturationValue(
        gestureState.moveX,
        gestureState.moveY,
      );
    },
    [updateSaturationValue],
  );

  const handleHueGrant = useCallback(
    (
      _event: unknown,
      gestureState: PanResponderGestureState,
    ) => {
      updateHue(gestureState.x0);
    },
    [updateHue],
  );

  const handleHueMove = useCallback(
    (
      _event: unknown,
      gestureState: PanResponderGestureState,
    ) => {
      updateHue(gestureState.moveX);
    },
    [updateHue],
  );

  const squareResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: handleSquareGrant,
        onPanResponderMove: handleSquareMove,
        onStartShouldSetPanResponder: () => true,
      }),
    [handleSquareGrant, handleSquareMove],
  );
  const hueResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: handleHueGrant,
        onPanResponderMove: handleHueMove,
        onStartShouldSetPanResponder: () => true,
      }),
    [handleHueGrant, handleHueMove],
  );

  const currentColor = hsvToHex(hsv);
  const hueColor = hsvToHex({ hue: hsv.hue, saturation: 1, value: 1 });
  const saturationGradientId = `${gradientId}-saturation`;
  const valueGradientId = `${gradientId}-value`;
  const hueGradientId = `${gradientId}-hue`;

  function handleSquareLayout(event: LayoutChangeEvent) {
    const { height, width } = event.nativeEvent.layout;
    squareRef.current?.measureInWindow((x, y, measuredWidth, measuredHeight) => {
      setSquareLayout({
        height: measuredHeight || height,
        width: measuredWidth || width,
        x,
        y,
      });
    });
  }

  function handleHueLayout(event: LayoutChangeEvent) {
    const { width } = event.nativeEvent.layout;
    hueRef.current?.measureInWindow((x, _y, measuredWidth) => {
      setHueLayout({
        width: measuredWidth || width,
        x,
      });
    });
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
        <Text style={styles.previewText}>{currentColor}</Text>
      </View>

      <View
        {...squareResponder.panHandlers}
        accessibilityLabel="颜色饱和度与明度调色盘"
        onLayout={handleSquareLayout}
        ref={squareRef}
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
              left: hsv.saturation * squareLayout.width,
              top: (1 - hsv.value) * squareLayout.height,
            },
          ]}
        />
      </View>

      <View
        {...hueResponder.panHandlers}
        accessibilityLabel="色相调色条"
        onLayout={handleHueLayout}
        ref={hueRef}
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
              left: (hsv.hue / 360) * hueLayout.width,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderColor: '#CBD2DD',
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
    borderColor: '#A8AFBC',
    borderRadius: 12,
    borderWidth: 1,
    height: 34,
    width: 34,
  },
  previewText: {
    color: '#657080',
    fontSize: 15,
    fontWeight: '600',
  },
  square: {
    aspectRatio: 1,
    borderColor: '#CBD2DD',
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
