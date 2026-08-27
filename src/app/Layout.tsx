import {useState} from "react";
import {Link, Outlet, useLocation, useNavigate} from "react-router-dom";
import {useQueryClient} from "@tanstack/react-query";
import {AnimatePresence, motion} from "framer-motion";
import {Menu} from "lucide-react";
import {
  ChevronDownIcon,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Mascot,
} from "../shared/ui";
import {useAuthStore} from "../shared/auth/authStore";
import {FloatingCartBar} from "../features/cart/components/FloatingCartBar";
import {ChatWidget} from "../features/chat/components/ChatWidget";
import {useCategories} from "../features/admin/hooks";
import type {ProjectCategory} from "../features/admin/types";
import {logoutRequest} from "../features/auth/api";
import {useSwitchRole} from "../features/auth/hooks";


function CategoryTreeItem({
  category,
  depth = 1,
  onSelect,
}: {
  category: ProjectCategory;
  depth?: number;
  onSelect: (id: number) => void;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const prefix = depth === 1 ? "└ " : "• ";

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={() => onSelect(category.id)}
        className={`flex w-full items-center justify-between rounded py-2.5 text-left text-sm font-bold transition-colors sm:py-1 sm:text-xs ${ // <-- 모바일 하위 카테고리의 터치 영역과 글씨를 키웁니다.
          depth === 1
            ? "px-2.5 text-ink hover:bg-paper/80 hover:text-brand"
            : "px-2 text-mist hover:text-brand font-semibold"
        }`}
      >
        <span>{prefix}{category.name}</span>
      </button>

      {hasChildren && (
        <div className="ml-3 flex flex-col gap-0.5 border-l-2 border-brand/20 pl-2 my-0.5">
          {category.children.map((child) => (
            <CategoryTreeItem key={child.id} category={child} depth={depth + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function HeaderCategoryNav() {
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const topCategories = categories ?? [];
  const [mobileOpenCategoryId, setMobileOpenCategoryId] = useState<number | null>(null);

  const handleSelect = (catId: number) => {
    navigate(`/projects?category=${catId}`);
  };

  const handleTopCategoryClick = (catId: number, hasChildren: boolean) => {
    if (hasChildren && window.matchMedia("(max-width: 639px)").matches) {
      setMobileOpenCategoryId((currentId) => currentId === catId ? null : catId);
      return;
    }
    handleSelect(catId);
  };

  const mobileOpenCategory = topCategories.find((category) => category.id === mobileOpenCategoryId);

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 overflow-x-auto px-6 py-2 touch-pan-x no-scrollbar sm:overflow-visible"> {/* <-- 모바일에서 상위 카테고리만 좌우로 스크롤합니다. */}
        <Link
          to="/projects"
          className="shrink-0 border-r border-ink/15 pr-3 text-xs font-black text-brand hover:underline"
        >
          📁 전체 카테고리
        </Link>
        <div className="flex w-max items-center gap-1">
          {topCategories.map((topCat) => {
            const hasChildren = topCat.children && topCat.children.length > 0;
            return (
              <div key={topCat.id} className="group relative">
                <button
                  type="button"
                  onClick={() => handleTopCategoryClick(topCat.id, hasChildren)}
                  className="flex items-center gap-1 px-2.5 py-1 text-sm font-bold text-ink rounded-md transition-colors hover:bg-brand/10 hover:text-brand whitespace-nowrap"
                >
                  <span>{topCat.name}</span>
                  {hasChildren && (
                    <ChevronDownIcon className="h-3.5 w-3.5 text-mist transition-transform duration-200 group-hover:rotate-180" />
                  )}
                </button>

                {hasChildren && (
                  <div className="invisible absolute left-0 top-full z-50 hidden pt-1.5 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 sm:block">
                    <div className="flex max-h-[400px] min-w-[200px] flex-col gap-0.5 overflow-y-auto rounded-lg border-2 border-ink bg-surface p-2.5 shadow-stamp-lg">
                      <button
                        type="button"
                        onClick={() => handleSelect(topCat.id)}
                        className="w-full rounded px-2.5 py-1.5 text-left text-xs font-extrabold text-brand transition-colors hover:bg-brand/10"
                      >
                        전체 {topCat.name} 보기
                      </button>
                      <div className="my-1 h-px bg-ink/15" />

                      {topCat.children.map((subCat) => (
                        <CategoryTreeItem
                          key={subCat.id}
                          category={subCat}
                          depth={1}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {mobileOpenCategory && (
        <div className="border-t border-ink/10 bg-paper/60 px-6 py-2 sm:hidden"> {/* <-- 모바일 하위 카테고리를 스크롤 영역 밖에 펼칩니다. */}
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => handleSelect(mobileOpenCategory.id)}
              className="w-full rounded px-2.5 py-1.5 text-left text-xs font-extrabold text-brand transition-colors hover:bg-brand/10"
            >
              전체 {mobileOpenCategory.name} 보기
            </button>
            {mobileOpenCategory.children.map((subCategory) => (
              <CategoryTreeItem
                key={subCategory.id}
                category={subCategory}
                depth={1}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 페이지마다 배경 톤을 미묘하게 다르게 줘서 "다 똑같은 흰 배경"처럼 보이지 않게 한다.
function getPageTintClass(pathname: string): string {
  if (pathname === "/") return "bg-peach/10";
  if (pathname.startsWith("/projects")) return "bg-mint/10";
  if (pathname.startsWith("/cart") || pathname.startsWith("/orders") || pathname.startsWith("/checkout")) {
    return "bg-lavender/10";
  }
  if (pathname.startsWith("/admin")) return "bg-ink/5";
  return "";
}

export function Layout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  const switchRoleMutation = useSwitchRole();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // 백엔드 세션/토큰 무효화 요청을 비동기로 전송 (네트워크 지연/행으로 인한 UI 블로킹 방지)
    logoutRequest().catch((err) => {
      console.warn("Logout request failed or timed out:", err);
    });
    // 로컬 세션과 쿼리 캐시를 즉시 정리하고 로그인 페이지로 이동
    logout();
    queryClient.clear();
    navigate("/login");
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
    <div
      className={`min-h-screen pb-16 transition-colors duration-500 ${getPageTintClass(location.pathname)}`}
      style={{ backgroundImage: "radial-gradient(rgba(43,36,24,0.05) 1px, transparent 1px)", backgroundSize: "18px 18px" }}
    >
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-surface">
        {/* Upper Main Nav Bar (GNB) */}
        <div className="flex items-center justify-between px-6 py-3 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-ink shrink-0">
            <Mascot variant="face" className="h-8 w-8" />
            Earlybird
          </Link>

          {/* Right Section Navigation */}
          <nav className="hidden items-center gap-4 text-sm font-medium text-ink/80 md:flex">
            <Link to="/" className="font-bold transition-colors hover:text-brand">
              홈
            </Link>
            <Link to="/projects" className="font-bold transition-colors hover:text-brand">
              전체 프로젝트
            </Link>

            {/* Role-specific Nav Links */}
            {user?.role === "BACKER" && (
              <Link to="/creator/apply" className="font-bold text-brand transition-colors hover:underline">
                ✨ 창작자 등록 신청
              </Link>
            )}

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
                <Link to="/admin/creators" className="font-bold text-brand transition-colors hover:underline">
                  👤 창작자 심사
                </Link>
                <Link to="/admin/settlements" className="font-bold text-brand transition-colors hover:underline">
                  💰 정산 관리
                </Link>
              </>
            )}

            <Link to="/cart" className="font-bold transition-colors hover:text-brand">
              장바구니
            </Link>
            <Link to="/orders" className="font-bold transition-colors hover:text-brand">
              주문
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

                  {user.role === "CREATOR" && (
                    <DropdownMenuItem asChild>
                      <Link to="/projects/me">내 프로젝트 목록</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/orders">내 주문 내역</Link>
                  </DropdownMenuItem>
                  {user.role === "BACKER" && (
                    <DropdownMenuItem asChild>
                      <Link to="/creator/apply" className="font-semibold text-brand">
                        ✨ 창작자 등록 신청
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === "ADMIN" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/creators">👤 창작자 심사 관리</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/settlements">정산 내역 관리</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user.role === "CREATOR" && (
                    <DropdownMenuItem asChild>
                      <Link to="/settlements">정산 현황</Link>
                    </DropdownMenuItem>
                  )}

                  {import.meta.env.DEV && (
                    <>
                      <DropdownMenuSeparator className="my-1 h-px bg-ink/15" />
                      <div className="px-2 py-1 text-[11px] font-semibold text-mist">
                        역할 즉시 전환 (개발 전용)
                        {switchRoleMutation.isPending && " ⏳"}
                      </div>
                      <DropdownMenuItem
                        disabled={switchRoleMutation.isPending}
                        onSelect={() => switchRoleMutation.mutate("BACKER")}
                      >
                        후원자(BACKER)로 전환
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={switchRoleMutation.isPending}
                        onSelect={() => switchRoleMutation.mutate("CREATOR")}
                      >
                        창작자(CREATOR)로 전환
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={switchRoleMutation.isPending}
                        onSelect={() => switchRoleMutation.mutate("ADMIN")}
                      >
                        관리자(ADMIN)로 전환
                      </DropdownMenuItem>
                    </>
                  )}

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

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="메뉴 열기"
                className="flex items-center justify-center rounded-sm border-2 border-ink p-1.5 text-ink outline-none"
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

                {user && (
                  <>
                    <DropdownMenuSeparator className="my-1 h-px bg-ink/15" />
                    {user.role === "BACKER" && (
                      <DropdownMenuItem asChild>
                        <Link to="/creator/apply" className="font-bold text-brand">
                          ✨ 창작자 등록 신청
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.role === "CREATOR" && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/projects/new">+ 프로젝트 만들기</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/projects/me">내 프로젝트 관리</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/settlements">정산 관리</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {user.role === "ADMIN" && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/categories">📁 카테고리 관리</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/approvals">🛡️ 프로젝트 심사</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/creators">👤 창작자 심사 관리</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/settlements">💰 정산 내역 관리</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator className="my-1 h-px bg-ink/15" />
                    <DropdownMenuItem
                      disabled={switchRoleMutation.isPending}
                      onSelect={() =>
                        switchRoleMutation.mutate(
                          user.role === "ADMIN"
                            ? "CREATOR"
                            : user.role === "CREATOR"
                              ? "BACKER"
                              : "ADMIN"
                        )
                      }
                    >
                      역할 전환 ({user.role} ➔ 토글) {switchRoleMutation.isPending && "⏳"}
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
          </div>
        </div>

        {/* Lower Sub Category Bar (LNB) - 상시 표시 2단 바 */}
        <div className="relative z-30 border-t border-ink/10 bg-paper/60"> {/* <-- 모바일 하위 카테고리 목록이 스크롤 영역 밖에 펼쳐집니다. */}
          <HeaderCategoryNav />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <FloatingCartBar />
      <ChatWidget />
    </div>
  );
}
