import { Link, Outlet, useNavigate } from "react-router-dom";
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
import { FloatingCartBar } from "../features/cart/components/FloatingCartBar";
import { useCategories } from "../features/admin/hooks";

function HeaderCategoryNav() {
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const topCategories = categories ?? [];

  return (
    <div className="hidden lg:flex items-center gap-1">
      {topCategories.map((topCat) => {
        const hasChildren = topCat.children && topCat.children.length > 0;
        return (
          <div key={topCat.id} className="group relative">
            <button
              type="button"
              onClick={() => navigate(`/projects?category=${topCat.id}`)}
              className="flex items-center gap-1 px-2.5 py-1 text-sm font-bold text-ink rounded-md transition-colors hover:bg-brand/10 hover:text-brand whitespace-nowrap"
            >
              <span>{topCat.name}</span>
              {hasChildren && (
                <ChevronDownIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180 text-mist" />
              )}
            </button>

            {hasChildren && (
              <div className="invisible absolute left-0 top-full pt-1.5 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 z-50">
                <div className="min-w-[180px] rounded-lg border-2 border-ink bg-surface p-2 shadow-stamp-lg flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => navigate(`/projects?category=${topCat.id}`)}
                    className="w-full text-left px-3 py-1.5 text-xs font-extrabold text-brand hover:bg-brand/10 rounded transition-colors"
                  >
                    전체 {topCat.name} 보기
                  </button>
                  <div className="my-1 h-px bg-ink/15" />

                  {topCat.children.map((subCat) => (
                    <button
                      key={subCat.id}
                      type="button"
                      onClick={() => navigate(`/projects?category=${subCat.id}`)}
                      className="w-full text-left px-3 py-1.5 text-xs font-bold text-ink hover:bg-paper/80 hover:text-brand rounded transition-colors"
                    >
                      └ {subCat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Layout() {
  const user = useAuthStore((state) => state.user);
  const setRole = useAuthStore((state) => state.setRole);
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout();
    queryClient.clear();
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "CREATOR":
        return <span className="rounded bg-peach px-1.5 py-0.5 text-[10px] font-extrabold text-ink">CREATOR</span>;
      case "ADMIN":
        return <span className="rounded bg-mint px-1.5 py-0.5 text-[10px] font-extrabold text-ink">ADMIN</span>;
      default:
        return <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-extrabold text-mist">BACKER</span>;
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b-2 border-ink bg-surface px-6 py-3.5 gap-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-ink shrink-0">
          <Mascot variant="face" className="h-8 w-8" />
          Earlybird
        </Link>

        {/* Top Header Line Navigation: Home, Projects, Top Categories with Hover Menus, Cart, Orders */}
        <nav className="hidden items-center gap-4 text-sm font-medium text-ink/80 md:flex">
          <Link to="/" className="font-bold transition-colors hover:text-brand">
            홈
          </Link>
          <Link to="/projects" className="font-bold transition-colors hover:text-brand">
            전체 프로젝트
          </Link>

          {/* Top Categories with Hover Dropdown Menus (Replacing old search bar) */}
          <HeaderCategoryNav />

          {/* Role-specific Nav Links */}
          {user?.role === "CREATOR" && (
            <>
              <Link to="/projects/new" className="font-bold text-brand transition-colors hover:underline">
                + 프로젝트 만들기
              </Link>
              <Link to="/projects/me" className="font-bold transition-colors hover:text-brand">
                내 프로젝트
              </Link>
              <Link to="/settlements" className="font-bold transition-colors hover:text-brand">
                정산 관리
              </Link>
            </>
          )}

          {user?.role === "ADMIN" && (
            <>
              <Link to="/admin/categories" className="font-bold text-brand transition-colors hover:underline">
                📁 카테고리 관리
              </Link>
              <Link to="/admin/approvals" className="font-bold text-brand transition-colors hover:underline">
                🛡️ 프로젝트 심사
              </Link>
            </>
          )}

          <Link to="/cart" className="font-bold transition-colors hover:text-brand">
            장바구니
          </Link>
          <Link to="/orders" className="font-bold transition-colors hover:text-brand">
            주문
          </Link>
          <Link to="/notifications" className="font-bold transition-colors hover:text-brand">
            알림
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 outline-none transition-colors hover:text-brand ml-2">
                {getRoleBadge(user.role)}
                <span className="font-bold text-ink">{user.name}님</span>
                <ChevronDownIcon className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-xs text-mist">
                  역할: <strong className="text-ink">{user.role}</strong>
                </div>
                <DropdownMenuSeparator className="my-1 h-px bg-ink/15" />

                <DropdownMenuItem asChild>
                  <Link to="/projects/me">내 프로젝트 목록</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/orders">내 주문 내역</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settlements">정산 현황</Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 h-px bg-ink/15" />
                <div className="px-2 py-1 text-[11px] font-semibold text-mist">역할 즉시 전환 (테스트용)</div>
                <DropdownMenuItem onSelect={() => setRole("BACKER")}>
                  후원자(BACKER)로 전환
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRole("CREATOR")}>
                  창작자(CREATOR)로 전환
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRole("ADMIN")}>
                  관리자(ADMIN)로 전환
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 h-px bg-ink/15" />
                <DropdownMenuItem onSelect={handleLogout} className="text-red-600">
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" className="transition-colors hover:text-brand font-bold ml-2">
              로그인
            </Link>
          )}
        </nav>

        {/* Mobile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="메뉴 열기"
            className="flex items-center justify-center rounded-sm border-2 border-ink p-1.5 text-ink outline-none md:hidden"
          >
            <Menu className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[14rem]">
            <DropdownMenuItem asChild>
              <Link to="/">홈</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/projects">전체 프로젝트 / 검색</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/cart">장바구니</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/orders">주문 내역</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/notifications">알림</Link>
            </DropdownMenuItem>

            {user && (
              <>
                <DropdownMenuSeparator className="my-1 h-px bg-ink/15" />
                <DropdownMenuItem asChild>
                  <Link to="/projects/new">+ 프로젝트 만들기</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/projects/me">내 프로젝트 관리</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/categories">📁 카테고리 관리</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/approvals">🛡️ 프로젝트 심사</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 h-px bg-ink/15" />
                <DropdownMenuItem onSelect={() => setRole(user.role === "ADMIN" ? "CREATOR" : user.role === "CREATOR" ? "BACKER" : "ADMIN")}>
                  역할 전환 ({user.role} ➔ 토글)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleLogout} className="text-red-600">
                  {user.name}님 로그아웃
                </DropdownMenuItem>
              </>
            )}
            {!user && (
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
      <FloatingCartBar />
    </div>
  );
}
