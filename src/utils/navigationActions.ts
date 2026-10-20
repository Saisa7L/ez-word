import { router, type Href } from 'expo-router';

import { runNavigationOnce } from './backNavigation';

export { runNavigationOnce };

type PrepareAction = () => void;

export type AppNavigation = {
  reset: (state: {
    index: number;
    routes: { name: string }[];
  }) => void;
};

export function canGoBack(): boolean {
  return router.canGoBack();
}

export function pushOnce(
  href: Href,
  prepareAction?: PrepareAction,
): boolean {
  return runNavigationOnce(() => {
    prepareAction?.();
    router.push(href);
  });
}

export function replaceOnce(
  href: Href,
  prepareAction?: PrepareAction,
): boolean {
  return runNavigationOnce(() => {
    prepareAction?.();
    router.replace(href);
  });
}

export function backOnce(fallbackHref?: Href): boolean {
  if (canGoBack()) {
    return runNavigationOnce(() => router.back());
  }

  return fallbackHref ? replaceOnce(fallbackHref) : false;
}

export function dismissToOnce(
  href: Href,
  prepareAction?: PrepareAction,
): boolean {
  return runNavigationOnce(() => {
    prepareAction?.();
    router.dismissTo(href);
  });
}

export function resetToHomeOnce(
  navigation: AppNavigation,
  prepareAction?: PrepareAction,
): boolean {
  return runNavigationOnce(() => {
    prepareAction?.();
    navigation.reset({
      index: 0,
      routes: [{ name: '(tabs)' }],
    });
  });
}
