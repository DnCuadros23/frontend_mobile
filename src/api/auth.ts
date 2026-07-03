/** Endpoints de autenticación. */
import api from './client';
import type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UpdateProfileRequest,
  User,
} from '../types';

export const authApi = {
  login(body: LoginRequest) {
    return api.post<LoginResponse>('/api/auth/login', body).then((r) => r.data);
  },

  /** El backend devuelve un AuthResponse (con tokens) igual que login. */
  register(body: RegisterRequest) {
    return api.post<LoginResponse>('/api/auth/register', body).then((r) => r.data);
  },

  refresh(refreshToken: string) {
    return api
      .post<LoginResponse>('/api/auth/refresh', { refreshToken })
      .then((r) => r.data);
  },

  me() {
    return api.get<User>('/api/users/me').then((r) => r.data);
  },

  updateProfile(body: UpdateProfileRequest) {
    return api.put<User>('/api/users/me', body).then((r) => r.data);
  },

  changePassword(body: ChangePasswordRequest) {
    return api.put<void>('/api/users/me/password', body).then(() => undefined);
  },
};
