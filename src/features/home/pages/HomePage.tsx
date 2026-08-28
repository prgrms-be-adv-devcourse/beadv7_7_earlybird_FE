import {useEffect, useMemo, useState} from "react";
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

const HERO_SLIDES = [
  {
    title: ["새로운 아이디어를", "누구보다 먼저", "발견해요"],
    description: "IT・디자인・라이프스타일, 아직 세상에 나오지 않은 프로젝트를 가장 먼저 만나보세요.",
    link: "/projects",
    linkLabel: "프로젝트 둘러보기",
    background: "bg-[linear-gradient(135deg,#FF7A45_0%,#FF9A56_45%,#FFC169_100%)]",
  },
  {
    title: ["재밌는 아이디어를", "누구보다 먼저", "응원해요"],
    description: "마음에 드는 프로젝트를 발견하고 얼리버드만의 특별한 리워드를 만나보세요.",
    link: "/projects?sort=LATEST",
    linkLabel: "새 프로젝트 보기",
    background: "bg-[linear-gradient(135deg,#7DD3C7_0%,#A7E3D8_48%,#D8F1D5_100%)]",
  },
  {
    title: ["같이 만든 성공으로", "새로운 일상으로", "나아가요"],
    description: "후원자의 선택으로 세상에 나온 프로젝트와 성공 이야기를 확인해 보세요.",
    link: "/projects?status=SUCCEEDED",
    linkLabel: "성공 프로젝트 보기",
    background: "bg-[linear-gradient(135deg,#C9B8F4_0%,#E2C7F5_48%,#FFD7C8_100%)]",
  },
] as const;
const HERO_SLIDE_INTERVAL_SECONDS = 6;
const CATEGORY_IMAGE_URLS: Record<string, string> = {
  "패션": "/category/fashion.png",
  "반려동물": "/category/pet.png",
  "전자기기": "/category/electronic.png",
  "도서·출판": "/category/book.png",
};

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
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setActiveHeroSlide((slide) => (slide + 1) % HERO_SLIDES.length),
      HERO_SLIDE_INTERVAL_SECONDS * 1000,
    ); // <-- 마지막 조작 후 10초마다 다음 히어로 슬라이드로 이동합니다.
    return () => window.clearTimeout(timer);
  }, [activeHeroSlide]);
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
  const heroSlide = HERO_SLIDES[activeHeroSlide];

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
        className="relative mr-8 sm:mr-14" // <-- 오른쪽 다음 카드가 뒤로 보일 공간을 둡니다.
      >
        <button
          type="button"
          aria-label="다음 슬라이드 보기"
          onClick={() => setActiveHeroSlide((slide) => (slide + 1) % HERO_SLIDES.length)}
          className={`absolute inset-y-5 -right-8 left-5 z-0 overflow-hidden rounded-sm border-2 border-ink shadow-stamp transition-transform hover:translate-x-1 sm:-right-14 sm:left-8 ${HERO_SLIDES[(activeHeroSlide + 1) % HERO_SLIDES.length].background}`} // <-- 다음 슬라이드 카드를 더 넓게 노출합니다.
        >
          <img
            src="/character-crop.png"
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute right-0 top-1/2 h-56 w-56 -translate-y-1/2 translate-x-1/3 select-none object-contain opacity-80"
          />
          <span className="pointer-events-none absolute inset-0 bg-ink/20" aria-hidden /> {/* <-- 뒤쪽 카드를 살짝 어둡게 표시합니다. */}
        </button>
        <div className={`relative z-10 min-h-[34rem] overflow-hidden rounded-sm border-2 border-ink px-6 py-14 shadow-stamp transition-colors duration-500 sm:px-12 sm:py-20 lg:px-16 ${heroSlide.background}`}> {/* <-- 슬라이드마다 글자 위치가 밀리지 않도록 카드 높이를 유지합니다. */}
        <motion.div
          key={activeHeroSlide}
          initial={{opacity: 0, x: 48}}
          animate={{opacity: 1, x: 0}}
          transition={{duration: 0.35, ease: "easeOut"}}
          drag="x"
          dragConstraints={{left: 0, right: 0}}
          dragElastic={0.15}
          onDragEnd={(_, info) => { // <-- 좌우 스와이프로 이전·다음 슬라이드를 표시합니다.
            if (info.offset.x < -50) setActiveHeroSlide((slide) => (slide + 1) % HERO_SLIDES.length);
            if (info.offset.x > 50) setActiveHeroSlide((slide) => (slide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
          }}
          className="relative grid min-h-[26rem] cursor-grab gap-8 active:cursor-grabbing lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center lg:gap-10" // <-- 캐릭터 전용 폭을 제외한 왼쪽 공간을 문구가 모두 사용합니다.
        >
          <div className="relative z-10 min-w-0">
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              {heroSlide.title.map((line) => <span key={line} className="block">{line}</span>)}
            </h1>
            <p className="mt-5 min-h-14 break-keep text-base leading-relaxed text-ink/75 sm:text-lg"> {/* <-- 설명 길이가 달라도 아래 버튼 위치를 유지합니다. */}
              {heroSlide.description}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link
                to={heroSlide.link}
                className="inline-flex items-center gap-2 rounded-sm border-2 border-ink bg-ink px-7 py-3.5 text-base font-bold text-white shadow-stamp-sm transition-transform duration-100 ease-out hover:-translate-y-0.5 active:translate-y-0"
              >
                {heroSlide.linkLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {inProgressCount > 0 && (
                <span className="text-sm font-semibold text-ink/75">
                  지금 <span className="tabular-nums text-ink">{inProgressCount}개</span> 프로젝트가 진행 중이에요
                </span>
              )}
            </div>
          </div>

          <div className="relative mx-auto flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80 lg:h-80 lg:w-80"> {/* <-- 캐릭터 영역을 고정해 문구와 겹치지 않게 합니다. */}
            <div className="absolute inset-4 rounded-full bg-white/30 blur-3xl" aria-hidden />
            <img
              src="/character-crop.png"
              alt=""
              aria-hidden
              draggable={false}
              className="pointer-events-none relative h-full w-full select-none rotate-3 object-contain drop-shadow-[0_20px_32px_rgba(43,36,24,0.35)]" // <-- 캐릭터 이미지 자체의 클릭·드래그를 막습니다.
            />
          </div>
        </motion.div>
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5"> {/* <-- 네모 버튼 아래에 자동 전환 게이지를 배치합니다. */}
          <div className="flex gap-3"> {/* <-- 슬라이드 버튼 사이 간격을 넓힙니다. */}
            {HERO_SLIDES.map((slide, index) => (
              <button
                key={slide.linkLabel}
                type="button"
                aria-label={`${index + 1}번 슬라이드 보기`}
                aria-current={activeHeroSlide === index}
                onClick={() => setActiveHeroSlide(index)}
                className={`h-3 w-3 rounded-[2px] border border-ink transition-colors ${activeHeroSlide === index ? "bg-ink" : "bg-white/60 hover:bg-white"}`}
              />
            ))}
          </div>
          <span
            role="progressbar"
            aria-label="다음 슬라이드까지 남은 시간"
            aria-valuemin={0}
            aria-valuemax={HERO_SLIDE_INTERVAL_SECONDS}
            className="h-1.5 w-12 overflow-hidden rounded-full bg-white/50" // <-- 남은 시간을 작은 가로 게이지로 표시합니다.
          >
            <motion.span
              key={activeHeroSlide} // <-- 슬라이드 전환 시 게이지를 애니메이션 없이 즉시 채웁니다.
              initial={{width: "100%"}}
              animate={{width: "0%"}}
              transition={{duration: HERO_SLIDE_INTERVAL_SECONDS, ease: "linear"}}
              className="block h-full rounded-full bg-ink"
            />
          </span>
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
                className={`flex w-20 shrink-0 flex-col items-center text-center text-sm font-semibold transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-stamp-lg ${CATEGORY_IMAGE_URLS[category.name] ? "gap-0" : "gap-2 rounded-sm border-2 border-ink px-2 py-2"} ${ // <-- 이미지 카테고리는 이미지·글자 두 박스를 붙여 표시합니다.
                  CATEGORY_IMAGE_URLS[category.name]
                    ? ""
                    : selectedCategoryId === category.id ? "bg-brand text-white" : "bg-surface text-ink"
                }`}
              >
                {CATEGORY_IMAGE_URLS[category.name] && (
                  <>
                    <span className="flex h-20 w-full items-center justify-center rounded-t-sm border-2 border-ink border-b-2 border-b-ink/20 bg-surface" aria-hidden> {/* <-- 이미지 박스를 조금 키우고 아래 경계를 연하게 표시합니다. */}
                      <img
                        src={CATEGORY_IMAGE_URLS[category.name]} // <-- 카테고리 추가 시 상단 매핑에 이미지 경로만 등록합니다.
                        alt=""
                        draggable={false}
                        className="pointer-events-none h-full w-full scale-150 select-none object-contain" // <-- 원본 여백을 보정해 실제 그림을 크게 표시합니다.
                      />
                    </span>
                  </>
                )}
                <span className={`w-full ${CATEGORY_IMAGE_URLS[category.name] ? `-mt-0.5 rounded-b-sm border-2 border-ink border-t-2 border-t-ink/20 px-2 py-2 ${selectedCategoryId === category.id ? "bg-brand text-white" : "bg-surface text-ink"}` : ""}`}>{category.name}</span> {/* <-- 이미지 박스 아래에 글자 박스를 붙이고 위 경계를 연하게 표시합니다. */}
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
