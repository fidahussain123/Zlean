import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/constants/api';

const TOKEN_KEY = 'zlean_token';
const USER_KEY = 'zlean_user';
const isWeb = Platform.OS === 'web';

async function getItem(key: string): Promise<string | null> {
  if (isWeb && typeof localStorage !== 'undefined') {
    return Promise.resolve(localStorage.getItem(key));
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb && typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (isWeb && typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export type Role = 'super_admin' | 'admin' | 'worker' | 'customer';

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
  shopId?: string;
}

export async function getStoredToken(): Promise<string | null> {
  return getItem(TOKEN_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function setSession(token: string, user: AuthUser): Promise<void> {
  await setItem(TOKEN_KEY, token);
  await setItem(USER_KEY, JSON.stringify(user));
}

export async function clearSession(): Promise<void> {
  await removeItem(TOKEN_KEY);
  await removeItem(USER_KEY);
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getStoredToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function api<T>(
  path: string,
  options: RequestInit & { method?: string; body?: object } = {}
): Promise<T> {
  const { method = 'GET', body, ...rest } = options;
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    method,
    headers: { ...headers, ...(rest.headers as Record<string, string>) },
    body: body ? JSON.stringify(body) : rest.body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export const authApi = {
  /** Single login: pass email or phone in loginId, backend returns token + user with role */
  login: (loginId: string, password: string) =>
    api<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: { login: loginId.trim(), password },
    }),
  signupCustomer: (email: string, password: string, name: string) =>
    api<{ token: string; user: AuthUser }>('/auth/signup/customer', { method: 'POST', body: { email, password, name } }),
};
