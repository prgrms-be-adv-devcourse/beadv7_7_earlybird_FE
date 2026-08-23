# 챗봇(오목눈이) 프론트 연동 핸드오프

BE 레포(`beadv7_7_earlybird_BE`)에서 챗봇 백엔드 작업(`조우진/ai-service/chat-quality-tuning`, PR #470)을 끝낸 2026-08-23에 이 문서를 처음 썼고, 그 직후 이 레포에 배치(JSON) 계약 기준으로 챗봇 위젯(`src/features/chat/`)이 실제로 만들어졌다. **2026-08-24, BE가 `조우진/chat-service/chat-streaming` 브랜치에서 응답 방식을 배치→SSE 스트리밍으로 전환 완료**(이슈 #476) — 지금 이 문서를 읽는다면, 목표는 **이미 만들어진 배치 기반 위젯을 SSE 소비 방식으로 업데이트하는 것**이다. 새 세션은 이 문서부터 읽으면 됨.

## 지금 상태 — 위젯은 이미 있음, BE 계약이 바뀜

`src/features/chat/`에 이미 구현돼 있음: `api.ts`(`sendChatMessage`/`resetChatSession`), `types.ts`, `store.ts`(zustand, `messages`/`isOpen`/`isSending`, localStorage persist), `hooks.ts`(`useSendChatMessage`/`useResetChatSession`, TanStack Query `useMutation`), `components/ChatWidget.tsx`. 처음 만들 때 조언대로 서버 호출이 `sendChatMessage` 함수 하나로 잘 감싸져 있어서, **바뀌어야 할 범위가 `api.ts`(+ 그걸 소비하는 `hooks.ts`/`store.ts`의 최소 확장)로 한정됨** — 위젯 UI(`ChatWidget.tsx`)나 스토어의 열림/닫힘/영속화 로직은 안 건드려도 됨.

**단, `sendChatMessage`의 "계약 형태" 자체가 바뀌어야 함** — 예전엔 `Promise<ChatMessageResponse>`(완성된 답 하나를 기다렸다 받음)였는데, SSE는 "메타데이터 1번 + 텍스트 조각 여러 번"이 순차적으로 오는 구조라 **단일 Promise 반환으로는 표현이 안 됨.** 콜백(`onMetadata`/`onChunk`/`onDone`/`onError`)을 받는 함수로 바꾸거나, async generator로 바꾸는 두 가지 중 하나를 골라야 함 — 아래 "구체적으로 뭘 바꿔야 하나"에 콜백 방식 예시를 적어둠.

## 실제 BE 응답 — curl로 직접 캡처한 예시 (2026-08-24)

```
POST /api/v1/chat/messages
Request: { "message": "가죽 노트커버 프로젝트 찾아줘" }

HTTP/1.1 200
Content-Type: text/event-stream
Set-Cookie: anonId=...; HttpOnly; Secure; SameSite=Lax  (비로그인 첫 메시지에서만)

event:metadata
data:{"toolsUsed":["search_projects"],"references":[]}

event:chunk
data:가
event:chunk
data:죽
event:chunk
data: 노
... (토큰 단위로 계속, 마지막엔 그냥 연결이 끝남 — 별도 "done" 이벤트 없음)
```

- **`event: metadata`가 항상 정확히 1번, 텍스트보다 먼저 옴** — `{ toolsUsed: string[], references: { category: string, topic: string }[] }`. tool 실행은 이 시점에 이미 다 끝나있다는 뜻(BE에서 tool_call 중간 응답은 필터링되고 최종 텍스트만 스트리밍됨).
- **`event: chunk`가 그 다음 여러 번, 각 `data:`가 텍스트 조각 하나** — 다 이어붙이면 예전 배치 응답의 `reply`와 동일한 문자열이 됨.
- **종료는 명시적 이벤트가 아니라 연결이 그냥 끝남** — `fetch`의 `ReadableStream` reader가 `done: true`를 주는 시점, 또는 EventSource라면 `close`에 해당.
- **`POST /api/v1/chat/sessions/reset`은 안 바뀜** — 여전히 `202 Accepted`, 바디 없음, 배치 때와 동일.

## 구체적으로 뭘 바꿔야 하나

**`EventSource`(브라우저 표준 SSE API)는 못 씀** — GET 전용이라 우리처럼 POST+바디(`message`)가 필요한 엔드포인트엔 안 맞음. `fetch` + `ReadableStream`으로 직접 SSE 프레임(`event:`/`data:` 줄)을 파싱해야 함.

`api.ts`의 `sendChatMessage`를 콜백 받는 형태로 교체하는 예시:
```ts
interface ChatStreamCallbacks {
  onMetadata: (meta: { toolsUsed: string[]; references: PolicyReference[] }) => void;
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (error: unknown) => void;
}

export async function sendChatMessage(message: string, callbacks: ChatStreamCallbacks): Promise<void> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${CHAT_SERVICE.messages}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // withCredentials: true의 fetch 버전 — anonId 쿠키에 필수
    body: JSON.stringify({ message }),
  });
  // ... response.body!.getReader()로 청크를 읽어 "event:"/"data:" 줄 단위로 파싱,
  // 이벤트 이름에 따라 onMetadata/onChunk 호출, 스트림 끝나면 onDone, 실패 시 onError
}
```
(SSE 프레임 파싱 로직 자체는 몇 줄 안 되지만 직접 구현이 필요 — `\n\n`으로 이벤트 구분, 각 이벤트 안에서 `event:`/`data:` 줄 분리)

**`hooks.ts`의 `useSendChatMessage`**: 지금은 `mutationFn`이 완성된 응답 하나를 반환하고 `onSuccess`에서 메시지 하나를 통째로 `addMessage`함. 스트리밍으로 바꾸면:
1. 사용자 메시지 추가는 그대로.
2. 빈 assistant 메시지를 먼저 하나 `addMessage`(placeholder, `content: ""`).
3. `onChunk`가 올 때마다 그 메시지의 `content`에 이어붙이는 새 스토어 액션(`appendToLastMessage(text)` 같은) 필요 — 지금 `store.ts`엔 이 액션이 없음, 추가해야 함.
4. `onMetadata`가 오면 그 placeholder 메시지의 `references`를 채움.
5. `onDone`/`onError`에서 `setSending(false)`.

**`ChatWidget.tsx`**: 로직상 큰 변화는 없어야 함 — 스토어의 `messages` 배열이 실시간으로 갱신되니 화면은 자동으로 타이핑되는 것처럼 보임. 다만 스트리밍 중인 메시지에 커서 깜빡임 같은 시각 효과를 넣고 싶으면 메시지 타입에 `isStreaming?: boolean` 같은 플래그를 추가로 둘 수 있음(선택 사항).

## 인증 — 배치 때와 동일, 이미 반영돼 있음

`api.ts`가 이미 `withCredentials: true`로 잘 만들어져 있음(비로그인 anonId 쿠키 대응). `fetch`로 바꿀 때는 `withCredentials` 대신 `credentials: "include"`를 써야 한다는 것만 주의 — axios와 fetch의 옵션 이름이 다름. 로그인 사용자의 `Authorization` 헤더는 `apiClient`의 인터셉터가 자동으로 붙여주던 걸 fetch로 바꾸면 수동으로 붙여야 함(`useAuthStore.getState().accessToken`).

**`gateway-server` CORS 미설정 이슈(`HANDOFF.md`)는 여전히 유효** — 이 상태로는 브라우저에서 아무 요청도 못 나감, credentials 포함 CORS 설정이 BE 쪽에 필요.

## 대화 이력 — 서버는 "조회" API를 안 준다 (배치 때와 동일)

여전히 유효. 서버는 LLM 컨텍스트용 내부 메모리(Caffeine, 30분 idle)만 갖고, 화면에 보여줄 이력은 프론트(`store.ts`의 zustand+localStorage)가 직접 관리.

## 마스코트

챗봇 페르소나("오목눈이")는 이 레포 브랜드 마스코트("뱁새", `public/character.png`, `Mascot` 컴포넌트)와 같은 새 — `ChatWidget.tsx`에서 이미 재사용하고 있는지 확인. 안 쓰고 있다면 반영 권장.

## 응답 텍스트 — 프론트가 따로 손볼 거 없음 (배치 때와 동일)

BE가 이미 처리: raw 상태값(`IN_PROGRESS` 등) 미노출, 정책 미포함 내용은 정직하게 답변, 존재하지 않는 대상 hallucination 방지, 범위 밖 질문 거절. `chunk` 텍스트를 이어붙인 결과를 그대로 렌더링하면 됨 — 검증/가공 불필요.

## 더 깊은 배경이 필요하면

같은 머신의 BE 워크스페이스(절대경로, 이 레포 세션에서도 파일로 직접 읽을 수 있음):
- `/Users/wjmac/work-history/earlybird/agentic-rag/PLAN.md` — §4.6(모델 선택), §4.7(raw 상태값/id 추측/정책 hallucination 방지 가드레일), §7(대화 상태/스트리밍 결정), §10.9(스트리밍 전환 중 `@RequestScope`→`ToolContext` 재설계 트러블슈팅)
- `/Users/wjmac/work-history/earlybird/agentic-rag/branch-plan.md` — 브랜치별 작업 범위
- `/Users/wjmac/work-history/earlybird/agentic-rag/branch-work-history/조우진_ai-service_chat-quality-tuning.md` — 모델/tool/가드레일 작업 클래스별 판단 근거
- `/Users/wjmac/work-history/earlybird/agentic-rag/branch-work-history/조우진_chat-service_chat-streaming.md` — SSE 전환 전체 과정(항목 1~6), 실제 curl 캡처 결과
