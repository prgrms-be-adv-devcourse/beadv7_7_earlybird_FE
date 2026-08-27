import {useMemo, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useQueryClient} from "@tanstack/react-query";
import {motion} from "framer-motion";
import {ArrowRight} from "lucide-react";
import {CardSkeleton, EmptyState, ErrorState, Mascot, Skeleton} from "../../../shared/ui";
import {useAuthStore} from "../../../shared/auth/authStore";
import {logoutRequest} from "../../auth/api";
import {useProjects} from "../../projects/hooks";
import {useCategories} from "../../admin/hooks";
import {ProjectCard} from "../../projects/components/ProjectCard";
import {getCategoryIdsIncludingChildren} from "../../projects/utils";
import type {ProjectCategory} from "../../admin/types";
import type {ProjectSummary} from "../../projects/types";

function flattenCategoryNames(categories: ProjectCategory[], map: Map<number, string> = new Map()) {
  for (const category of categories) {
    map.set(category.id, category.name);
    if (category.children.length > 0) flattenCategoryNames(category.children, map);
  }
  return map;
}

function Rail({
  title,
  projects,
  categoryNames,
}: {
  title: string;
  projects: ProjectSummary[];
  categoryNames: Map<number, string>;
}) {
  if (projects.length === 0) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-5"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">{title}</h2>
        <Link
          to="/projects"
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-mist transition-colors hover:text-brand"
        >
          전체보기
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pt-2 pb-2"> {/* <-- 카드 호버 시 상단 테두리가 잘리지 않도록 여백을 확보합니다. */}
        {projects.map((project) => (
          <ProjectCard
            key={project.projectId}
            project={project}
            categoryName={categoryNames.get(project.categoryId)}
            className="w-64 shrink-0 snap-start"
          />
        ))}
      </div>
    </motion.section>
  );
}

export function HomePage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: projects, isPending, isError, error } = useProjects();
  const { data: categories } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // 추가 : 홈 푸터에서 서버 로그아웃 후 로컬 인증 상태를 정리합니다.
  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch (error) {
      console.warn("Logout request failed:", error);
    } finally {
      logout();
      queryClient.clear();
      navigate("/", {replace: true}); // <-- 로그아웃 후 홈으로 이동합니다.
      window.scrollTo({top: 0, behavior: "smooth"}); // <-- 홈 화면 최상단을 표시합니다.
    }
  };

  const categoryNames = useMemo(() => flattenCategoryNames(categories ?? []), [categories]);

  const { endingSoon, popular, freshest, successStories, inProgressCount } = useMemo(() => {
    const list = projects ?? [];
    const inProgress = list.filter((project) => project.status === "IN_PROGRESS");
    return {
      endingSoon: [...inProgress]
        .sort((a, b) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime())
        .slice(0, 8),
      popular: [...inProgress].sort((a, b) => b.fundedAmount - a.fundedAmount).slice(0, 8),
      freshest: [...inProgress]
        .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
        .slice(0, 8),
      successStories: list.filter((project) => project.status === "SUCCEEDED").slice(0, 8),
      inProgressCount: inProgress.length,
    };
  }, [projects]);

  const selectedCategoryProjects = useMemo(() => {
    if (!selectedCategoryId) return [];

    const categoryIds = getCategoryIdsIncludingChildren(categories ?? [], selectedCategoryId);
    return (projects ?? [])
      .filter((project) => categoryIds.includes(project.categoryId) && project.status === "IN_PROGRESS")
      .sort((a, b) => b.fundedAmount - a.fundedAmount); // <-- 선택 카테고리의 인기 프로젝트를 먼저 표시합니다.
  }, [categories, projects, selectedCategoryId]);
  const selectedCategoryName = categories?.find((category) => category.id === selectedCategoryId)?.name ?? "카테고리";

  if (isPending) {
    return (
      <div className="flex flex-col gap-16">
        <div className="flex flex-col gap-4 rounded-sm border-2 border-ink/15 bg-surface px-8 py-16 sm:px-14">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-4 h-10 w-40" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-5 overflow-x-hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <CardSkeleton key={index} className="w-64 shrink-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (isError || !projects) {
    const errorMsg =
      (error as any)?.response?.data?.error?.message ||
      (error as any)?.response?.data?.message ||
      (error as Error)?.message ||
      "프로젝트 목록을 불러오지 못했습니다.";
    return <ErrorState error={{ message: errorMsg, errors: null }} />;
  }

  return (
    <div className="flex flex-col gap-12 sm:gap-16"> {/* <-- 히어로와 카테고리 섹션 사이 간격을 줄입니다. */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-sm border-2 border-ink bg-[linear-gradient(135deg,#FF7A45_0%,#FF9A56_45%,#FFC169_100%)] px-6 py-14 shadow-stamp sm:px-12 sm:py-20 lg:px-16"
      >
        <div className="relative grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="relative z-10 max-w-xl">
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              새로운 아이디어를
              <br />
              누구보다 먼저
              <br />
              발견해요
            </h1>
            <p className="mt-5 max-w-lg break-keep text-base leading-relaxed text-ink/75 sm:text-lg">
              IT・디자인・라이프스타일, 아직 세상에 나오지 않은 프로젝트를 가장 먼저 만나는 감성 크라우드펀딩.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 rounded-sm border-2 border-ink bg-ink px-7 py-3.5 text-base font-bold text-white shadow-stamp-sm transition-transform duration-100 ease-out hover:-translate-y-0.5 active:translate-y-0"
              >
                프로젝트 둘러보기
                <ArrowRight className="h-4 w-4" />
              </Link>
              {inProgressCount > 0 && (
                <span className="text-sm font-semibold text-ink/75">
                  지금 <span className="tabular-nums text-ink">{inProgressCount}개</span> 프로젝트가 진행 중이에요
                </span>
              )}
            </div>
          </div>

          <div className="relative mx-auto flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80 lg:ml-auto lg:h-[26rem] lg:w-[26rem]">
            <div className="absolute inset-4 rounded-full bg-white/30 blur-3xl" aria-hidden />
            <img
              src="/character-crop.png"
              alt=""
              aria-hidden
              className="relative h-full w-full rotate-3 object-contain drop-shadow-[0_20px_32px_rgba(43,36,24,0.35)]"
            />
          </div>
        </div>
      </motion.section>

      {categories && categories.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col gap-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">카테고리로 둘러보기</h2>
            <span className="shrink-0 text-xs font-bold text-brand sm:hidden">옆으로 밀어보기 →</span> {/* <-- 모바일에서 가로 스와이프를 직접 안내합니다. */}
          </div>
          <div className="flex w-full touch-pan-x gap-3 overflow-x-scroll pb-2 pr-10 sm:flex-wrap sm:overflow-x-visible sm:pr-0"> {/* <-- 모바일에서 다음 카테고리가 일부 보이도록 여백을 둡니다. */}
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategoryId((currentId) => currentId === category.id ? null : category.id)}
                className={`shrink-0 rounded-sm border-2 border-ink px-4 py-2 text-sm font-semibold shadow-stamp-sm transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-stamp-lg ${ // <-- 선택한 카테고리는 홈에서 바로 필터링합니다.
                  selectedCategoryId === category.id
                    ? "bg-brand text-white"
                    : "bg-surface text-ink"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </motion.section>
      )}

      <div className="-mt-4 flex flex-col gap-16 sm:-mt-6 sm:gap-20"> {/* <-- 카테고리와 프로젝트 목록 사이 간격을 줄입니다. */}
        {selectedCategoryId ? (
          <section className="flex flex-col gap-5"> {/* <-- 선택 카테고리의 프로젝트를 최대 8개 그리드로 표시합니다. */}
            <div className="flex items-center justify-between gap-4">
              <h2 className="flex min-w-0 items-center gap-2 font-display text-2xl font-bold tracking-tight text-ink"> {/* <-- 인기 배지와 카테고리명을 수직 중앙으로 맞춥니다. */}
                <span>{selectedCategoryName} 프로젝트</span>
                <span className="rounded-sm bg-brand/15 px-2 py-1 font-sans text-sm font-semibold text-brand">인기순</span> {/* <-- 현재 적용된 인기순 정렬을 배지로 표시합니다. */}
              </h2>
              <Link
                to={`/projects?category=${selectedCategoryId}`}
                onClick={() => window.scrollTo({top: 0, behavior: "smooth"})} // <-- 전체 프로젝트 페이지 최상단으로 부드럽게 이동합니다.
                className="flex shrink-0 items-center gap-1 text-sm font-semibold text-mist transition-colors hover:text-brand"
              >
                전체보기
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <motion.div
              key={selectedCategoryId}
              className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4" // <-- 모바일에서는 프로젝트를 한 행에 하나씩 표시합니다.
            >
              {selectedCategoryProjects.slice(0, 8).map((project, index) => ( // <-- 정렬된 카테고리 프로젝트를 최대 8개 표시합니다.
                <motion.div
                  key={project.projectId}
                  initial={{opacity: 0, y: -8}}
                  animate={{opacity: 1, y: 0}}
                  transition={{duration: 0.2, delay: index * 0.05, ease: "easeOut"}}
                >
                  <ProjectCard
                    project={project}
                    categoryName={categoryNames.get(project.categoryId)}
                  />
                </motion.div>
              ))}
            </motion.div>
            <Link
              to={`/projects?category=${selectedCategoryId}`}
              onClick={() => window.scrollTo({top: 0, behavior: "smooth"})} // <-- 전체 프로젝트 페이지 최상단으로 부드럽게 이동합니다.
              className="flex items-center gap-1 self-end text-sm font-semibold text-mist transition-colors hover:text-brand" // <-- 상단 전체보기와 같은 스타일로 오른쪽에 배치합니다.
            >
              전체보기
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        ) : (
          <>
            <Rail title="인기 프로젝트" projects={popular} categoryNames={categoryNames} />
            <Rail title="마감임박" projects={endingSoon} categoryNames={categoryNames} />
            <Rail title="신규 프로젝트" projects={freshest} categoryNames={categoryNames} />
          </>
        )}
        <Rail title="성공 사례" projects={successStories} categoryNames={categoryNames} />
      </div>

      {projects.length === 0 && <EmptyState message="아직 등록된 프로젝트가 없어요." />}

      <footer className="flex flex-col gap-3 border-t-2 border-ink pt-8 text-sm text-mist">
        <div className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <Mascot variant="face" className="h-7 w-7" />
          Earlybird
        </div>
        <p>새로운 아이디어를 누구보다 먼저 발견하고 함께 성장시키는 감성 크라우드펀딩 플랫폼.</p>
        <div className="flex gap-4">
          <Link to="/projects" className="hover:text-ink">전체 프로젝트</Link>
          {user ? (
            <button type="button" onClick={handleLogout} className="hover:text-ink"> {/* <-- 로그인 상태에서는 로그아웃 API를 호출합니다. */}
              로그아웃
            </button>
          ) : (
            <Link to="/login" className="hover:text-ink">로그인</Link>
          )}
        </div>
      </footer>
    </div>
  );
}
