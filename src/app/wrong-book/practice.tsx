import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Speech from 'expo-speech';
import { Volume2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from 'react-native';

import { GreenSheetScreen } from '@/components/GreenSheetScreen';
import { colors } from '@/constants/theme';
import {
  listAllWrongBookWords,
  type WrongBookEntry,
} from '@/database/wrongBookRepository';

export default function WrongBookPracticeScreen() {
  const db = useSQLiteContext();
  const [words, setWords] = useState<WrongBookEntry[]>([]);
  const [index, setIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setIsLoading(true);

      listAllWrongBookWords(db)
        .then((nextWords) => {
          if (active) {
            setWords(nextWords);
            setIndex(0);
          }
        })
        .catch(() => {
          if (active) {
            setWords([]);
          }
        })
        .finally(() => {
          if (active) {
            setIsLoading(false);
          }
        });

      return () => {
        active = false;
      };
    }, [db]),
  );

  const word = words[index];
  const progress =
    words.length === 0 ? 0 : ((index + 1) / words.length) * 100;
  const isLast = index === words.length - 1;

  function speakWord() {
    if (!word) {
      return;
    }
    void Speech.stop();
    Speech.speak(word.word, {
      language: 'en-US',
      rate: 0.85,
    });
  }

  return (
    <GreenSheetScreen
      onBack={() => router.back()}
      scrollable={false}
      title="错题回顾"
    >
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : !word ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>暂时没有可练习的错题</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.backButtonText}>返回错题本</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.wordBlock}>
              <Text style={styles.word}>{word.word}</Text>
              <Text style={styles.meaning}>{word.meaning}</Text>
              <Text style={styles.phonetic}>{word.phonetic || '暂无音标'}</Text>
              <Pressable
                accessibilityLabel="播放发音"
                accessibilityRole="button"
                onPress={speakWord}
                style={({ pressed }) => [
                  styles.speakerButton,
                  pressed && styles.pressed,
                ]}
              >
                <Volume2
                  color={colors.surface}
                  size={38}
                  strokeWidth={2.4}
                />
              </Pressable>
            </View>

            <Text style={styles.counter}>
              {index + 1}/{words.length}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%` as DimensionValue },
                ]}
              />
            </View>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={index === 0}
                onPress={() => setIndex((current) => Math.max(0, current - 1))}
                style={({ pressed }) => [
                  styles.actionButton,
                  index === 0 && styles.actionButtonDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.actionText}>上一个</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (isLast) {
                    router.back();
                    return;
                  }
                  setIndex((current) => current + 1);
                }}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.nextButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.actionText, styles.nextText]}>
                  {isLast ? '完成并返回' : '下一个'}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </GreenSheetScreen>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.graySoft,
    borderRadius: 26,
    flex: 1,
    height: 58,
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actions: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 16,
    marginTop: 26,
  },
  actionText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 58,
    justifyContent: 'center',
    marginTop: 28,
    width: 220,
  },
  backButtonText: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 34,
  },
  counter: {
    color: colors.textSecondary,
    fontSize: 19,
    marginTop: 34,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  meaning: {
    color: colors.textSecondary,
    fontSize: 24,
    marginTop: 24,
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: colors.primary,
  },
  nextText: {
    color: colors.surface,
  },
  phonetic: {
    color: colors.textMuted,
    fontSize: 19,
    marginTop: 12,
  },
  pressed: {
    opacity: 0.68,
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    height: 12,
  },
  progressTrack: {
    alignSelf: 'stretch',
    backgroundColor: colors.border,
    borderRadius: 6,
    height: 12,
    marginTop: 12,
    overflow: 'hidden',
  },
  speakerButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 34,
    height: 68,
    justifyContent: 'center',
    marginTop: 30,
    width: 68,
  },
  word: {
    color: colors.text,
    fontSize: 50,
    fontWeight: '800',
    textAlign: 'center',
  },
  wordBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 320,
    paddingHorizontal: 12,
    width: '100%',
  },
});
