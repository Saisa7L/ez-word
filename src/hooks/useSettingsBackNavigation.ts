import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

import { dismissToOnce } from '@/utils/navigationActions';

export function useSettingsBackNavigation(): () => void {
  const handleBack = useCallback(() => {
    dismissToOnce('/settings');
  }, []);

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
