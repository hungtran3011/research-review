import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  email: string | undefined;
  inviteToken: string | undefined;
  isAuthenticated: boolean;
  hasBootstrapped: boolean;
  isVerified: boolean;
  isSignUp: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  setEmail: (email: string) => void;
  setInviteToken: (token: string | undefined) => void;
  setAuthenticated: (value: boolean) => void;
  setBootstrapped: (value: boolean) => void;
  setVerified: (value: boolean) => void;
  setIsSignUp: (value: boolean) => void;
  setTokens: (accessToken: string, refreshToken: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      email: undefined,
      inviteToken: undefined,
      isAuthenticated: false,
      hasBootstrapped: false,
      isVerified: false,
      isSignUp: false,
      accessToken: null,
      refreshToken: null,
      setEmail: (email) => set({ email }),
      setInviteToken: (token) => set({ inviteToken: token }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setBootstrapped: (value) => set({ hasBootstrapped: value }),
      setVerified: (value) => set({ isVerified: value }),
      setIsSignUp: (value) => set({ isSignUp: value }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clearAuth: () => set({
        email: undefined,
        inviteToken: undefined,
        isAuthenticated: false,
        hasBootstrapped: false,
        isVerified: false,
        isSignUp: false,
        accessToken: null,
        refreshToken: null,
      }),
    }),
    { 
      name: 'auth-storage',
      partialize: (state) => ({ 
        email: state.email,
        inviteToken: state.inviteToken,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        isVerified: state.isVerified,
      })
    }
  )
);
