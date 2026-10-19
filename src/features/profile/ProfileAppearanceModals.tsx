import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ColorPalette } from '@/components/ColorPalette';
import { radii, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/features/theme/ThemeProvider';

import { TEXT_STROKE_WIDTHS } from './profileUtils';

type ColorModalProps = {
  onChange: (color: string) => void;
  onClose: () => void;
  onPaletteInteractionChange: (active: boolean) => void;
  paletteTouching: boolean;
  title: string;
  value: string;
  visible: boolean;
};

export function ProfileColorModal({
  onChange,
  onClose,
  onPaletteInteractionChange,
  paletteTouching,
  title,
  value,
  visible,
}: ColorModalProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <ScrollView
            contentContainerStyle={styles.dialogContent}
            scrollEnabled={!paletteTouching}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.sectionLabel}>字体颜色</Text>
            {visible ? (
              <ColorPalette
                onChange={onChange}
                onInteractionChange={onPaletteInteractionChange}
                value={value}
              />
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.doneButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.doneText}>完成</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

type StrokeModalProps = {
  color: string;
  onClose: () => void;
  onColorChange: (color: string) => void;
  onPaletteInteractionChange: (active: boolean) => void;
  onWidthChange: (width: number) => void;
  paletteTouching: boolean;
  visible: boolean;
  width: number;
};

export function ProfileStrokeModal({
  color,
  onClose,
  onColorChange,
  onPaletteInteractionChange,
  onWidthChange,
  paletteTouching,
  visible,
  width,
}: StrokeModalProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <ScrollView
            contentContainerStyle={styles.dialogContent}
            scrollEnabled={!paletteTouching}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>文字描边设置</Text>
            <Text style={styles.sectionLabel}>描边颜色</Text>
            {visible ? (
              <ColorPalette
                onChange={onColorChange}
                onInteractionChange={onPaletteInteractionChange}
                value={color}
              />
            ) : null}

            <Text style={styles.sectionLabel}>描边大小</Text>
            <View style={styles.strokeWidthOptions}>
              {TEXT_STROKE_WIDTHS.map((optionWidth) => {
                const selected = width === optionWidth;

                return (
                  <Pressable
                    accessibilityLabel={`将描边大小设为 ${optionWidth}px`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={optionWidth}
                    onPress={() => onWidthChange(optionWidth)}
                    style={({ pressed }) => [
                      styles.strokeWidthButton,
                      selected && styles.strokeWidthButtonSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.strokeWidthText,
                        selected && styles.strokeWidthTextSelected,
                      ]}
                    >
                      {optionWidth}px
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.doneButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.doneText}>完成</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    dialog: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      maxHeight: '86%',
      overflow: 'hidden',
      width: '86%',
    },
    dialogContent: {
      padding: 24,
    },
    doneButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 22,
      height: 50,
      justifyContent: 'center',
      marginTop: 24,
    },
    doneText: {
      color: colors.onPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    overlay: {
      alignItems: 'center',
      backgroundColor: colors.overlay,
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    pressed: {
      opacity: 0.68,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '600',
      marginTop: 22,
    },
    strokeWidthButton: {
      alignItems: 'center',
      backgroundColor: colors.graySoft,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      height: 42,
      justifyContent: 'center',
      width: 46,
    },
    strokeWidthButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.accentText,
    },
    strokeWidthOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'flex-start',
      marginTop: 14,
    },
    strokeWidthText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
    },
    strokeWidthTextSelected: {
      color: colors.onPrimary,
    },
    title: {
      color: colors.text,
      fontSize: 23,
      fontWeight: '700',
    },
  });
