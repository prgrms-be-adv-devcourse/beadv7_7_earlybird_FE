import { describe, it, expect, vi } from "vitest";
import { apiClient } from "../../shared/api/client";
import { PROJECT_SERVICE } from "../../shared/api/endpoints";
import { fetchCategories, fetchPendingProjects, approveProject, rejectProject } from "./api";

vi.mock("../../shared/api/client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const ADMIN_HEADER = { headers: { "X-User-Role": "ADMIN" } };

describe("admin api", () => {
  it("fetchCategories는 PROJECT_SERVICE.categories를 GET한다", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: [], error: null } });
    await fetchCategories();
    expect(apiClient.get).toHaveBeenCalledWith(PROJECT_SERVICE.categories, ADMIN_HEADER);
  });

  it("fetchPendingProjects는 Page 응답의 content 배열을 돌려준다", async () => {
    const mockPage = {
      content: [{ projectId: 1, title: "심사 대기 프로젝트" }],
      page: 0,
      size: 100,
      totalPages: 1,
      totalElements: 1,
    };
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: mockPage, error: null } });
    const result = await fetchPendingProjects();
    expect(apiClient.get).toHaveBeenCalledWith(
      `${PROJECT_SERVICE.projects}?status=PENDING_REVIEW&size=100`,
      ADMIN_HEADER,
    );
    expect(result).toEqual(mockPage.content);
  });

  it("fetchPendingProjects는 data가 배열인 경우에도 정상 반환한다", async () => {
    const mockList = [{ projectId: 2, title: "배열 프로젝트" }];
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: mockList, error: null } });
    const result = await fetchPendingProjects();
    expect(result).toEqual(mockList);
  });

  it("fetchPendingProjects는 data가 null이면 빈 배열을 돌려준다", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: null, error: null } });
    const result = await fetchPendingProjects();
    expect(result).toEqual([]);
  });

  it("approveProject는 /api/v1/projects/{id}/approve로 POST한다", async () => {
    (apiClient.post as any).mockResolvedValue({ data: { success: true, data: null, error: null } });
    await approveProject(39);
    expect(apiClient.post).toHaveBeenCalledWith(`${PROJECT_SERVICE.project(39)}/approve`, {}, ADMIN_HEADER);
  });

  it("rejectProject는 reason과 함께 /api/v1/projects/{id}/reject로 POST한다", async () => {
    (apiClient.post as any).mockResolvedValue({ data: { success: true, data: null, error: null } });
    await rejectProject(39, "부적절한 콘텐츠");
    expect(apiClient.post).toHaveBeenCalledWith(
      `${PROJECT_SERVICE.project(39)}/reject`,
      { reason: "부적절한 콘텐츠" },
      ADMIN_HEADER
    );
  });
});
