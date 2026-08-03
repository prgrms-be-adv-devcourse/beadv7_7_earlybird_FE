import { Link, Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import {
  ChevronDownIcon,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Mascot,
} from "../shared/ui";
import { useAuthStore } from "../shared/auth/authStore";

const navLinks = [
  { to: "/", label: "홈" },
  { to: "/projects", label: "전체 프로젝트" },
  { to: "/cart", label: "장바구니" },
  { to: "/orders", label: "주문" },
  { to: "/notifications", label: "알림" },
];

export function Layout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout();
    queryClient.clear();
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-ink bg-surface px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-ink">
          <Mascot variant="face" className="h-8 w-8" />
          Earlybird
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-ink/80 md:flex">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="transition-colors hover:text-brand">
              {link.label}
            </Link>
          ))}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 outline-none transition-colors hover:text-brand">
                {user.name}님
                <ChevronDownIcon className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {user.role === "CREATOR" && (
                  <DropdownMenuItem asChild>
                    <Link to="/settlements">정산</Link>
                  </DropdownMenuItem>
                )}
                {user.role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin/categories">관리자</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="my-1 h-px bg-ink/15" />
                <DropdownMenuItem onSelect={handleLogout}>로그아웃</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" className="transition-colors hover:text-brand">로그인</Link>
          )}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="메뉴 열기"
            className="flex items-center justify-center rounded-sm border-2 border-ink p-1.5 text-ink outline-none md:hidden"
          >
            <Menu className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[12rem]">
            {navLinks.map((link) => (
              <DropdownMenuItem key={link.to} asChild>
                <Link to={link.to}>{link.label}</Link>
              </DropdownMenuItem>
            ))}
            {user ? (
              <>
                <DropdownMenuSeparator className="my-1 h-px bg-ink/15" />
                {user.role === "CREATOR" && (
                  <DropdownMenuItem asChild>
                    <Link to="/settlements">정산</Link>
                  </DropdownMenuItem>
                )}
                {user.role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin/categories">관리자</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={handleLogout}>{user.name}님 로그아웃</DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem asChild>
                <Link to="/login">로그인</Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
