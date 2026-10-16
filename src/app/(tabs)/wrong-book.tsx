import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SurfaceCard } from '@/components/SurfaceCard';
import { colors, shadow, spacing } from '@/constants/theme';

const mockWords = ['abandon', 'obvious', 'achieve', 'persistent', 'benefit'];

export default function WrongBookScreen() {
  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>错题本</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <SurfaceCard style={styles.listCard}>
          {mockWords.map((word, index) => (
            <View key={word} style={styles.wordRow}>
              <View style={styles.wordPill}>
                <Text style={styles.wordText}>{word}</Text>
              </View>
              <View style={styles.orderCircle}>
                <Text style={styles.orderText}>{index + 1}</Text>
              </View>
            </View>
          ))}
        </SurfaceCard>

        <View style={styles.pagination}>
          <View style={styles.pageArrow}>
            <ChevronLeft color={colors.primary} size={28} strokeWidth={2.2} />
          </View>
          <View style={[styles.pageNumber, styles.pageNumberActive]}>
            <Text style={styles.pageNumberActiveText}>1</Text>
          </View>
          <Text style={styles.pageNumberText}>2</Text>
          <Text style={styles.pageNumberText}>3</Text>
          <Text style={styles.pageEllipsis}>…</Text>
          <Text style={styles.pageNumberText}>98</Text>
          <Text style={styles.pageNumberText}>99</Text>
          <View style={styles.pageArrow}>
            <ChevronRight color={colors.primary} size={28} strokeWidth={2.2} />
          </View>
        </View>

        <View style={styles.actions}>
          <View style={[styles.actionButton, styles.addButton]}>
            <Text style={styles.actionText}>添加</Text>
          </View>
          <View style={[styles.actionButton, styles.removeButton]}>
            <Text style={styles.actionText}>移除</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 28,
    height: 58,
    justifyContent: 'center',
  },
  actions: {
    gap: 18,
    marginTop: 42,
  },
  actionText: {
    color: colors.surface,
    fontSize: 21,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: colors.blue,
  },
  content: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    height: 170,
    justifyContent: 'center',
  },
  headerSafeArea: {
    backgroundColor: colors.primary,
  },
  headerTitle: {
    color: colors.surface,
    fontSize: 25,
    fontWeight: '700',
  },
  listCard: {
    ...shadow,
    gap: 14,
    marginTop: 24,
    padding: 22,
  },
  orderCircle: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: 30,
    borderWidth: 1.5,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  orderText: {
    color: colors.text,
    fontSize: 19,
  },
  pageArrow: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: 30,
    borderWidth: 1.2,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  pageEllipsis: {
    color: colors.text,
    fontSize: 18,
  },
  pageNumber: {
    alignItems: 'center',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    minWidth: 42,
  },
  pageNumberActive: {
    backgroundColor: colors.primary,
  },
  pageNumberActiveText: {
    color: colors.surface,
    fontSize: 18,
  },
  pageNumberText: {
    color: colors.text,
    fontSize: 18,
    paddingHorizontal: 2,
  },
  pagination: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 34,
  },
  removeButton: {
    backgroundColor: colors.red,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scroll: {
    flex: 1,
    marginTop: -72,
  },
  wordPill: {
    alignItems: 'center',
    backgroundColor: colors.graySoft,
    borderRadius: 30,
    flex: 1,
    height: 58,
    justifyContent: 'center',
    marginRight: 24,
  },
  wordRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  wordText: {
    color: colors.text,
    fontSize: 20,
  },
});
