import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../shared/auth/authStore";
import { login, signup, switchRoleRequest } from "./api";
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (role: "BACKER" | "CREATOR" | "ADMIN") => {
      const session = await switchRoleRequest(role);
      return { session, role };
    },
    onSuccess: ({ session }) => {
      setSession(session);
      queryClient.invalidateQueries();
    },
  });
}


