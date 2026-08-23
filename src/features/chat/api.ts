import { apiClient } from "../../shared/api/client";
import { CHAT_SERVICE } from "../../shared/api/endpoints";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { ChatMessageResponse } from "./types";

// 비로그인 사용자는 서버가 발급하는 anonId 쿠키로 세션을 식별하므로 withCredentials가 필수다.
export async function sendChatMessage(message: string): Promise<ChatMessageResponse> {
  const response = await apiClient.post<ApiResponse<ChatMessageResponse>>(
    CHAT_SERVICE.messages,
    { message },
    { withCredentials: true },
  );
  return response.data.data as ChatMessageResponse;
}

export async function resetChatSession(): Promise<void> {
  await apiClient.post(CHAT_SERVICE.resetSession, undefined, { withCredentials: true });
}
