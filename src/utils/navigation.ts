import { router } from 'expo-router';

export type AppNavigation = {
  reset: (state: {
    index: number;
    routes: { name: string }[];
  }) => void;
};

export function returnToHome(navigation: AppNavigation) {
  navigation.reset({
    index: 0,
    routes: [{ name: '(tabs)' }],
  });
}

export function returnToDailyTaskStart() {
  if (router.canDismiss()) {
    router.dismissTo('/daily-task');
  } else {
    router.replace('/daily-task');
  }
}
