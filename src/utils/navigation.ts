import { router } from 'expo-router';

export function returnToHome() {
  router.dismissAll();
  router.replace('/(tabs)');
}

export function returnToDailyTaskStart() {
  if (router.canDismiss()) {
    router.dismissTo('/daily-task');
  } else {
    router.replace('/daily-task');
  }
}
