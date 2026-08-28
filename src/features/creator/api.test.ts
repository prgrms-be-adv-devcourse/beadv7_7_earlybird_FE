import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  submitCreatorApplication,
  fetchCreatorApplications,
  approveCreatorApplication,
  rejectCreatorApplication,
} from "./api";
import { apiClient } from "../../shared/api/client";
import { USER_SERVICE } from "../../shared/api/endpoints";

vi.mock("../../shared/api/client", () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("creator feature api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submitCreatorApplication은 백엔드에 신청서 등록 요청을 POST한다", async () => {
    const payload = {
      creatorName: "스튜디오 얼리",
      category: "패션",
      introduction: "멋진 패션 프로젝트를 준비 중입니다.",
      businessNumber: "123-45-67890",
      bankName: "KB국민은행",
      bankCode: "06",
      accountNumber: "123-456-789",
      accountHolder: "김후원",
    };

    const mockResponse = {
      id: 1,
      userId: 99,
      ...payload,
      status: "PENDING",
    };

    (apiClient.post as any).mockResolvedValueOnce({
      data: { success: true, data: mockResponse, error: null },
    });

    const result = await submitCreatorApplication(payload);

    expect(apiClient.post).toHaveBeenCalledWith(USER_SERVICE.applyCreator, {
      creatorName: payload.creatorName,
      category: payload.category,
      introduction: payload.introduction,
      businessNumber: payload.businessNumber,
      portfolioUrl: null,
      bankCode: payload.bankCode,
      accountNumber: payload.accountNumber,
      accountHolder: payload.accountHolder,
    });
    expect(result).toEqual(mockResponse);
  });

  it("fetchCreatorApplications는 신청 목록을 GET한다", async () => {
    const mockList = [
      { id: 1, userId: 99, creatorName: "스튜디오 얼리", status: "PENDING" },
    ];
    (apiClient.get as any).mockResolvedValueOnce({
      data: { success: true, data: mockList, error: null },
    });

    const result = await fetchCreatorApplications("PENDING");

    expect(apiClient.get).toHaveBeenCalledWith(USER_SERVICE.creatorApplications("PENDING"));
    expect(result).toEqual(mockList);
  });

  it("approveCreatorApplication은 관리자 승인을 POST한다", async () => {
    const mockApproved = { id: 1, status: "APPROVED" };
    (apiClient.post as any).mockResolvedValueOnce({
      data: { success: true, data: mockApproved, error: null },
    });

    const result = await approveCreatorApplication(1);

    expect(apiClient.post).toHaveBeenCalledWith(USER_SERVICE.approveCreatorApplication(1));
    expect(result).toEqual(mockApproved);
  });

  it("rejectCreatorApplication은 관리자 반려 및 사유를 POST한다", async () => {
    const mockRejected = { id: 1, status: "REJECTED", rejectReason: "서류 미비" };
    (apiClient.post as any).mockResolvedValueOnce({
      data: { success: true, data: mockRejected, error: null },
    });

    const result = await rejectCreatorApplication(1, "서류 미비");

    expect(apiClient.post).toHaveBeenCalledWith(USER_SERVICE.rejectCreatorApplication(1), {
      reason: "서류 미비",
    });
    expect(result).toEqual(mockRejected);
  });
});
