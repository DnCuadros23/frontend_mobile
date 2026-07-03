/**
 * Contexto de autenticación. Fuente de verdad de la sesión del usuario.
 * Persiste tokens y usuario en SecureStore y reacciona al evento global
 * `auth:logout` emitido por el interceptor de axios.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi } from '../api/auth';
import { authEvents } from '../api/client';
import { secureStorage } from '../services/secureStorage';
import type { LoginRequest, RegisterRequest, UpdateProfileRequest, User } from '../types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** true mientras se restaura la sesión guardada al iniciar la app. */
  isBootstrapping: boolean;
  login: (body: LoginRequest) => Promise<void>;
  register: (body: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (body: UpdateProfileRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Restaura la sesión persistida al montar.
  useEffect(() => {
    (async () => {
      try {
        const [token, storedUser] = await Promise.all([
          secureStorage.getAccessToken(),
          secureStorage.getUser(),
        ]);
        if (token && storedUser) setUser(storedUser);
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  const logout = useCallback(async () => {
    await secureStorage.clear();
    setUser(null);
  }, []);

  // Cierra sesión cuando el interceptor falla al refrescar el token.
  useEffect(() => authEvents.onLogout(() => void logout()), [logout]);

  const login = useCallback(async (body: LoginRequest) => {
    const res = await authApi.login(body);
    await secureStorage.setAccessToken(res.accessToken);
    await secureStorage.setRefreshToken(res.refreshToken);
    await secureStorage.setUser(res.user);
    setUser(res.user);
  }, []);

  // El backend no auto-loguea tras registrar: registramos y luego hacemos login.
  const register = useCallback(
    async (body: RegisterRequest) => {
      await authApi.register(body);
      await login({ email: body.email, password: body.password });
    },
    [login],
  );

  const updateProfile = useCallback(async (body: UpdateProfileRequest) => {
    const updated = await authApi.updateProfile(body);
    await secureStorage.setUser(updated);
    setUser(updated);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isBootstrapping,
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, isBootstrapping, login, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext debe usarse dentro de <AuthProvider>');
  return ctx;
}
