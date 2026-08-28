<div align="center">
  <img src="./public/character.png" alt="얼리버드 마스코트 뱁새" width="160" />
  <h1>얼리버드 (EarlyBird) — Frontend</h1>
  <p>새로운 아이디어를 누구보다 먼저 발견하고 함께 키우는 감성 크라우드펀딩 플랫폼</p>
</div>

React 19 + TypeScript + Vite 기반 SPA. `beadv7_7_earlybird_BE`의 Spring Cloud Gateway 뒤에 있는
마이크로서비스(user / project / cart / order / payment / settlement / board / notification)를 호출한다.
(file-service는 미구현 스켈레톤이라 제외)

## 시작하기

```bash
npm install
npm run dev          # http://localhost:5173
```

개발 서버는 `vite.config.ts`의 프록시로 `/api` 요청을 로컬 게이트웨이(`localhost:8000`,
장바구니만 `localhost:8085`)로 넘긴다. 로컬에서 BE 스택만 띄워두면 별도 설정 없이 붙는다.
다른 백엔드를 가리키려면 `.env`에 `VITE_API_BASE_URL`을 지정한다.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 (HMR) |
| `npm run build` | 타입체크 + 프로덕션 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 로컬 확인 |
| `npm run test` | Vitest 단위 테스트 |
| `npm run lint` | oxlint |

## 주요 기능

- **홈** — 진행 중인 펀딩 프로젝트 카드 목록, 하이브리드 검색(Nori + 임베딩 kNN), 2-tier 로딩 인디케이터
- **프로젝트 상세** — 리워드 / 공지 / 후기 탭, 심사 대기·반려 상태 배너
- **인증** — 이메일+비밀번호 로그인·회원가입, 역할 전환(후원자 ↔ 창작자)
- **장바구니 / 주문** — 프로젝트별 묶음 표시, 주문 상세·취소
- **결제** — 껍데기 상태. 토스페이먼츠 위젯 연동이 남은 블로커라 버튼은 비활성 ([HANDOFF.md](./HANDOFF.md) 참고)
- **창작자** — 창작자 신청, 정산 대시보드
- **알림함** — 안 읽은 알림 뱃지
- **관리자** — 카테고리 관리, 프로젝트 심사 승인/반려
- **챗봇 "오목눈이"** — SSE 스트리밍 응답, tool 진행 상태 표시, 프로젝트 썸네일 카드 ([CHATBOT_HANDOFF.md](./CHATBOT_HANDOFF.md) 참고)

## 구조

도메인마다 `src/features/<domain>/{api.ts, types.ts, hooks.ts, components/, pages/}` 구조를 반복한다.

```
src/
  app/            라우터, 프로바이더
  shared/
    api/          axios 인스턴스(client.ts), 서비스별 엔드포인트 상수(endpoints.ts), ApiResponse<T>
    auth/         인증 스토어(zustand), 라우트 가드
    ui/           공용 컴포넌트 (스탬프 섀도우 / 뱁새 테마)
    types/
  features/       admin, auth, board, cart, chat, creator, files, home, orders, payments, projects, settlements
```

API 함수는 `apiClient`로 `ApiResponse<T>`를 언래핑하고, URL은 전부 `endpoints.ts`에 서비스별 상수 블록으로 모은다.

## 디자인

크림 페이퍼 배경(`#F2EFE6`) + 탠저린 오렌지 주조색(`#FF7A45`) + 스탬프 섀도우, 마스코트는 뱁새.
컬러/폰트/금지 요소는 [DESIGN.md](./DESIGN.md), 제품 포지셔닝은 [PRODUCT.md](./PRODUCT.md).

## 배포

`Dockerfile`이 멀티스테이지로 빌드 후 Caddy(`deploy/Caddyfile`)로 `dist/`를 정적 서빙한다.

## 알려진 제약

- **게이트웨이 CORS 미설정** — 브라우저에서 게이트웨이를 직접 호출하면 막힌다. gateway-server 오너가
  `SecurityConfig`에 `corsConfigurationSource` 빈을 추가해야 함 (FE에서 해결 불가).
- **board / notification 서비스의 `/api/v1` 프리픽스는 추정** — 팀 컨벤션 기준으로 가정만 한 상태.
  `src/shared/api/endpoints.ts`의 `TODO(FE)` 주석 확인 후 실제 배포 게이트웨이에 curl로 라우트 검증할 것.
