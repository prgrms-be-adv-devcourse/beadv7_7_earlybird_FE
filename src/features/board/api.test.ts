import { describe, it, expect, vi } from "vitest";
import { apiClient } from "../../shared/api/client";
import { BOARD_SERVICE } from "../../shared/api/endpoints";
import { fetchNotices, fetchReviews } from "./api";

vi.mock("../../shared/api/client", () => ({
  apiClient: { get: vi.fn() },
}));

describe("board api", () => {
  it("fetchNotices는 BOARD_SERVICE.notices(projectId)를 GET한다", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: [], error: null } });
    await fetchNotices(39);
    expect(apiClient.get).toHaveBeenCalledWith(BOARD_SERVICE.notices(39));
  });

  it("fetchReviews는 BOARD_SERVICE.reviews(projectId)를 GET한다", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: [], error: null } });
    await fetchReviews(39);
    expect(apiClient.get).toHaveBeenCalledWith(BOARD_SERVICE.reviews(39));
  });
});
