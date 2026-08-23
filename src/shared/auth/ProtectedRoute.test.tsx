import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuthStore } from "./authStore";

function renderWithRoute(initialPath: string, roles?: ("BACKER" | "CREATOR" | "ADMIN")[]) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>로그인 페이지</div>} />
        <Route path="/" element={<div>홈 페이지</div>} />
        <Route element={<ProtectedRoute roles={roles} />}>
          <Route path="/cart" element={<div>장바구니 페이지</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("accessToken이 없으면 /login으로 리다이렉트된다", () => {
    renderWithRoute("/cart");
    expect(screen.getByText("로그인 페이지")).toBeInTheDocument();
  });

  it("accessToken이 있으면 자식 라우트를 렌더링한다", () => {
    useAuthStore.getState().setSession({
      accessToken: "at",
      refreshToken: "rt",
      user: { id: 1, email: "a@a.com", name: "테스터", role: "BACKER" },
    });
    renderWithRoute("/cart");
    expect(screen.getByText("장바구니 페이지")).toBeInTheDocument();
  });

  it("허용되지 않은 역할은 보호된 자식 라우트에 접근할 수 없다", () => {
    useAuthStore.getState().setSession({
      accessToken: "at",
      refreshToken: "rt",
      user: { id: 1, email: "a@a.com", name: "테스터", role: "BACKER" },
    });
    renderWithRoute("/cart", ["CREATOR"]);
    expect(screen.getByText("홈 페이지")).toBeInTheDocument();
  });
});
