import { describe, it, expect, vi } from "vitest";
import { apiClient } from "../../shared/api/client";
import { NOTIFICATION_SERVICE } from "../../shared/api/endpoints";
import { fetchNotifications } from "./api";

vi.mock("../../shared/api/client", () => ({
  apiClient: { get: vi.fn() },
}));

describe("notifications api", () => {
  it("fetchNotifications는 NOTIFICATION_SERVICE.notifications를 userId 쿼리 파라미터와 함께 GET한다", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: [], error: null } });
    await fetchNotifications(1);
    expect(apiClient.get).toHaveBeenCalledWith(NOTIFICATION_SERVICE.notifications, { params: { userId: 1 } });
  });
});
