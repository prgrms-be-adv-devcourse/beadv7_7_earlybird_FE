# beadv7_7_earlybird_FE — 핸드오프 노트

이 문서는 이 레포의 기본 템플릿을 처음 만든 시점(2026-08-01~02)에 뭘 했고, 뭐가 되고 안 되고, 다음에 뭘 해야 하는지를 정리한 노트다. 자세한 설계/구현 계획은 BE 레포의 `docs/superpowers/specs/2026-08-01-earlybird-fe-template-design.md`, `2026-08-01-earlybird-fe-template-plan.md` 참고.

## 백엔드는 안 건드림

이 작업은 프론트엔드 레포만 새로 만든 것이고, `beadv7_7_earlybird_BE`의 Java 소스코드는 전혀 수정하지 않았다. BE 레포에 추가된 건 `docs/superpowers/specs/` 아래 설계/계획 문서 커밋 4개뿐이다.

## 뭘 만들었는지 (기능적으로)

"얼리버드" 크라우드펀딩 사이트의 프론트엔드 껍데기. 실제로 켜서 써보면:

- **첫 화면** — 진행 중인 펀딩 프로젝트가 카드로 나열됨 (목표금액/모인금액, 상태 뱃지)
- **프로젝트 상세** — 리워드 목록, 공지사항 탭, 후기 탭
- **로그인/회원가입** — 이메일+비밀번호
- **장바구니** — 담은 리워드가 프로젝트별로 묶여서 표시
- **주문 내역** — 목록 + 상세 + 취소 버튼
- **결제** — 아직 "껍데기"다. 실제 결제엔 토스페이먼츠 위젯이 필요한데 이번 범위 밖이라 버튼만 있고 눌러도 동작 안 함(거짓으로 되는 척은 안 하게 만들어둠)
- **창작자 정산 대시보드** — 내 프로젝트 정산 내역
- **알림함** — 안 읽은 알림 뱃지
- **관리자** — 카테고리 관리, 프로젝트 심사 승인/반려

파스텔톤(민트/피치/라벤더) + 둥글둥글한 귀여운 느낌으로 톤을 맞췄고, 화면 전부 실제 백엔드 API와 연결돼 있어서 로컬에서 게이트웨이 켜놓고 붙이면 바로 데이터가 오간다. 다만 "기본 템플릿"이라 폼 검증 다듬기, 로딩 애니메이션, 결제 실제 연동 같은 마감 작업은 안 돼 있고 뼈대 + 배관공사까지만 되어 있다.

## 알려진 이슈 / 제약

- **gateway-server에 CORS 설정이 없다.** 브라우저에서 FE가 게이트웨이를 직접 호출하는 순간 막힌다. FE 쪽에서 고칠 수 있는 문제가 아니라 gateway-server 오너가 `SecurityConfig`에 `corsConfigurationSource` 빈을 추가해야 한다.
- **board-service / notification-service의 `/api/v1` 프리픽스가 미확인 상태다.** 두 서비스 컨트롤러 코드엔 실제로 `/api/v1`이 없다(`ProjectNoticeController`/`ReviewController`/`CommentController`/`NotificationController` 전부 클래스 레벨 `@RequestMapping` 없음). 팀 컨벤션(2026-07-16 확정, `/api/v1/{svc}/xxx`) 기준으로 있다고 가정만 하고 `src/shared/api/endpoints.ts`에 TODO로 표시해뒀다. 배포 서버가 켜지면 curl로 실제 라우트를 확인하고 그 파일의 `BOARD_SERVICE`/`NOTIFICATION_SERVICE` 상수만 고치면 된다(다른 파일엔 영향 없음).
- **살아있는 백엔드에 붙여서 눈으로 확인한 적이 없다.** 이번 작업은 유닛테스트(axios 모킹) + 빌드/타입체크 통과까지만 확인했다. 실제 게이트웨이에 연결해서 화면으로 확인하는 건 아직 안 했다.
- **settlement-service가 게이트웨이의 `X-User-Id` 헤더 패턴이 아니라 JWT를 자체적으로 디코드한다** (`CreatorProjectSettlementQueryController`가 `@AuthenticationPrincipal Jwt` 사용). 다른 서비스들과 다른 패턴이라 아키텍처 일관성 관점에서 팀에 공유할 가치가 있다. FE 쪽엔 영향 없음(`Authorization: Bearer` 헤더는 이미 매 요청에 붙어 나감).
- **장바구니에 담기/빼기 뮤테이션이 아직 없다.** 조회만 구현돼 있고 실제로 리워드를 담는 액션은 이번 범위 밖.
- **관리자 라우트(`/admin/**`)는 로그인만 되면 접근 가능하다.** ADMIN 역할 체크는 아직 라우트 가드에 없음(로그인 여부만 확인하는 `ProtectedRoute`만 걸려 있음).

## 다음에 하면 좋은 것

1. **로컬에서 실제로 붙여서 테스트** — `config-server → discovery-server → gateway-server` 순서로 BE 띄우고, FE는 `npm install && cp .env.example .env && npm run dev`. 회원가입 → 로그인 → 프로젝트 목록/상세 클릭해보면서 확인.
2. **gateway-server CORS 설정 추가** — 1번보다 먼저 해야 할 수도 있음.
3. **board/notification-service `/api/v1` 프리픽스 확인** — 배포 서버 켜지면 curl 한 번.
4. **팀 공유 및 도메인별 이어받기** — 각자 자기 도메인 feature 폴더(`src/features/<domain>`)를 이어서 채워나가면 됨. 포인트(예치금)/Elasticsearch 같은 새 기능은 `src/shared/api/endpoints.ts`에 상수 블록 추가 + `src/features/<new-domain>/` 폴더 하나 새로 만들면 기존 구조를 안 건드리고 붙일 수 있음.
