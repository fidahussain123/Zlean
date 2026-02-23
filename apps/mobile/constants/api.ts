import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
export const API_URL = extra?.API_URL ?? process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api';
