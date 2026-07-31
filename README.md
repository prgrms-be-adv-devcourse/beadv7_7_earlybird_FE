# beadv7_7_earlybird_FE

얼리버드(Team 5) 크라우드펀딩 플랫폼 프론트엔드. React + Vite + TypeScript, gateway-server(`beadv7_7_earlybird_BE`)를 통해 9개 마이크로서비스와 통신한다.

## 시작하기

```bash
npm install
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:8000 (로컬 gateway-server)
npm run dev
```

## 스크립트

- `npm run dev` — 개발 서버
- `npm run build` — 프로덕션 빌드
- `npm run test` — Vitest 단위 테스트
- `npm run lint` — ESLint

## 구조

- `src/shared/api` — axios 인스턴스, 서비스별 엔드포인트 상수, 공용 응답 타입
- `src/shared/auth` — 인증 스토어(Zustand), 인증 필요 라우트 가드
- `src/shared/ui` — 공용 UI 컴포넌트(귀여운 테마)
- `src/features/<domain>` — 도메인별 api/hooks/types/pages (project, cart, orders, payments, settlements, board, notifications, admin, auth)

자세한 설계는 BE 레포의 `docs/superpowers/specs/2026-08-01-earlybird-fe-template-design.md` 참고.
