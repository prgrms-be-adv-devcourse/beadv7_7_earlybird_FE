# CLAUDE.md

이 레포는 "얼리버드"(EarlyBird) 크라우드펀딩 플랫폼의 프론트엔드다. React 19 + TypeScript + Vite, TanStack Query, axios, zustand, react-router-dom, Tailwind. `beadv7_7_earlybird_BE`의 Spring Cloud Gateway 뒤 마이크로서비스들을 호출한다.

## 먼저 읽을 문서

작업 성격에 따라 아래 문서를 참고한다 — 전부 이 레포 루트에 있음:

- **`HANDOFF.md`** — 이 템플릿을 처음 만들 때(2026-08-01~02)의 기능 범위, 알려진 이슈/제약(게이트웨이 CORS 미설정 등), 다음 할 일.
- **`DESIGN.md`** — 브랜드 컬러/폰트/마스코트("뱁새", `public/character.png`) 사용 원칙, 하지 말아야 할 시각 요소.
- **`PRODUCT.md`** — 제품 포지셔닝, 사용자 여정, 브랜드 커밋먼트.
- **`CHATBOT_HANDOFF.md`** — 챗봇("오목눈이") 기능 연동 작업 시작 전 필독. 위젯(`src/features/chat/`)은 이미 배치 응답 기준으로 구현돼 있고, BE가 SSE 스트리밍으로 전환(2026-08-24)한 데 이어 같은 날 tool 진행 상태 표시(`tool_start` 이벤트, 진행형→완료형 스택 UI)와 프로젝트 썸네일 카드(`metadata.projects[]` + 텍스트 `---` 구분선)까지 추가됨 — 이 문서에 새 SSE 계약(실제 캡처 예시 포함), 두 신규 기능 전용 섹션, `api.ts`/`hooks.ts`/`store.ts`에서 구체적으로 뭘 바꿔야 하는지 정리돼 있음. **챗봇 관련 작업을 시작하면 이 파일부터 읽을 것.**

## 코드 컨벤션

`src/features/<domain>/{api.ts, types.ts, hooks.ts, components/, pages/}` 구조를 도메인마다 반복(예: `projects`, `cart`, `orders` 참고). API 함수는 `apiClient`(`src/shared/api/client.ts`)로 `ApiResponse<T>`(`src/shared/types/ApiResponse.ts`)를 감싸 언래핑하고, URL은 `src/shared/api/endpoints.ts`에 서비스별 상수 블록으로 모아둔다. 새 도메인을 추가할 땐 기존 구조를 그대로 따라가면 다른 파일을 안 건드리고 붙일 수 있다.
