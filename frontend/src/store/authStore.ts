import { create } from 'zustand';
import type { User } from '@/lib/types';

type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  setUser: (user: User | null) => void;
  clear: () => void;
}

/**
 * Session auth state. The session itself lives in an HttpOnly cookie; this
 * store only mirrors the resolved user for UI decisions.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'unknown',
  setUser: (user) =>
    set({ user, status: user ? 'authenticated' : 'anonymous' }),
  clear: () => set({ user: null, status: 'anonymous' }),
}));
