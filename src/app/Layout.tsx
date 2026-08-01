import { Link, Outlet } from "react-router-dom";
import { Button } from "../shared/ui";
import { useAuthStore } from "../shared/auth/authStore";

export function Layout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between bg-white px-6 py-4 shadow-md">
        <Link to="/" className="font-jua text-xl text-emerald-700">
          🌱 얼리버드
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/">프로젝트</Link>
          <Link to="/cart">장바구니</Link>
          <Link to="/orders">주문</Link>
          <Link to="/notifications">알림</Link>
          {user?.role === "CREATOR" && <Link to="/settlements">정산</Link>}
          {user?.role === "ADMIN" && <Link to="/admin/categories">관리자</Link>}
          {user ? (
            <Button variant="ghost" onClick={logout}>
              {user.name}님 로그아웃
            </Button>
          ) : (
            <Link to="/login">로그인</Link>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
