import { describe, it, expect, vi } from "vitest";
import { apiClient } from "../../shared/api/client";
import { BOARD_SERVICE } from "../../shared/api/endpoints";
import {
  fetchNotices,
  createNotice,
  deleteNotice,
  fetchReviews,
  createReview,
  deleteReview,
} from "./api";

vi.mock("../../shared/api/client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

describe("board api", () => {
  it("fetchNotices는 BOARD_SERVICE.notices(projectId)를 GET한다", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: [], error: null } });
    await fetchNotices(39);
    expect(apiClient.get).toHaveBeenCalledWith(BOARD_SERVICE.notices(39));
  });

  it("createNotice는 BOARD_SERVICE.createNotice로 POST한다", async () => {
    const fakeNotice = { id: 1, projectId: 39, title: "공지 1", content: "내용 1" };
    (apiClient.post as any).mockResolvedValue({ data: { success: true, data: fakeNotice, error: null } });
    const payload = { projectId: 39, title: "공지 1", content: "내용 1" };
    const result = await createNotice(payload);
    expect(apiClient.post).toHaveBeenCalledWith(BOARD_SERVICE.createNotice, payload, { params: { projectId: 39 } });
    expect(result).toEqual(fakeNotice);
  });

  it("deleteNotice는 BOARD_SERVICE.notice(noticeId)를 DELETE한다", async () => {
    (apiClient.delete as any).mockResolvedValue({ data: { success: true, data: null, error: null } });
    await deleteNotice(1);
    expect(apiClient.delete).toHaveBeenCalledWith(BOARD_SERVICE.notice(1));
  });

  it("fetchReviews는 BOARD_SERVICE.reviews(projectId)를 GET한다", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: [], error: null } });
    await fetchReviews(39);
    expect(apiClient.get).toHaveBeenCalledWith(BOARD_SERVICE.reviews(39));
  });

  it("createReview는 BOARD_SERVICE.createReview로 POST한다", async () => {
    const fakeReview = { id: 10, projectId: 39, rating: 5, content: "최고의 프로젝트입니다!" };
    (apiClient.post as any).mockResolvedValue({ data: { success: true, data: fakeReview, error: null } });
    const payload = { projectId: 39, rating: 5, content: "최고의 프로젝트입니다!" };
    const result = await createReview(payload);
    expect(apiClient.post).toHaveBeenCalledWith(BOARD_SERVICE.createReview, payload, {
      params: { projectId: 39 },
    });
    expect(result).toEqual(fakeReview);
  });

  it("deleteReview는 BOARD_SERVICE.review(reviewId)를 DELETE한다", async () => {
    (apiClient.delete as any).mockResolvedValue({ data: { success: true, data: null, error: null } });
    await deleteReview(10);
    expect(apiClient.delete).toHaveBeenCalledWith(BOARD_SERVICE.review(10));
  });
});
