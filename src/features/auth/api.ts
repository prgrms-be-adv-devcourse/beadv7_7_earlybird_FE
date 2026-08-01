import { apiClient } from "../../shared/api/client";
import { USER_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { AuthSession, LoginRequest, SignupRequest } from "./types";

export async function login(request: LoginRequest): Promise<AuthSession> {
  const response = await apiClient.post<ApiResponse<AuthSession>>(USER_SERVICE.login, request);
  return response.data.data as AuthSession;
}

export async function signup(request: SignupRequest): Promise<void> {
  await apiClient.post<ApiResponse<null>>(USER_SERVICE.signup, request);
}
