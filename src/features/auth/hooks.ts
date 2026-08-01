import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../../shared/auth/authStore";
import { login, signup } from "./api";
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
