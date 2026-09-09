import { describe, it, expect, vi } from "vitest";
import { apiClient } from "../../shared/api/client";
import { PROJECT_SERVICE } from "../../shared/api/endpoints";
import { fetchProjects, fetchProjectAutocomplete, fetchProject, fetchRewards } from "./api";

vi.mock("../../shared/api/client", () => ({
  apiClient: { get: vi.fn() },
}));

describe("projects api", () => {
  const emptyPage = { content: [], page: 0, size: 8, totalPages: 0, totalElements: 0 };

  it("fetchProjects는 PROJECT_SERVICE.projects를 GET하고 페이지 객체를 돌려준다", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: emptyPage, error: null } });
    const result = await fetchProjects();
    expect(apiClient.get).toHaveBeenCalledWith(PROJECT_SERVICE.projects, { signal: undefined });
    expect(result).toEqual(emptyPage);
  });

  it("fetchProjects는 page/size를 쿼리에 싣는다 (page는 0-based)", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: emptyPage, error: null } });
    await fetchProjects({ page: 2, size: 8, status: "IN_PROGRESS" });
    expect(apiClient.get).toHaveBeenCalledWith(
      `${PROJECT_SERVICE.projects}?status=IN_PROGRESS&page=2&size=8`,
      { signal: undefined },
    );
  });

  it("fetchProjects는 creatorId를 쿼리에 싣는다", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: emptyPage, error: null } });
    await fetchProjects({ creatorId: 3, page: 0, size: 8 });
    expect(apiClient.get).toHaveBeenCalledWith(
      `${PROJECT_SERVICE.projects}?creatorId=3&page=0&size=8`,
      { signal: undefined },
    );
  });

  it("fetchProjects는 data가 없으면 빈 페이지를 돌려준다", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: null, error: null } });
    expect(await fetchProjects()).toEqual({ content: [], page: 0, size: 0, totalPages: 0, totalElements: 0 });
  });

  it("fetchProjectAutocomplete는 keyword를 인코딩해 GET한다", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: [{ projectId: 1, title: "고양이" }], error: null } });
    const result = await fetchProjectAutocomplete("고양 이");
    expect(apiClient.get).toHaveBeenCalledWith(
      `${PROJECT_SERVICE.autocomplete}?keyword=${encodeURIComponent("고양 이")}`,
      { signal: undefined },
    );
    expect(result).toEqual([{ projectId: 1, title: "고양이" }]);
  });

  it("fetchProject는 PROJECT_SERVICE.project(id)를 GET한다", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: { projectId: 39 }, error: null } });
    const result = await fetchProject(39);
    expect(apiClient.get).toHaveBeenCalledWith(PROJECT_SERVICE.project(39));
    expect(result).toEqual({ projectId: 39 });
  });

  it("fetchRewards는 PROJECT_SERVICE.rewards(projectId)를 GET한다", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: [], error: null } });
    await fetchRewards(39);
    expect(apiClient.get).toHaveBeenCalledWith(PROJECT_SERVICE.rewards(39));
  });
});
