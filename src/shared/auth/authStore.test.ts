import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./authStore";

const sampleUser = { id: 1, email: "buyer@earlybird.co.kr", name: "구매자", role: "BACKER" as const };

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("초기 상태는 모두 null이다", () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it("setSession으로 세 값이 모두 저장된다", () => {
    useAuthStore.getState().setSession({ accessToken: "at", refreshToken: "rt", user: sampleUser });
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("at");
    expect(state.refreshToken).toBe("rt");
    expect(state.user).toEqual(sampleUser);
  });

  it("setAccessToken은 accessToken만 갱신한다", () => {
    useAuthStore.getState().setSession({ accessToken: "at", refreshToken: "rt", user: sampleUser });
    useAuthStore.getState().setAccessToken("new-at");
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("new-at");
    expect(state.refreshToken).toBe("rt");
  });

  it("logout은 세 값을 모두 null로 되돌린다", () => {
    useAuthStore.getState().setSession({ accessToken: "at", refreshToken: "rt", user: sampleUser });
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });
});
