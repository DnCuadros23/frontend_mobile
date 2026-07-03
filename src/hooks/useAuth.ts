/** Alias directo del contexto de autenticación. */
import { useAuthContext } from '../contexts/AuthContext';

export function useAuth() {
  return useAuthContext();
}
