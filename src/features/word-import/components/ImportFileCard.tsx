import { FileSpreadsheet, Upload } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SurfaceCard } from '@/components/SurfaceCard';
import {
  DEFAULT_GREEN,
  DEFAULT_GREEN_SOFT,
  shadow,
  type ThemeColors,
} from '@/constants/theme';
import type { PickedCsvFile } from '@/features/word-import/types';
import { useThemedStyles } from '@/features/theme/ThemeProvider';
import { formatBytes } from '@/utils/formatBytes';

type ImportFileCardProps = {
  file: PickedCsvFile | null;
  importDisabled: boolean;
  isImporting: boolean;
  onImport: () => void;
  onPickFile: () => void;
};

export function ImportFileCard({
  file,
  importDisabled,
  isImporting,
  onImport,
  onPickFile,
}: ImportFileCardProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <SurfaceCard style={styles.card}>
      <Text style={styles.title}>从 CSV 文件导入</Text>

      <View style={styles.fileRow}>
        <View style={styles.fileIconBox}>
          <FileSpreadsheet color={DEFAULT_GREEN} size={42} strokeWidth={1.8} />
          <Text style={styles.csvBadge}>CSV</Text>
        </View>

        <View style={styles.fileCopy}>
          <Text numberOfLines={1} style={styles.fileName}>
            {file?.name ?? '未选择文件'}
          </Text>
          <Text style={styles.fileMeta}>
            {file ? formatBytes(file.size) : '请选择 CSV 文件'}
          </Text>
        </View>

        {file ? (
          <Pressable
            accessibilityRole="button"
            onPress={onPickFile}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.changeFileText}>更改文件</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onPickFile}
          style={({ pressed }) => [
            styles.actionButton,
            styles.chooseButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.chooseButtonText}>选择文件</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={importDisabled}
          onPress={onImport}
          style={({ pressed }) => [
            styles.actionButton,
            styles.importButton,
            importDisabled && styles.importButtonDisabled,
            pressed && !importDisabled && styles.pressed,
          ]}
        >
          {isImporting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.importButtonContent}>
              <Upload color="#FFFFFF" size={25} strokeWidth={2.2} />
              <Text style={styles.importButtonText}>开始导入</Text>
            </View>
          )}
        </Pressable>
      </View>
    </SurfaceCard>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    actionButton: {
      alignItems: 'center',
      borderRadius: 28,
      flex: 1,
      height: 58,
      justifyContent: 'center',
    },
    actions: {
      flexDirection: 'row',
      gap: 18,
      marginTop: 76,
    },
    card: {
      ...shadow,
      marginTop: 24,
      padding: 28,
    },
    changeFileText: {
      color: colors.accentText,
      fontSize: 18,
      textDecorationLine: 'underline',
    },
    chooseButton: {
      borderColor: colors.accentText,
      borderWidth: 1.5,
    },
    chooseButtonText: {
      color: colors.accentText,
      fontSize: 20,
      fontWeight: '600',
    },
    csvBadge: {
      bottom: 7,
      color: DEFAULT_GREEN,
      fontSize: 10,
      fontWeight: '800',
      position: 'absolute',
      right: 12,
    },
    fileCopy: {
      flex: 1,
      marginLeft: 18,
      marginRight: 12,
    },
    fileIconBox: {
      alignItems: 'center',
      backgroundColor: DEFAULT_GREEN_SOFT,
      borderRadius: 14,
      height: 72,
      justifyContent: 'center',
      position: 'relative',
      width: 72,
    },
    fileMeta: {
      color: colors.textSecondary,
      fontSize: 17,
      marginTop: 7,
    },
    fileName: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '700',
    },
    fileRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: 34,
    },
    importButton: {
      backgroundColor: DEFAULT_GREEN,
    },
    importButtonContent: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    importButtonDisabled: {
      backgroundColor: colors.disabled,
    },
    importButtonText: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: '600',
    },
    pressed: {
      opacity: 0.65,
    },
    title: {
      color: colors.text,
      fontSize: 23,
      fontWeight: '600',
    },
  });
