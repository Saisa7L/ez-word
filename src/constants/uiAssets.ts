export const uiAssets = {
  app: {
    icon: require('../../assets/app/icon.png'),
  },
  avatars: {
    dinosaur: require('../../assets/ui/shared/avatar-dinosaur.png'),
    user: require('../../assets/ui/shared/avatar-user.png'),
  },
  dailyTask: {
    complete: require('../../assets/ui/daily-task/complete.png'),
    start: require('../../assets/ui/daily-task/start.png'),
  },
  home: {
    task: require('../../assets/ui/home/action-task.png'),
    wordPractice: require('../../assets/ui/home/action-word-practice.png'),
    wrongReview: require('../../assets/ui/home/action-wrong-review.png'),
  },
  navigation: {
    home: require('../../assets/ui/navigation/home.png'),
    settings: require('../../assets/ui/navigation/settings.png'),
    wrongBook: require('../../assets/ui/navigation/wrong-book.png'),
  },
  settings: {
    about: require('../../assets/ui/settings/about.png'),
    ai: require('../../assets/ui/settings/ai.png'),
    camera: require('../../assets/ui/settings/camera.png'),
    dailyTask: require('../../assets/ui/settings/daily-task.png'),
    import: require('../../assets/ui/settings/import.png'),
  },
  wrongBook: {
    reviewStart: require('../../assets/ui/wrong-book/review-start.png'),
  },
} as const;
