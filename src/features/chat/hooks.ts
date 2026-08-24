import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../../shared/auth/authStore";
import { resetChatSession, sendChatMessage } from "./api";
import { useChatStore } from "./store";
import { cacheThumbnail, getCachedThumbnail } from "./thumbnailCache";
import type { ChatMessage, ProjectCard } from "./types";

// 로컬 환경에선 청크가 거의 동시에 도착해 통짜로 뿌려지듯 보인다 — 화면에 풀어내는
// 속도 자체를 여기서 조절해 타이핑처럼 보이게 한다(네트워크 도착 속도와 분리).
const REVEAL_INTERVAL_MS = 32;
const REVEAL_CHARS_PER_TICK = 2;

export function useSendChatMessage() {
  const addMessage = useChatStore((state) => state.addMessage);
  const appendToLastMessage = useChatStore((state) => state.appendToLastMessage);
  const setLastMessageReferences = useChatStore((state) => state.setLastMessageReferences);
  const setLastMessageProjects = useChatStore((state) => state.setLastMessageProjects);
  const addToolProgress = useChatStore((state) => state.addToolProgress);
  const completeToolProgress = useChatStore((state) => state.completeToolProgress);
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
          onToolStart: (event) => addToolProgress(event),
          onMetadata: (meta) => {
            setLastMessageReferences(meta.references);
            if (meta.projects && meta.projects.length > 0) {
              setLastMessageProjects(meta.projects);
            }
            // metadata 도착 = 그때까지 쌓인 tool_start가 전부 성공적으로 끝났다는 신호이므로,
            // 진행형 문구를 한 번에 완료형으로 전환한다.
            completeToolProgress();
          },
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

// thumbnailUrl은 5분짜리 presigned URL이라 오래된 대화(특히 새로고침 후 localStorage에서
// 복원된 메시지)에서는 이미 만료돼있을 수 있다. projectId로 IndexedDB 캐시를 먼저 확인하고,
// 캐시 미스면 원본 URL을 fetch해 blob으로 캐싱해둔다 — 다음부터는 URL이 만료돼도 안 깨진다.
// fetch 자체가 실패하면(만료, CORS 등) 원본 URL을 그대로 <img src>에 넘겨 브라우저가 한 번 더
// 시도하게 하고, 그마저 실패하면 호출부에서 플레이스홀더로 대체한다.
export function useThumbnailSrc(project: ProjectCard): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setSrc(null);

    async function load() {
      const cached = await getCachedThumbnail(project.projectId);
      if (cancelled) return;
      if (cached) {
        objectUrl = URL.createObjectURL(cached);
        setSrc(objectUrl);
        return;
      }
      if (!project.thumbnailUrl) return;
      try {
        const response = await fetch(project.thumbnailUrl);
        if (!response.ok) throw new Error(`thumbnail fetch failed: ${response.status}`);
        const blob = await response.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
        cacheThumbnail(project.projectId, blob);
      } catch {
        if (!cancelled) setSrc(project.thumbnailUrl);
      }
    }
    load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [project.projectId, project.thumbnailUrl]);

  return src;
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
