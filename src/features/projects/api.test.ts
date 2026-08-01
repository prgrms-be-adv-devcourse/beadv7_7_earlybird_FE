import { describe, it, expect, vi } from "vitest";
import { apiClient } from "../../shared/api/client";
import { PROJECT_SERVICE } from "../../shared/api/endpoints";
import { fetchProjects, fetchProject, fetchRewards } from "./api";

vi.mock("../../shared/api/client", () => ({
  apiClient: { get: vi.fn() },
}));

describe("projects api", () => {
  it("fetchProjects는 PROJECT_SERVICE.projects를 GET한다", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { success: true, data: [], error: null } });
    const result = await fetchProjects();
    expect(apiClient.get).toHaveBeenCalledWith(PROJECT_SERVICE.projects);
    expect(result).toEqual([]);
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
