import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: "BACKER" | "CREATOR" | "ADMIN";
}

interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setSession: (session: AuthSession) => void;
  setAccessToken: (accessToken: string) => void;
  setRole: (role: "BACKER" | "CREATOR" | "ADMIN") => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: ({ accessToken, refreshToken, user }) => set({ accessToken, refreshToken, user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setRole: (role) =>
        set((state) => ({
          user: state.user ? { ...state.user, role } : null,
        })),
      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null });
        try {
          localStorage.removeItem("earlybird-auth");
        } catch {
          // ignore
        }
      },
    }),
    { name: "earlybird-auth" },
  ),
);
