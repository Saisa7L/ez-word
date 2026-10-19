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
