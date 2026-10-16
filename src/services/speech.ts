import * as Speech from 'expo-speech';

import type { WordRecord } from '@/database/wordsRepository';

type PlayWordSequenceOptions = {
  onError: (error: Error) => void;
  onFinished: () => void;
  onWordStart: (readIndex: number) => void;
  rate: number;
  startReadIndex?: number;
  words: WordRecord[];
};

const READ_GAP_MS = 5000;

export function playWordSequence({
  onError,
  onFinished,
  onWordStart,
  rate,
  startReadIndex = 0,
  words,
}: PlayWordSequenceOptions): () => void {
  let currentReadIndex = startReadIndex;
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const totalReads = words.length * 2;

  function stopPlayback() {
    cancelled = true;
    if (timer) {
      clearTimeout(timer);
    }
    void Speech.stop();
  }

  function speakNext() {
    if (cancelled) {
      return;
    }

    if (currentReadIndex >= totalReads) {
      onFinished();
      return;
    }

    const word = words[Math.floor(currentReadIndex / 2)];
    onWordStart(currentReadIndex);

    Speech.speak(word.word, {
      language: 'en-US',
      rate,
      onDone: () => {
        if (cancelled) {
          return;
        }

        currentReadIndex += 1;
        if (currentReadIndex >= totalReads) {
          onFinished();
          return;
        }

        timer = setTimeout(speakNext, READ_GAP_MS);
      },
      onError: (error) => {
        if (!cancelled) {
          stopPlayback();
          onError(error);
        }
      },
    });
  }

  speakNext();
  return stopPlayback;
}
