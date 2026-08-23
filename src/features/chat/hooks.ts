import { useMutation } from "@tanstack/react-query";
import { resetChatSession, sendChatMessage } from "./api";
import { useChatStore } from "./store";
import type { ChatMessage } from "./types";

export function useSendChatMessage() {
  const addMessage = useChatStore((state) => state.addMessage);
  const setSending = useChatStore((state) => state.setSending);

  return useMutation({
    mutationFn: async (message: string) => {
      const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: message };
      addMessage(userMessage);
      setSending(true);
      try {
        return await sendChatMessage(message);
      } finally {
        setSending(false);
      }
    },
    onSuccess: (data) => {
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        references: data.references,
      });
    },
    onError: () => {
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "죄송해요, 지금은 답변을 드리기 어려워요. 잠시 후 다시 시도해 주세요.",
      });
    },
  });
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
