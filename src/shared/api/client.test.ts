import { describe, it, expect } from "vitest";
import axios, { AxiosHeaders } from "axios";
import { attachAuthHeader, isUnauthorized } from "./client";

describe("attachAuthHeader", () => {
  it("accessToken이 있으면 Authorization 헤더를 붙인다", () => {
    const config = { headers: new AxiosHeaders() } as any;
    const result = attachAuthHeader(config, "my-token");
    expect(result.headers.get("Authorization")).toBe("Bearer my-token");
  });

  it("accessToken이 null이면 헤더를 건드리지 않는다", () => {
    const config = { headers: new AxiosHeaders() } as any;
    const result = attachAuthHeader(config, null);
    expect(result.headers.get("Authorization")).toBeUndefined();
  });
});

describe("isUnauthorized", () => {
  it("axios 401 에러면 true", () => {
    const error = new axios.AxiosError("Unauthorized", "401", undefined, undefined, {
      status: 401,
      data: null,
      statusText: "Unauthorized",
      headers: {},
      config: {} as any,
    });
    expect(isUnauthorized(error)).toBe(true);
  });

  it("axios가 아닌 에러면 false", () => {
    expect(isUnauthorized(new Error("boom"))).toBe(false);
  });
});
