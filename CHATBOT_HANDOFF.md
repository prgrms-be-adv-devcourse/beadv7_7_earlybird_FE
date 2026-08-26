# 챗봇(오목눈이) 프론트 연동 핸드오프

BE 레포(`beadv7_7_earlybird_BE`)에서 챗봇 백엔드 작업(`조우진/ai-service/chat-quality-tuning`, PR #470)을 끝낸 2026-08-23에 이 문서를 처음 썼고, 그 직후 이 레포에 배치(JSON) 계약 기준으로 챗봇 위젯(`src/features/chat/`)이 실제로 만들어졌다. **2026-08-24, BE가 `조우진/chat-service/chat-streaming` 브랜치에서 응답 방식을 배치→SSE 스트리밍으로 전환**(이슈 #476)한 데 이어, **같은 날 같은 브랜치에서 세 가지를 추가로 완료**: ① `tool_start` 이벤트(tool 실행 진행 상태를 스택형 UI로 보여주기 위한 진행형/완료형 문구 페이로드), ② `metadata.projects[]`(프로젝트 추천 답변에 썸네일 카드를 붙이기 위한 구조화 데이터 + 답변 텍스트의 `---` 구분선 규칙), ③ 추천 프로젝트 개수 3→5 확장(이건 FE 영향 없음, 참고만). 아래 각 섹션은 이 계약을 설계할 당시의 원본 문서라 그대로 남겨뒀고, **①②를 포함해 이 문서에 적힌 FE 작업은 같은 날(2026-08-24) 전부 구현 완료됐다** — 실제로 뭘 어떻게 구현했는지, 원래 제안과 어디가 달라졌는지는 바로 아래 "FE 구현 완료 상태" 섹션에 정리해뒀다. 새 세션은 이 문서부터 읽으면 됨.

## FE 구현 완료 상태 (2026-08-24)

이 문서에 적힌 설계는 전부 `src/features/chat/`에 구현 완료됐다. 아래는 실제 구현 위치와, 문서의 원래 제안에서 실제로 달라진 부분들.

- **SSE 스트리밍**: `api.ts`의 `sendChatMessage`가 콜백 방식(`onToolStart`/`onMetadata`/`onChunk`/`onDone`/`onError`)으로 구현됨, `\n\n` 단위 프레임 파싱 포함. `hooks.ts`의 `useSendChatMessage`가 소비하고, 프론트 자체 타이프라이터 reveal 로직(`REVEAL_INTERVAL_MS`/`REVEAL_CHARS_PER_TICK`)이 추가돼 로컬처럼 청크가 한꺼번에 도착해도 타이핑처럼 보임.
- **`tool_start` 진행 상태 스택**: `ToolProgressStack` 컴포넌트(`ChatWidget.tsx`)로 구현. **원래 제안("메시지와는 별개 상태로 관리")과 달라진 점**: 처음엔 스토어 top-level 상태(`toolProgress`/`toolProgressCompleted`)로 뒀다가, 답변이 끝나면 스택이 사라지는 게 아쉽다는 피드백을 받아 **해당 턴의 assistant 메시지 자체(`ChatMessage.toolProgress`/`toolProgressCompleted`)에 붙이는 구조로 바꿈** — `messages`가 이미 `zustand persist`로 localStorage에 저장되니, 부수효과로 새로고침해도 진행 스택(완료형 "~했어요!")이 계속 남아있음.
- **프로젝트 썸네일 카드**: 2026-08-25에 위치(`---`) 기반 매칭에서 **제목 기반 매칭으로 전면 재작업 완료** — `ChatWidget.tsx`의 `renderMarkdownContent`가 이제 `projectsByTitle: Map<string, ProjectCard>`를 받아, 완결된 한 줄이 `^\*\*(.+)\*\*$` 형태이고 그 안의 문자열이 맵에 있으면(즉 `projects[].title`과 정확히 일치하면) `ProjectThumbnail` 카드로 치환하고, 없으면 평범한 굵은 텍스트로 둔다(`matchProjectHeaderLine`). 옛 설계의 `splitIntoProjectSegments`/`renderProjectContent`/`projects[0]` 즉시 렌더/세그먼트 불일치 폴백은 전부 삭제 — 이제 개념 자체가 성립하지 않음(각 프로젝트가 실제로 텍스트에 제목으로 언급된 시점에만, 언급된 만큼만 카드가 뜸). 스트리밍 중엔 아직 안 닫힌 마지막 줄(`**제목` 상태)은 매칭을 안 켜고 다음 청크를 기다림(`isStreaming` + 배열의 마지막 줄 여부로 판단). 실서버로 재현됐던 버그 케이스("진행중인 프로젝트에서 프로젝트 몇가지를 추천해줘" — `projects[]` 5개 vs 텍스트 언급 4개, 순서도 다르고 무관한 프로젝트 1개 포함)로 직접 재검증: 4개 전부 정확한 위치에 정확한 카드로 매칭되고 무관한 프로젝트는 안 나타나는 것 확인.
- **썸네일 presigned URL 5분 만료 대응(IndexedDB 캐싱)**: 문서엔 "선택 사항"으로 적혀있지만 구현 완료됨. 새 파일 `thumbnailCache.ts`(`getCachedThumbnail`/`cacheThumbnail`, IndexedDB, 실패해도 조용히 캐시 없음으로 폴백)와 `hooks.ts`의 `useThumbnailSrc` 훅(캐시 우선 조회 → 미스면 fetch+blob+캐싱 → 그마저 실패하면 원본 URL로 폴백) 조합. 실제 BE 응답의 `thumbnailUrl`이 현재 전부 `null`이라 실서버로는 검증 못 했고, 브라우저 콘솔에서 IndexedDB round-trip과 "URL 만료 시나리오"(캐시에 있으면 깨진 URL이 와도 정상 렌더)를 직접 재현해 검증함.
- **카드 제목 하이퍼링크**: 문서 제안은 "제목만 `<Link>`"였는데, **UX 다듬는 과정에서 카드 전체(`ProjectThumbnail`의 루트 엘리먼트)를 `<Link to={`/projects/${projectId}`}>`로 바꿔 버튼처럼 만듦** — 호버 시 `scale-[1.02]`+테두리/그림자 강조, 클릭 시 `scale-[0.98]`로 눌리는 느낌.
- **UI 폭 조정(사용자가 화면 보면서 실시간 요청, BE 문서엔 없는 내용)**: 썸네일 크기 40px(최초 구현) → 64px → 80px → **88px**(현재)로 3차례 확대, 챗봇 창 자체 높이도 `560px`(`max-h-75vh`) → `640px`(`max-h-80vh`)로 확대. 전부 `ChatWidget.tsx`의 Tailwind 클래스만 조정한 것이라 로직 변경 없음 — 더 조정하고 싶으면 `ProjectThumbnail`의 `h-[88px] w-[88px]`(썸네일)과 최상단 `ChatWindow`의 `h-[640px]`(창 높이)를 찾아서 바꾸면 됨.
- **로그인/로그아웃 시 대화 초기화**: 문서 하단 섹션대로 `useChatIdentitySync` 구현 완료.

## 지금 상태 — 위젯은 이미 있음, BE 계약이 바뀜

`src/features/chat/`에 이미 구현돼 있음: `api.ts`(`sendChatMessage`/`resetChatSession`), `types.ts`, `store.ts`(zustand, `messages`/`isOpen`/`isSending`, localStorage persist), `hooks.ts`(`useSendChatMessage`/`useResetChatSession`, TanStack Query `useMutation`), `components/ChatWidget.tsx`. 처음 만들 때 조언대로 서버 호출이 `sendChatMessage` 함수 하나로 잘 감싸져 있어서, **바뀌어야 할 범위가 `api.ts`(+ 그걸 소비하는 `hooks.ts`/`store.ts`의 최소 확장)로 한정됨** — 위젯 UI(`ChatWidget.tsx`)나 스토어의 열림/닫힘/영속화 로직은 안 건드려도 됨.

**단, `sendChatMessage`의 "계약 형태" 자체가 바뀌어야 함** — 예전엔 `Promise<ChatMessageResponse>`(완성된 답 하나를 기다렸다 받음)였는데, SSE는 "메타데이터 1번 + 텍스트 조각 여러 번"이 순차적으로 오는 구조라 **단일 Promise 반환으로는 표현이 안 됨.** 콜백(`onMetadata`/`onChunk`/`onDone`/`onError`)을 받는 함수로 바꾸거나, async generator로 바꾸는 두 가지 중 하나를 골라야 함 — 아래 "구체적으로 뭘 바꿔야 하나"에 콜백 방식 예시를 적어둠.

## 실제 BE 응답 — curl로 직접 캡처한 예시 (2026-08-24, tool_start/projects 추가 반영)

**예시 A — tool 1개 호출, 프로젝트 관련 없음 (진행 문구 페이로드 확인용)**
```
POST /api/v1/chat/messages
Request: { "message": "프로젝트 카테고리 목록 알려줘" }

HTTP/1.1 200
Content-Type: text/event-stream

event:tool_start
data:{"toolName":"list_project_categories","sequence":1,"message":"오목눈이가 카테고리를 확인하는 중...","completedMessage":"오목눈이가 카테고리를 확인했어요!"}

event:metadata
data:{"toolsUsed":["list_project_categories"],"references":[],"projects":[]}

event:chunk
data:얼
event:chunk
data:리
event:chunk
data:버
... (토큰 단위로 계속, 마지막엔 그냥 연결이 끝남 — 별도 "done" 이벤트 없음)
```

**예시 B — 프로젝트 여러 개 추천 (`metadata.projects[]` + 텍스트 `---` 구분선 확인용, 현재 DB엔 썸네일 연결 데이터가 없어 전부 null)**
```
POST /api/v1/chat/messages
Request: { "message": "진행중인 프로젝트 추천해줘" }

event:tool_start
data:{"toolName":"browse_projects","sequence":1,"message":"오목눈이가 프로젝트를 둘러보는 중...","completedMessage":"오목눈이가 프로젝트를 둘러봤어요!"}

event:metadata
data:{"toolsUsed":["browse_projects"],"references":[],"projects":[
  {"projectId":4,"title":"고양이 자동 급식기","thumbnailUrl":null},
  {"projectId":3,"title":"독립출판 시집 <새벽의 온도>","thumbnailUrl":null},
  {"projectId":2,"title":"휴대용 미니 빔프로젝터","thumbnailUrl":null},
  {"projectId":1,"title":"수제 가죽 노트커버","thumbnailUrl":null}
]}

event:chunk
data:진행 중인 프로젝트를 최신순으로 추천해드릴게요!

**고양이 자동 급식기**
... (소개 텍스트) ...
event:chunk
data:---

**독립출판 시집 <새벽의 온도>**
... (소개 텍스트) ...
event:chunk
data:---

**휴대용 미니 빔프로젝터**
... (소개 텍스트) ...
event:chunk
data:---

**수제 가죽 노트커버**
... (소개 텍스트, 마지막 항목이라 뒤에 --- 없음) ...
```
(위 두 예시 다 SSE 데이터가 실제로는 한 글자/토큰 단위 `chunk`로 잘게 쪼개져 온다 — 여기선 가독성을 위해 문장 단위로 요약함. 실제 원시 스트림은 예시 A처럼 `data:` 한 줄에 글자 하나~몇 글자씩 옴. **`**제목**` 굵은 헤더 줄은 tool 결과의 `title` 값을 글자 그대로 옮긴 것 — BE 시스템 프롬프트가 강제함(추측/재구성 금지). 아래 "프로젝트 썸네일 카드" 섹션에서 이 헤더로 카드를 매칭한다.**)

- **`event: tool_start`가 tool을 실제로 부를 때마다(한 턴에 여러 번 가능) `metadata`보다 먼저 옴** — 상세는 아래 "새 SSE 이벤트: `tool_start`" 섹션.
- **`event: metadata`가 항상 정확히 1번, 텍스트보다 먼저 옴** — `{ toolsUsed: string[], references: {category, topic}[], projects: {projectId, title, thumbnailUrl}[] }`. tool 실행(과 그 안의 `tool_start`들)은 이 시점에 이미 다 끝나있다는 뜻(BE에서 tool_call 중간 응답은 필터링되고 최종 텍스트만 스트리밍됨) — `projects`는 새 필드, 상세는 아래 "프로젝트 썸네일 카드" 섹션.
- **`event: chunk`가 그 다음 여러 번, 각 `data:`가 텍스트 조각 하나** — 다 이어붙이면 예전 배치 응답의 `reply`와 동일한 문자열이 됨.
- **종료는 명시적 이벤트가 아니라 연결이 그냥 끝남** — `fetch`의 `ReadableStream` reader가 `done: true`를 주는 시점, 또는 EventSource라면 `close`에 해당.
- **`POST /api/v1/chat/sessions/reset`은 안 바뀜** — 여전히 `202 Accepted`, 바디 없음, 배치 때와 동일.

## 구체적으로 뭘 바꿔야 하나

**`EventSource`(브라우저 표준 SSE API)는 못 씀** — GET 전용이라 우리처럼 POST+바디(`message`)가 필요한 엔드포인트엔 안 맞음. `fetch` + `ReadableStream`으로 직접 SSE 프레임(`event:`/`data:` 줄)을 파싱해야 함.

`api.ts`의 `sendChatMessage`를 콜백 받는 형태로 교체하는 예시:
```ts
interface ChatStreamCallbacks {
  onToolStart: (event: { toolName: string; sequence: number; message: string; completedMessage: string }) => void;
  onMetadata: (meta: { toolsUsed: string[]; references: PolicyReference[]; projects: ProjectCard[] }) => void;
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
3. `onToolStart`가 올 때마다 진행 상태 스택에 항목을 추가(상세는 아래 "새 SSE 이벤트: `tool_start`" 섹션) — 메시지 자체와는 별개 상태로 관리하는 게 자연스러움(스토어에 `toolProgress: ToolProgressItem[]` 같은 필드 신설 검토).
4. `onChunk`가 올 때마다 그 메시지의 `content`에 이어붙이는 새 스토어 액션(`appendToLastMessage(text)` 같은) 필요 — 지금 `store.ts`엔 이 액션이 없음, 추가해야 함.
5. `onMetadata`가 오면 그 placeholder 메시지의 `references`를 채우고, `projects`가 비어있지 않으면 답변 텍스트를 카드로 조립하기 위한 상태에도 반영(상세는 아래 "프로젝트 썸네일 카드" 섹션). 또한 이 시점에 3번에서 쌓아둔 진행 상태 스택을 전부 완료형으로 전환.
6. `onDone`/`onError`에서 `setSending(false)`.

**`ChatWidget.tsx`**: 로직상 큰 변화는 없어야 함 — 스토어의 `messages` 배열이 실시간으로 갱신되니 화면은 자동으로 타이핑되는 것처럼 보임. 다만 스트리밍 중인 메시지에 커서 깜빡임 같은 시각 효과를 넣고 싶으면 메시지 타입에 `isStreaming?: boolean` 같은 플래그를 추가로 둘 수 있음(선택 사항).

## 새 SSE 이벤트: `tool_start` — 진행 상태 스택 UI (2026-08-24 추가)

BE가 tool을 실제로 호출할 때마다(한 턴에 여러 번 가능 — 예: 카테고리 확인 후 검색처럼 순차 호출되면 `tool_start`도 그만큼 옴) `event: tool_start`를 쏜다. 목적은 Claude Code처럼 "지금 오목눈이가 뭘 하고 있는지"를 실시간으로 보여주는 것.

**페이로드**: `{ toolName: string, sequence: number, message: string, completedMessage: string }`
- `toolName`: `search_projects`/`browse_projects`/`list_project_categories`/`get_project_detail`/`get_project_rewards`/`get_reward_detail`/`search_reviews`/`search_policy` 중 하나(디버깅/아이콘 분기용으로만 쓰면 됨, 화면엔 안 띄워도 됨)
- `sequence`: 이번 턴에서 몇 번째 tool 호출인지(1부터 증가) — 같은 tool이 여러 번 불려도(예: 추천 후보마다 `search_reviews` 반복 호출) 매번 새 `sequence`로 옴
- `message`: 진행형 문구, 예) `"오목눈이가 프로젝트를 검색하는 중..."`
- `completedMessage`: 완료형 문구, 예) `"오목눈이가 프로젝트를 검색했어요!"` — **문자열 자체를 BE가 완성해서 보내주니, 프론트는 `message`를 접미사 치환해서 완료형을 만들려고 하면 안 됨**(한국어 동사 활용이 불규칙 — "검색하는 중..."→"검색했어요!"는 되지만 "둘러보는 중..."→"둘러봤어요!"는 어미가 다름).

**왜 "~하는 중..."이 아니라 "~했어요!"로 스택을 쌓는 UX인가**: 응답이 빨라서 진행형 문구 하나를 띄워도 사용자가 읽기 전에 사라지는 문제가 있어, 대신 완료된 항목을 계속 쌓아 보여주는 방식으로 결정됨.

**FE 구현 규칙**:
1. `tool_start`가 올 때마다 새 항목을 스택(배열)에 추가 — 화면엔 그 시점엔 `message`(진행형)로 표시.
2. `event: metadata`가 도착하면, **그 시점까지 스택에 쌓인 항목을 전부 한 번에 `completedMessage`(완료형)로 교체**. 개별 tool이 끝날 때마다 따로 신호를 안 주는 이유: `metadata`는 그 턴의 tool 호출이 **전부** 성공한 뒤에만 정확히 1번 발사되는 이벤트라(하나라도 실패하면 스트림이 에러로 끊겨 `metadata` 자체가 안 옴), "`metadata` 도착 = 그때까지 쌓인 tool_start가 다 성공적으로 끝났다"는 신뢰 가능한 신호로 그대로 쓸 수 있음 — 그래서 BE는 tool마다 별도 "완료" 이벤트를 안 보내도 됨.
3. 이 스택은 최종 답변 텍스트가 다 온 뒤(또는 다음 사용자 메시지를 보낼 때) 지워지는 게 자연스러움 — 계속 쌓이게 두면 지저분해짐.

## 프로젝트 썸네일 카드 — 제목 기반 매칭으로 재설계 (2026-08-25, 기존 위치 매칭 설계 대체)

**왜 바뀌었나**: 원래 설계(바로 아래 "폐기된 설계" 참고)는 `---` 구분선의 **개수와 순서**로 텍스트 세그먼트와 `projects[]` 배열을 짝지었다. 그런데 실서버 curl 테스트로, "진행중인 프로젝트에서 프로젝트 몇 가지를 추천해줘" 처럼 LLM이 전체가 아니라 일부만 골라 서술하는 질문에서 **`projects[]`의 순서·부분집합이 실제로 서술된 프로젝트와 일치하지 않는 경우**가 재현됨(동일 세션 재시도에서도 같은 패턴으로 반복). 원인은 시스템 프롬프트가 `---` 구분선 문법만 강제했을 뿐, "tool 결과 순서를 그대로 유지"하거나 "전체를 다 서술"하라는 제약이 없었기 때문 — LLM이 자연스럽게 일부를 골라 다른 순서로 요약하면 위치 인덱스 매칭이 그대로 깨진다. **위치 정보에 의존하지 않는 매칭이 필요해 제목 텍스트로 직접 매칭하는 방식으로 바꿈.**

**BE 변경 (완료, `ChatClientConfig.java`)**: 시스템 프롬프트가 이제 "프로젝트를 소개할 때는 그 프로젝트 이름을 항상 문단 맨 첫 줄에 `**프로젝트명**` 형태로, tool 결과의 `title` 값을 그대로(추측·재구성·다른 기호로 감싸기 금지) 써라"라고 지시함. 즉 **텍스트에 등장하는 굵은 헤더 줄의 문자열이 `projects[].title`과 글자 그대로 일치하도록 강제됨** — 이게 FE가 짝짓는 데 쓸 유일한 근거. `---` 구분선 자체는 그대로 유지(항목 사이 가독성용 구분자, 여러 개일 때만 삽입)하지만 **더 이상 매칭에 쓰지 않는다** — 순수 시각적 구분선으로만 취급하면 됨.

**페이로드는 안 바뀜**: `metadata.projects: { projectId: number, title: string, thumbnailUrl: string | null }[]` — 이제 배열의 **순서는 신경 쓸 필요 없음**(더 이상 위치가 의미를 갖지 않으므로, 배열을 `title` 기준 lookup map으로만 쓰면 됨). 배열에 없는 프로젝트를 텍스트가 언급할 일은 없다(시스템 프롬프트가 tool 결과 밖의 id/제목 추측을 이미 금지).

**FE 매칭 알고리즘**:
1. `metadata` 도착 시 `projects[]`를 `title → ProjectCard` 맵으로만 저장해둔다. **이 시점엔 아무 카드도 렌더하지 않음** — 예전 설계의 "`projects[0]` 즉시 렌더" 특례는 제거됨. 카드는 오직 텍스트에서 그 프로젝트의 헤더 줄이 실제로 등장하는 시점에만 나타난다.
2. 누적된 텍스트(청크가 글자 단위로 쪼개져 오므로 매 청크가 아니라 **누적 버퍼 기준**으로 검사)에서 `^\*\*(.+)\*\*$` 형태로 완결된 한 줄을 찾는다 — 여는 `**`와 닫는 `**`, 그리고 뒤따르는 줄바꿈까지 다 도착해야 "완결"로 본다(닫는 `**`가 아직 안 왔으면 청크 경계에 걸린 것이니 다음 청크를 기다림).
3. 완결된 헤더 줄을 찾으면 그 안의 텍스트를 그대로(trim만) 1번의 맵에서 조회한다. **일치하면** 그 줄을 굵은 텍스트 대신 썸네일+제목 카드 컴포넌트로 렌더링(즉 마크다운 `**...**` 애스터리스크는 화면에 안 보이고 카드로 치환됨). **일치하지 않으면**(LLM이 규칙을 어겼거나, 프로젝트 추천과 무관한 굵은 텍스트인 경우) 그냥 평범한 굵은 텍스트로 렌더 — 별도 폴백 로직 없이 "매칭 실패 시 카드를 안 씌운다"는 동작 자체가 그레이스풀 폴백이라 추가 처리가 필요 없음.
4. `projects[]`에 있지만 텍스트에 헤더로 등장하지 않는 프로젝트(LLM이 서술하지 않고 건너뛴 경우)는 **그냥 카드가 안 뜬다** — 위치/개수 불일치를 감지해서 뭔가 보정하는 로직 자체가 필요 없어짐(예전 설계의 "세그먼트 개수 불일치 시 하단에 나머지 카드 나열" 폴백은 통째로 삭제됨, 더 이상 개념이 성립하지 않음).
5. `---`는 매칭에 안 쓰지만 화면엔 여전히 구분선으로 보여주고 싶으면(가독성 목적) 지금 마크다운 렌더러가 `---`를 어떻게 처리하는지 확인 후 그대로 두거나 얇은 `<hr>`로 렌더하면 됨 — 이건 순수 스타일 선택이라 필수 아님.

**추가 — `title`에 `(#projectId)`가 붙는 경우 (2026-08-25, BE 변경, FE 코드 변경 불필요)**: 창작자가 취소/실패한 프로젝트를 동일한 이름으로 재등록하는 게 흔해서(`Project.title`엔 DB 유니크 제약 없음), 한 번의 검색 결과 안에 **동명 프로젝트가 여러 개** 섞여 나올 수 있다(예: "개구리 키우기"가 취소된 것 2개 + 진행중인 것 1개). 이 경우 BE가 동명인 항목에 한해 `title` 값 자체를 `"개구리 키우기 (#6)"`처럼 미리 구분해서 내려보낸다 — LLM이 "title을 그대로 복사"하는 기존 규칙을 지키면서 자동으로 구분된 헤더를 쓰게 되고, `metadata.projects[].title`에도 똑같은 값이 들어있어 위 알고리즘(정확 문자열 매칭)이 **코드 변경 없이 그대로 동작**한다. 동명 충돌이 없는 대다수 케이스는 이 접미사가 전혀 안 붙으니 평소엔 신경 쓸 필요 없음 — 단, 카드 제목이나 채팅 텍스트에 가끔 `(#6)` 같은 게 보여도 버그가 아니라 의도된 동작이니 임의로 정규식으로 벗겨내지 말 것(정확한 매칭이 이 접미사에 의존함). 상세: BE `PLAN.md` §10.13.

**참고 — 폐기된 설계(위치 인덱스 + `---` 매칭)**: 원래는 `---` 구분선 개수로 텍스트를 세그먼트로 나누고 `projects[i]`와 위치로 짝짓는 방식이었다(세그먼트 0은 `metadata` 도착 즉시 렌더, 개수 불일치 시 하단 카드 블록 폴백). **이 설계는 폐기됐고, 2026-08-25에 코드도 위 제목 기반 매칭으로 재작업 완료됨**(`ChatWidget.tsx`의 옛 `splitIntoProjectSegments`/`renderProjectContent`는 삭제, `matchProjectHeaderLine`/`buildProjectTitleMap`으로 교체) — 실서버 재현 케이스로 직접 검증까지 끝남, 상세는 위 "FE 구현 완료 상태" 섹션 참고.

**썸네일 URL 관련 주의(presigned URL, 5분 만료)**: `thumbnailUrl`은 file-service가 매 요청마다 새로 서명하는 **5분짜리 presigned S3 GET URL**이라, 호출할 때마다 URL 문자열 자체가 달라짐. 지금 `store.ts`가 `zustand persist`로 메시지를 localStorage에 영구 보관하는 구조라, 새로고침하거나 오래된 대화를 다시 열면 저장돼있던 `thumbnailUrl`이 만료돼 이미지가 깨질 수 있음. 권장 대응: 이미지 최초 로드 성공 시 URL이 아니라 **안정적인 키(`projectId`)로 blob을 IndexedDB에 캐시**해두고, 재로딩 시 캐시를 먼저 확인 — localStorage는 바이너리/용량에 부적합해서 IndexedDB 권장. 이건 첫 구현 때 필수는 아니고, 이미지가 자주 깨지는 게 확인되면 나중에 보강해도 됨.

**카드 제목 하이퍼링크(2026-08-24 추가)**: 카드 헤더의 프로젝트 제목(`project.title`)을 클릭하면 해당 프로젝트 상세 페이지로 이동하게 만들 것 — `projectId`가 이미 `metadata.projects[]`에 있으니 새 BE 작업 없이 프론트 단독으로 가능. 라우트도 이미 있음(`src/app/router.tsx`): `<Route path="/projects/:id" element={<ProjectDetailPage />} />`. `react-router-dom`의 `<Link to={`/projects/${project.projectId}`}>{project.title}</Link>`로 감싸면 됨 — 카드 헤더 렌더링 작업(위)에 자연스럽게 포함시킬 것.

## 인증 — 배치 때와 동일, 이미 반영돼 있음

`api.ts`가 이미 `withCredentials: true`로 잘 만들어져 있음(비로그인 anonId 쿠키 대응). `fetch`로 바꿀 때는 `withCredentials` 대신 `credentials: "include"`를 써야 한다는 것만 주의 — axios와 fetch의 옵션 이름이 다름. 로그인 사용자의 `Authorization` 헤더는 `apiClient`의 인터셉터가 자동으로 붙여주던 걸 fetch로 바꾸면 수동으로 붙여야 함(`useAuthStore.getState().accessToken`).

**`gateway-server` CORS 미설정 이슈(`HANDOFF.md`)는 여전히 유효** — 이 상태로는 브라우저에서 아무 요청도 못 나감, credentials 포함 CORS 설정이 BE 쪽에 필요.

## 대화 이력 — 서버는 "조회" API를 안 준다 (배치 때와 동일)

여전히 유효. 서버는 LLM 컨텍스트용 내부 메모리(Caffeine, 30분 idle)만 갖고, 화면에 보여줄 이력은 프론트(`store.ts`의 zustand+localStorage)가 직접 관리.

## 로그인/로그아웃 시 대화 이력을 프론트가 직접 비워줘야 함 (2026-08-24 확인)

**증상**: 비로그인 상태로 챗봇을 쓰다가 로그인하면, 화면엔 예전 비로그인 대화가 그대로 남아 새 대화와 이어붙어 보임 — 마치 로그인해도 이전 대화를 "기억"하는 것처럼 보이지만 실제로는 그렇지 않음.

**BE는 이미 올바르게 동작함**(소스로 확인, `ConversationIdentityResolver.resolve()`):
```java
public ConversationIdentity resolve(Long userId, String anonId) {
    if (userId != null) {
        return new ConversationIdentity(USER_KEY_PREFIX + userId, null);  // anonId는 무조건 무시
    }
    ...
}
```
`userId`(로그인 후 게이트웨이가 채워주는 `X-User-Id`)가 있으면 `anonId` 쿠키가 남아있어도 무조건 무시하고 `"user:" + userId`라는 새 키로 대화를 시작함 — 로그인하는 순간 서버 쪽 컨텍스트는 이미 완전히 새로 시작됨. **원인은 순수 프론트**: `store.ts`의 `messages`가 로그인 여부와 무관하게 localStorage에 계속 남아있어서, 화면만 예전 기록을 안 지우고 보여주는 것.

**해결 — `useAuthStore`의 유저 식별자가 바뀌는 시점에 `useChatStore.resetMessages()` 호출**:
```ts
// src/features/chat/hooks.ts에 추가
import { useEffect, useRef } from "react";
import { useAuthStore } from "../../shared/auth/authStore";
import { useChatStore } from "./store";

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
```
`ChatWidget.tsx`(또는 앱 셸 최상단, 위젯이 닫혀있어도 로그인 전환을 놓치지 않도록)에서 한 번 호출. 처음 마운트 시엔 `ref`가 같은 값으로 시작해 안 지워지고(localStorage 복원 기록 보존), 실제 로그인/로그아웃/유저 전환으로 `userId`가 바뀌는 순간에만 비워짐 — 로그인(`null`→숫자), 로그아웃(숫자→`null`) 둘 다 커버.

**`resetChatSession()`(서버 세션 폐기 API)까지 같이 호출할 필요는 없음** — 위 확인대로 서버는 `userId`가 있으면 어차피 별도 키로 새 대화를 시작하므로, 화면(로컬) 정리만으로 충분함.

## 마스코트

챗봇 페르소나("오목눈이")는 이 레포 브랜드 마스코트("뱁새", `public/character.png`, `Mascot` 컴포넌트)와 같은 새 — `ChatWidget.tsx`에서 이미 재사용하고 있는지 확인. 안 쓰고 있다면 반영 권장.

## 응답 텍스트 — 프론트가 따로 손볼 거 없음 (배치 때와 동일)

BE가 이미 처리: raw 상태값(`IN_PROGRESS` 등) 미노출, 정책 미포함 내용은 정직하게 답변, 존재하지 않는 대상 hallucination 방지, 범위 밖 질문 거절. `chunk` 텍스트를 이어붙인 결과를 그대로 렌더링하면 됨 — 검증/가공 불필요.

## 더 깊은 배경이 필요하면

같은 머신의 BE 워크스페이스(절대경로, 이 레포 세션에서도 파일로 직접 읽을 수 있음):
- `/Users/wjmac/work-history/earlybird/agentic-rag/PLAN.md` — §4.6(모델 선택), §4.7(raw 상태값/id 추측/정책 hallucination 방지 가드레일), §4.8(`tool_start` 설계+"~하는 중"→"~했어요" 전환 추가 설계), §4.10(프로젝트 썸네일 설계), §7(대화 상태/스트리밍 결정), §10.9(스트리밍 전환 중 `@RequestScope`→`ToolContext` 재설계 트러블슈팅), §10.10(자동 테스트 2단계 시도와 좌절, 실서버 검증으로 대체한 경위)
- `/Users/wjmac/work-history/earlybird/agentic-rag/branch-plan.md` §6 — `chat-streaming` 브랜치 작업 범위·진행 상황 체크리스트
- `/Users/wjmac/work-history/earlybird/agentic-rag/branch-work-history/조우진_ai-service_chat-quality-tuning.md` — 모델/tool/가드레일 작업 클래스별 판단 근거
- `/Users/wjmac/work-history/earlybird/agentic-rag/branch-work-history/조우진_chat-service_chat-streaming.md` — SSE 전환 전체 과정(항목 1~6), 이어서 항목 7(추천 개수 3→5), 8(`tool_start` 최초 구현), 9~10(자동 테스트 시도), **11(프로젝트 썸네일 구현+curl 검증), 12(`tool_start`에 완료형 문구 추가)**가 이 문서 두 섹션의 원본 설계·구현 기록
