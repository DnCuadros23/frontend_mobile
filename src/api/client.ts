/**
 * Cliente HTTP central (axios) para SecureTrace.
 *
 * - baseURL desde env.
 * - Request interceptor: inyecta `Authorization: Bearer <token>` desde SecureStore.
 * - Response interceptor: ante un 401 intenta refrescar el token una sola vez,
 *   encolando los requests concurrentes hasta que el refresh termine.
 * - Si el refresh falla, emite el evento `auth:logout` para que el AuthContext
 *   cierre la sesión.
 */
import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { env } from '../config/env';
import { secureStorage } from '../services/secureStorage';
import type { LoginResponse } from '../types';

/** Bus de eventos mínimo para comunicar el cliente con el AuthContext. */
type AuthListener = () => void;
const logoutListeners = new Set<AuthListener>();
export const authEvents = {
  onLogout(listener: AuthListener) {
    logoutListeners.add(listener);
    return () => {
      logoutListeners.delete(listener);
    };
  },
  emitLogout() {
    logoutListeners.forEach((l) => l());
  },
};

export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ---- Request: adjunta el JWT ----
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await secureStorage.getAccessToken();
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

// ---- Response: refresh automático del token ----
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function flushQueue(token: string | null) {
  pendingQueue.forEach((resolve) => resolve(token));
  pendingQueue = [];
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await secureStorage.getRefreshToken();
  if (!refreshToken) return null;
  try {
    // Instancia limpia para evitar recursión en los interceptores.
    const { data } = await axios.post<LoginResponse>(
      `${env.apiUrl}/api/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 },
    );
    await secureStorage.setAccessToken(data.accessToken);
    await secureStorage.setRefreshToken(data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const isAuthCall = original?.url?.includes('/auth/');

    if (status !== 401 || !original || original._retry || isAuthCall) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      // Espera a que termine el refresh en curso.
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (!token) return reject(error);
          const headers = AxiosHeaders.from(original.headers as AxiosHeaders);
          headers.set('Authorization', `Bearer ${token}`);
          original.headers = headers;
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;
    const newToken = await refreshAccessToken();
    isRefreshing = false;
    flushQueue(newToken);

    if (!newToken) {
      await secureStorage.clear();
      authEvents.emitLogout();
      return Promise.reject(error);
    }

    const headers = AxiosHeaders.from(original.headers as AxiosHeaders);
    headers.set('Authorization', `Bearer ${newToken}`);
    original.headers = headers;
    return api(original);
  },
);

export default api;
