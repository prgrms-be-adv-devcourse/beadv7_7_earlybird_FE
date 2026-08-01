import { describe, it, expect, vi } from "vitest";
import { apiClient } from "../../shared/api/client";
import { USER_SERVICE } from "../../shared/api/endpoints";
import { login, signup } from "./api";

vi.mock("../../shared/api/client", () => ({
  apiClient: { post: vi.fn() },
}));

describe("auth api", () => {
  it("login은 USER_SERVICE.login으로 POST하고 data를 반환한다", async () => {
    const session = { accessToken: "at", refreshToken: "rt", user: { id: 1, email: "a@a.com", name: "테스터", role: "BACKER" } };
    (apiClient.post as any).mockResolvedValue({ data: { success: true, data: session, error: null } });

    const result = await login({ email: "a@a.com", password: "pw" });

    expect(apiClient.post).toHaveBeenCalledWith(USER_SERVICE.login, { email: "a@a.com", password: "pw" });
    expect(result).toEqual(session);
  });

  it("signup은 USER_SERVICE.signup으로 POST한다", async () => {
    (apiClient.post as any).mockResolvedValue({ data: { success: true, data: null, error: null } });
    await signup({ email: "a@a.com", password: "pw", name: "테스터", phoneNumber: "010-0000-0000" });
    expect(apiClient.post).toHaveBeenCalledWith(USER_SERVICE.signup, {
      email: "a@a.com",
      password: "pw",
      name: "테스터",
      phoneNumber: "010-0000-0000",
    });
  });
});
