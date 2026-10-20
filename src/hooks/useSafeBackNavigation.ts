import { type Href } from 'expo-router';
import { useCallback } from 'react';

import { backOnce } from '@/utils/navigationActions';

export function useSafeBackNavigation(fallbackHref: Href = '/'): () => void {
  return useCallback(() => {
    backOnce(fallbackHref);
  }, [fallbackHref]);
}
