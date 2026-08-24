import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearThumbnailCache } from "./thumbnailCache";
import type { ChatMessage, PolicyReference, ProjectCard, ToolStartEvent } from "./types";

interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  isSending: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  addMessage: (message: ChatMessage) => void;
  appendToLastMessage: (text: string) => void;
  setLastMessageReferences: (references: PolicyReference[]) => void;
  setLastMessageProjects: (projects: ProjectCard[]) => void;
  addToolProgress: (event: ToolStartEvent) => void;
  completeToolProgress: () => void;
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
      appendToLastMessage: (text) =>
        set((state) => {
          if (state.messages.length === 0) return state;
          const messages = state.messages.slice();
          const last = messages[messages.length - 1];
          messages[messages.length - 1] = { ...last, content: last.content + text };
          return { messages };
        }),
      setLastMessageReferences: (references) =>
        set((state) => {
          if (state.messages.length === 0) return state;
          const messages = state.messages.slice();
          const last = messages[messages.length - 1];
          messages[messages.length - 1] = { ...last, references };
          return { messages };
        }),
      setLastMessageProjects: (projects) =>
        set((state) => {
          if (state.messages.length === 0) return state;
          const messages = state.messages.slice();
          const last = messages[messages.length - 1];
          messages[messages.length - 1] = { ...last, projects };
          return { messages };
        }),
      // 답변이 다 끝난 뒤(새로고침해도)에도 계속 보여야 하므로, 별도 상태가 아니라
      // 해당 턴의 assistant 메시지에 직접 붙여 messages와 함께 영구 보관한다.
      addToolProgress: (event) =>
        set((state) => {
          if (state.messages.length === 0) return state;
          const messages = state.messages.slice();
          const last = messages[messages.length - 1];
          messages[messages.length - 1] = { ...last, toolProgress: [...(last.toolProgress ?? []), event] };
          return { messages };
        }),
      completeToolProgress: () =>
        set((state) => {
          if (state.messages.length === 0) return state;
          const messages = state.messages.slice();
          const last = messages[messages.length - 1];
          messages[messages.length - 1] = { ...last, toolProgressCompleted: true };
          return { messages };
        }),
      setSending: (isSending) => set({ isSending }),
      // "새 채팅" 버튼(resetChatSession)이나 로그인/로그아웃으로 대화가 초기화될 때마다
      // 호출된다 — 트리거 없이 두면 방문한 프로젝트 썸네일 blob이 IndexedDB에 무한정
      // 쌓이므로, 대화 초기화 시점에 같이 비운다.
      resetMessages: () => {
        clearThumbnailCache();
        set({ messages: [] });
      },
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
