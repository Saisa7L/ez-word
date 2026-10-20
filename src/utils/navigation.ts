import {
  resetToHomeOnce,
  type AppNavigation,
} from './navigationActions';

export type { AppNavigation };

export function returnToHome(navigation: AppNavigation): boolean {
  return resetToHomeOnce(navigation);
}
