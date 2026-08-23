import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage } from "./types";

interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  isSending: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  addMessage: (message: ChatMessage) => void;
  setSending: (isSending: boolean) => void;
  resetMessages: () => void;
}

const CHAT_STORAGE_KEY = "earlybird-chat";

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      isOpen: false,
      messages: [],
      isSending: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      setSending: (isSending) => set({ isSending }),
      resetMessages: () => set({ messages: [] }),
    }),
    {
      name: CHAT_STORAGE_KEY,
      // isOpen/isSending은 일시적 UI 상태라 새로고침 후에는 초기값으로 되돌린다.
      partialize: (state) => ({ messages: state.messages }),
    },
  ),
);

// 서버는 사람당 대화 세션이 하나뿐이라(anonId 쿠키/JWT 기준), 탭마다 화면이 따로 놀면
// 실제 서버 컨텍스트와 어긋나 보인다 — 다른 탭의 변경을 storage 이벤트로 반영해 맞춰준다.
window.addEventListener("storage", (event) => {
  if (event.key === CHAT_STORAGE_KEY) {
    useChatStore.persist.rehydrate();
  }
});
