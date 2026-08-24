import { apiClient } from "../../shared/api/client";
import { useAuthStore } from "../../shared/auth/authStore";
import { CHAT_SERVICE } from "../../shared/api/endpoints";
import type { PolicyReference } from "./types";

export interface ChatStreamCallbacks {
  onMetadata: (meta: { toolsUsed: string[]; references: PolicyReference[] }) => void;
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (error: unknown) => void;
}

// BE가 SSE로 응답한다: "event: metadata" 1번 뒤 "event: chunk"가 여러 번 오고,
// 별도 종료 이벤트 없이 연결이 끝난다. EventSource는 POST 바디를 못 보내 fetch로 직접 파싱한다.
function processEvent(rawEvent: string, callbacks: ChatStreamCallbacks) {
  const eventName = rawEvent.match(/^event:(.*)$/m)?.[1]?.trim();
  const data = rawEvent
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5))
    .join("\n");

  if (eventName === "metadata") {
    callbacks.onMetadata(JSON.parse(data));
  } else if (eventName === "chunk") {
    callbacks.onChunk(data);
  }
}

// 비로그인 사용자는 서버가 발급하는 anonId 쿠키로 세션을 식별하므로 credentials가 필수다.
export async function sendChatMessage(message: string, callbacks: ChatStreamCallbacks): Promise<void> {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    // apiClient(axios)도 baseURL 없이 상대경로로 호출해 dev 프록시(vite.config.ts)/동일 origin에
    // 맡기는 방식이라, fetch도 절대 URL을 직접 조립하지 않고 같은 방식을 따른다.
    const response = await fetch(CHAT_SERVICE.messages, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ message }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`chat request failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

      let separatorIndex;
      while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
        processEvent(buffer.slice(0, separatorIndex), callbacks);
        buffer = buffer.slice(separatorIndex + 2);
      }
    }

    if (buffer.trim()) {
      processEvent(buffer, callbacks);
    }

    callbacks.onDone();
  } catch (error) {
    callbacks.onError(error);
  }
}

export async function resetChatSession(): Promise<void> {
  await apiClient.post(CHAT_SERVICE.resetSession, undefined, { withCredentials: true });
}
