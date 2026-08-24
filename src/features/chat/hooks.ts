import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../../shared/auth/authStore";
import { resetChatSession, sendChatMessage } from "./api";
import { useChatStore } from "./store";
import type { ChatMessage } from "./types";

// 로컬 환경에선 청크가 거의 동시에 도착해 통짜로 뿌려지듯 보인다 — 화면에 풀어내는
// 속도 자체를 여기서 조절해 타이핑처럼 보이게 한다(네트워크 도착 속도와 분리).
const REVEAL_INTERVAL_MS = 32;
const REVEAL_CHARS_PER_TICK = 2;

export function useSendChatMessage() {
  const addMessage = useChatStore((state) => state.addMessage);
  const appendToLastMessage = useChatStore((state) => state.appendToLastMessage);
  const setLastMessageReferences = useChatStore((state) => state.setLastMessageReferences);
  const setSending = useChatStore((state) => state.setSending);

  return useMutation({
    mutationFn: (message: string) =>
      new Promise<void>((resolve) => {
        const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: message };
        addMessage(userMessage);
        addMessage({ id: crypto.randomUUID(), role: "assistant", content: "" });
        setSending(true);

        let pending = "";
        let streamEnded = false;

        const revealTimer = setInterval(() => {
          if (pending.length > 0) {
            appendToLastMessage(pending.slice(0, REVEAL_CHARS_PER_TICK));
            pending = pending.slice(REVEAL_CHARS_PER_TICK);
          } else if (streamEnded) {
            clearInterval(revealTimer);
            setSending(false);
            resolve();
          }
        }, REVEAL_INTERVAL_MS);

        sendChatMessage(message, {
          onMetadata: (meta) => setLastMessageReferences(meta.references),
          onChunk: (text) => {
            pending += text;
          },
          onDone: () => {
            streamEnded = true;
          },
          onError: () => {
            const messages = useChatStore.getState().messages;
            if (!messages[messages.length - 1]?.content && pending.length === 0) {
              pending = "죄송해요, 지금은 답변을 드리기 어려워요. 잠시 후 다시 시도해 주세요.";
            }
            streamEnded = true;
          },
        });
      }),
  });
}

// 서버는 로그인 사용자를 userId 기준 키로 완전히 새 대화로 취급하므로(anonId는 무시),
// 화면(로컬)에 남은 이전 대화도 로그인/로그아웃 시점에 같이 비워야 안 이어붙어 보인다.
export function useChatIdentitySync() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const resetMessages = useChatStore((state) => state.resetMessages);
  const previousUserId = useRef(userId);

  useEffect(() => {
    if (previousUserId.current !== userId) {
      resetMessages();
      previousUserId.current = userId;
    }
  }, [userId, resetMessages]);
}

export function useResetChatSession() {
  const resetMessages = useChatStore((state) => state.resetMessages);

  return useMutation({
    mutationFn: resetChatSession,
    onSuccess: () => {
      resetMessages();
    },
  });
}
