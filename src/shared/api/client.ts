import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../auth/authStore";
import { USER_SERVICE } from "./endpoints";

export function attachAuthHeader(
  config: InternalAxiosRequestConfig,
  accessToken: string | null,
): InternalAxiosRequestConfig {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  const user = useAuthStore.getState().user;
  if (user?.id) {
    config.headers.set("X-User-Id", String(user.id));
    if (user.role) {
      config.headers.set("X-User-Role", user.role);
    }
  }
  return config;
}

export function isUnauthorized(error: unknown): error is AxiosError {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

apiClient.interceptors.request.use((config) =>
  attachAuthHeader(config, useAuthStore.getState().accessToken),
);

interface RefreshResponseData {
  accessToken: string;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    throw new Error("no refresh token available");
  }
  const response = await axios.post<{ data: RefreshResponseData }>(
    `${import.meta.env.VITE_API_BASE_URL}${USER_SERVICE.refresh}`,
    { refreshToken },
  );
  const accessToken = response.data.data.accessToken;
  useAuthStore.getState().setAccessToken(accessToken);
  return accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const config = axios.isAxiosError(error) ? error.config : undefined;
    const retriable = config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    if (isUnauthorized(error) && retriable && !retriable._retried) {
      retriable._retried = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const accessToken = await refreshPromise;
        retriable.headers.set("Authorization", `Bearer ${accessToken}`);
        return apiClient(retriable);
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  },
);
