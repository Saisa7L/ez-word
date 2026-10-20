import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { radii, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/features/theme/ThemeProvider';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type ImportInfoModalProps = {
  onClose: () => void;
  visible: boolean;
};

export function ImportInfoModal({ onClose, visible }: ImportInfoModalProps) {
  const styles = useThemedStyles(createStyles);
  const reduceMotion = useReducedMotion();

  return (
    <Modal
      animationType={reduceMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>导入说明</Text>

            <Text style={styles.sectionTitle}>导入步骤</Text>
            <Text style={styles.text}>
              1. 准备符合格式要求的 CSV 文件{'\n'}
              2. 点击“选择文件”{'\n'}
              3. 点击“开始导入”{'\n'}
              4. 在结果弹窗中确认导入数量
            </Text>

            <Text style={styles.sectionTitle}>文件要求</Text>
            <Text style={styles.text}>
              • 文件扩展名必须为 .csv{'\n'}• 文件编码使用 UTF-8{'\n'}•
              第一行必须是列名{'\n'}• 每一行代表一个单词
            </Text>

            <Text style={styles.sectionTitle}>数据格式</Text>
            <Text style={styles.text}>
              必要列：word、meaning、phonetic{'\n'}
              可选列：example{'\n'}
              兼容中文列名：单词、释义、中文释义、音标、sentence、例句
            </Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>
                word,meaning,phonetic,example{'\n'}
                abandon,放弃；抛弃,/əˈbændən/,They had to abandon the plan.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>导入规则</Text>
            <Text style={styles.text}>
              • 单词和释义不能为空{'\n'}• 音标列必须存在，但单元格可留空{'\n'}•
              同一个文件内重复单词会跳过{'\n'}• 已存在的单词会更新释义和音标
              {'\n'}• 有问题的行会跳过，不影响其他合法行
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.confirmButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.confirmText}>知道了</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    codeBlock: {
      backgroundColor: colors.graySoft,
      borderColor: colors.border,
      borderRadius: radii.md,
      borderWidth: 1,
      marginTop: 12,
      padding: 12,
    },
    codeText: {
      color: colors.text,
      fontFamily: 'monospace',
      fontSize: 12,
      lineHeight: 19,
    },
    confirmButton: {
      alignItems: 'center',
      alignSelf: 'stretch',
      backgroundColor: colors.primary,
      borderRadius: 24,
      height: 54,
      justifyContent: 'center',
      marginTop: 26,
    },
    confirmText: {
      color: colors.onPrimary,
      fontSize: 19,
      fontWeight: '700',
    },
    content: {
      padding: 24,
    },
    dialog: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      maxHeight: '84%',
      overflow: 'hidden',
      width: '88%',
    },
    overlay: {
      alignItems: 'center',
      backgroundColor: colors.overlay,
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    pressed: {
      opacity: 0.65,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginTop: 22,
    },
    text: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 23,
      marginTop: 9,
    },
    title: {
      color: colors.text,
      fontSize: 25,
      fontWeight: '800',
    },
  });
