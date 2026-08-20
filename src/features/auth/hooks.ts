import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../shared/auth/authStore";
import { login, signup } from "./api";
import { SEED_ACCOUNTS } from "./types";
import type { LoginRequest, SignupRequest } from "./types";

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation({
    mutationFn: (request: LoginRequest) => login(request),
    onSuccess: (session) => setSession(session),
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: (request: SignupRequest) => signup(request),
  });
}

export function useSwitchRole() {
  const setSession = useAuthStore((state) => state.setSession);
  const setRole = useAuthStore((state) => state.setRole);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (role: "BACKER" | "CREATOR" | "ADMIN") => {
      const credentials = SEED_ACCOUNTS[role];
      try {
        const session = await login(credentials);
        return { session, role };
      } catch (err) {
        console.warn("Auto-login failed for role switch, falling back to local state:", err);
        return { session: null, role };
      }
    },
    onSuccess: ({ session, role }) => {
      if (session) {
        setSession(session);
      } else {
        setRole(role);
      }
      queryClient.invalidateQueries();
    },
  });
}

