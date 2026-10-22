import { type Href, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

import { backOnce } from '@/utils/navigationActions';

export function useSettingsBackNavigation(
  fallbackHref: Href = '/settings',
): () => void {
  const handleBack = useCallback(() => {
    backOnce(fallbackHref);
  }, [fallbackHref]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          handleBack();
          return true;
        },
      );

      return () => subscription.remove();
    }, [handleBack]),
  );

  return handleBack;
}
