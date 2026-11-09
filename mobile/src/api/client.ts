import * as SecureStore from 'expo-secure-store';
import { config } from '../config';

const TOKEN_KEY = 'slowspark_token';

let cachedToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Error with the message the backend sent ({"error": "..."}), safe to show to the user. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function loadToken(): Promise<string | null> {
  cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
  return cachedToken;
}

export async function saveToken(token: string | null) {
  cachedToken = token;
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function getToken() {
  return cachedToken;
}

/** AuthContext registers this so a 401 anywhere logs the user out. */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

/** Small fetch wrapper: adds the JWT, sends/receives JSON, turns errors into ApiError. */
export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (cachedToken) headers.Authorization = `Bearer ${cachedToken}`;

  let res: Response;
  try {
    res = await fetch(config.apiUrl + path, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Server se connect nahi ho paaya. Internet check karo.');
  }

  if (res.status === 401) {
    onUnauthorized?.();
    throw new ApiError(401, 'Please log in again');
  }
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? 'Kuch gadbad ho gayi, dobara try karo');
  }
  return data as T;
}
