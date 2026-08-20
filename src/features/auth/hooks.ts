import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../shared/auth/authStore";
import { login, signup, switchRoleRequest } from "./api";
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
      // 1. 먼저 백엔드 switchRole API 시도
      try {
        const session = await switchRoleRequest(role);
        return { session, role };
      } catch {
        // 2. 백엔드 엔드포인트 미구현 시, 해당 역할의 시드 계정으로 실제 로그인하여 유효한 JWT 토큰 발급/스왑
        try {
          const credentials = SEED_ACCOUNTS[role];
          const session = await login(credentials);
          return { session, role };
        } catch (err) {
          console.warn("Auto-login failed for role switch, falling back to local state:", err);
          return { session: null, role };
        }
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


