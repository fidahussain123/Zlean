import { createContext, useContext } from 'react';
import type { AuthUser } from '@/services/api';

export type AuthContextType = {
  user: AuthUser | null;
  ready: boolean;
  setUser: (u: AuthUser | null) => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  ready: false,
  setUser: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
