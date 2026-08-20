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
      // 1. 현재 로그인된 유저의 role을 직접 변경하는 API 시도 (/api/v1/users/me/role)
      try {
        const session = await switchRoleRequest(role);
        return { session, role };
      } catch (err) {
        console.warn("POST /api/v1/users/me/role failed, trying seed account auto-login fallback:", err);
      }

      // 2. 만약 백엔드 엔드포인트 미배포 상태라면 시드 계정 로그인으로 폴백
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

