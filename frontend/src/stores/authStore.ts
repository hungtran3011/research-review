import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  email: string | undefined;
  isAuthenticated: boolean;
  isVerified: boolean;
  isSignUp: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  setEmail: (email: string) => void;
  setAuthenticated: (value: boolean) => void;
  setVerified: (value: boolean) => void;
  setIsSignUp: (value: boolean) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      email: undefined,
      isAuthenticated: false,
      isVerified: false,
      isSignUp: false,
      accessToken: null,
      refreshToken: null,
      setEmail: (email) => set({ email }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setVerified: (value) => set({ isVerified: value }),
      setIsSignUp: (value) => set({ isSignUp: value }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clearAuth: () => set({
        email: undefined,
        isAuthenticated: false,
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
      })
    }
  )
);
