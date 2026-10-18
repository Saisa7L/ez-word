import * as SecureStore from 'expo-secure-store';

const DEEPSEEK_API_KEY_NAME = 'deepseek_api_key';

export async function getDeepSeekApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(DEEPSEEK_API_KEY_NAME);
}

export async function saveDeepSeekApiKey(apiKey: string): Promise<void> {
  await SecureStore.setItemAsync(DEEPSEEK_API_KEY_NAME, apiKey.trim());
}

export async function clearDeepSeekApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(DEEPSEEK_API_KEY_NAME);
}
