import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  submitCreatorApplication,
  fetchMyCreatorApplication,
  fetchCreatorApplications,
  approveCreatorApplication,
  rejectCreatorApplication,
  cancelCreatorApplication,
} from "./api";
import { apiClient } from "../../shared/api/client";
import { useAuthStore } from "../../shared/auth/authStore";

vi.mock("../../shared/api/client", () => ({
  apiClient: { post: vi.fn() },
}));

describe("creator feature api", () => {
  beforeEach(() => {
    localStorage.clear();
    (apiClient.post as any).mockReset();
    useAuthStore.setState({
      accessToken: "test-token",
      refreshToken: "test-refresh",
      user: {
        id: 99,
        email: "backer@earlybird.co.kr",
        name: "김후원",
        role: "BACKER",
      },
    });
  });

  it("submitCreatorApplication은 새로운 신청서를 PENDING 상태로 등록한다", async () => {
    const payload = {
      creatorName: "스튜디오 얼리",
      category: "패션",
      introduction: "멋진 패션 프로젝트를 준비 중입니다.",
      businessNumber: "123-45-67890",
      bankName: "KB국민은행",
      bankCode: "004",
      accountNumber: "123-456-789",
      accountHolder: "김후원",
    };

    const app = await submitCreatorApplication(payload);

    expect(app.userId).toBe(99);
    expect(app.creatorName).toBe("스튜디오 얼리");
    expect(app.businessNumber).toBe("123-45-67890");
    expect(app.bankCode).toBe("004");
    expect(app.status).toBe("PENDING");

    const myApp = await fetchMyCreatorApplication();
    expect(myApp).toEqual(app);

    const list = await fetchCreatorApplications();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(app.id);
  });

  it("approveCreatorApplication은 상태를 APPROVED로 변경하고 새 세션 토큰을 저장한다", async () => {
    const app = await submitCreatorApplication({
      creatorName: "테크랩",
      category: "전자기기",
      introduction: "IoT 기기 개발",
      bankName: "신한은행",
      bankCode: "088",
      accountNumber: "987-654-321",
      accountHolder: "김후원",
    });

    const newSession = {
      accessToken: "new-at",
      refreshToken: "new-rt",
      user: { id: 99, email: "backer@earlybird.co.kr", name: "김후원", role: "CREATOR" },
    };
    (apiClient.post as any)
      .mockResolvedValueOnce({ data: { success: true, data: null, error: null } }) // /me/creator
      .mockResolvedValueOnce({ data: { success: true, data: newSession, error: null } }); // /me/role

    const approved = await approveCreatorApplication(app.id);

    expect(approved.status).toBe("APPROVED");
    expect(approved.reviewedAt).toBeDefined();

    // 본인 신청 승인 시 새 JWT(role=CREATOR)를 발급받아 세션을 갱신한다
    expect(useAuthStore.getState().accessToken).toBe("new-at");
    expect(useAuthStore.getState().user?.role).toBe("CREATOR");
  });

  it("rejectCreatorApplication은 상태를 REJECTED로 변경하고 반려 사유를 저장한다", async () => {
    const app = await submitCreatorApplication({
      creatorName: "아트스튜디오",
      category: "도서·출판",
      introduction: "그림책 출판",
      bankName: "우리은행",
      bankCode: "020",
      accountNumber: "111-222-333",
      accountHolder: "김후원",
    });

    const rejected = await rejectCreatorApplication(app.id, "계좌 정보 불일치");

    expect(rejected.status).toBe("REJECTED");
    expect(rejected.rejectReason).toBe("계좌 정보 불일치");
    expect(rejected.reviewedAt).toBeDefined();
  });

  it("cancelCreatorApplication은 신청서를 삭제한다", async () => {
    const app = await submitCreatorApplication({
      creatorName: "취소할 스튜디오",
      category: "기타",
      introduction: "취소 테스트",
      bankName: "카카오뱅크",
      bankCode: "090",
      accountNumber: "3333-01-12345",
      accountHolder: "김후원",
    });

    expect(await fetchCreatorApplications()).toHaveLength(1);

    await cancelCreatorApplication(app.id);

    expect(await fetchCreatorApplications()).toHaveLength(0);
    expect(await fetchMyCreatorApplication()).toBeNull();
  });
});
