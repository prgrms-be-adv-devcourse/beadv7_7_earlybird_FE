import { describe, it, expect, vi } from "vitest";
import { apiClient } from "../../shared/api/client";
import { PROJECT_SERVICE } from "../../shared/api/endpoints";
import { fetchCategories, approveProject, rejectProject } from "./api";

vi.mock("../../shared/api/client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

describe("admin api", () => {
  it("fetchCategories는 PROJECT_SERVICE.categories를 GET한다", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: [], error: null } });
    await fetchCategories();
    expect(apiClient.get).toHaveBeenCalledWith(PROJECT_SERVICE.categories);
  });

  it("approveProject는 /api/v1/projects/{id}/approve로 POST한다", async () => {
    (apiClient.post as any).mockResolvedValue({ data: { success: true, data: null, error: null } });
    await approveProject(39);
    expect(apiClient.post).toHaveBeenCalledWith(`${PROJECT_SERVICE.project(39)}/approve`);
  });

  it("rejectProject는 reason과 함께 /api/v1/projects/{id}/reject로 POST한다", async () => {
    (apiClient.post as any).mockResolvedValue({ data: { success: true, data: null, error: null } });
    await rejectProject(39, "부적절한 콘텐츠");
    expect(apiClient.post).toHaveBeenCalledWith(`${PROJECT_SERVICE.project(39)}/reject`, { reason: "부적절한 콘텐츠" });
  });
});
