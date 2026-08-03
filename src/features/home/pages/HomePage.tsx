import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { CardSkeleton, EmptyState, ErrorState, Mascot, Skeleton, buttonClassName } from "../../../shared/ui";
import { useProjects } from "../../projects/hooks";
import { useCategories } from "../../admin/hooks";
import { ProjectCard } from "../../projects/components/ProjectCard";
import type { ProjectCategory } from "../../admin/types";
import type { ProjectSummary } from "../../projects/types";

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
      className="flex flex-col gap-4"
    >
      <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      <div className="flex gap-5 overflow-x-auto pb-2">
        {projects.map((project) => (
          <ProjectCard
            key={project.projectId}
            project={project}
            categoryName={categoryNames.get(project.categoryId)}
            className="w-64 shrink-0"
          />
        ))}
      </div>
    </motion.section>
  );
}

export function HomePage() {
  const { data: projects, isPending, isError } = useProjects();
  const { data: categories } = useCategories();

  const categoryNames = useMemo(() => flattenCategoryNames(categories ?? []), [categories]);

  const { endingSoon, popular, freshest, successStories } = useMemo(() => {
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
    };
  }, [projects]);

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
    return <ErrorState error={{ message: "프로젝트 목록을 불러오지 못했습니다.", errors: null }} />;
  }

  return (
    <div className="flex flex-col gap-16">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-sm border-2 border-ink bg-surface px-8 py-16 shadow-stamp sm:px-14"
      >
        <Mascot className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rotate-6 sm:h-32 sm:w-32" />
        <p className="relative mb-3 text-sm font-bold uppercase tracking-widest text-brand">Early Bird</p>
        <h1 className="relative max-w-2xl font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
          새로운 아이디어를 누구보다 먼저 발견하고, 함께 성장시켜요
        </h1>
        <p className="relative mt-4 max-w-xl text-base text-mist">
          IT・디자인・라이프스타일, 아직 세상에 나오지 않은 프로젝트를 가장 먼저 만나는 감성 크라우드펀딩.
        </p>
        <Link to="/projects" className={buttonClassName("primary", "relative mt-8 gap-2")}>
          프로젝트 둘러보기
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.section>

      {categories && categories.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col gap-4"
        >
          <h2 className="font-display text-xl font-bold text-ink">카테고리로 둘러보기</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/projects?category=${category.id}`}
                className="rounded-sm border-2 border-ink bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-stamp-sm transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-stamp-lg"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      <Rail title="마감임박" projects={endingSoon} categoryNames={categoryNames} />
      <Rail title="인기 프로젝트" projects={popular} categoryNames={categoryNames} />
      <Rail title="신규 프로젝트" projects={freshest} categoryNames={categoryNames} />
      <Rail title="성공 사례" projects={successStories} categoryNames={categoryNames} />

      {projects.length === 0 && <EmptyState message="아직 등록된 프로젝트가 없어요." />}

      <footer className="flex flex-col gap-3 border-t-2 border-ink pt-8 text-sm text-mist">
        <div className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <Mascot variant="face" className="h-7 w-7" />
          Earlybird
        </div>
        <p>새로운 아이디어를 누구보다 먼저 발견하고 함께 성장시키는 감성 크라우드펀딩 플랫폼.</p>
        <div className="flex gap-4">
          <Link to="/projects" className="hover:text-ink">전체 프로젝트</Link>
          <Link to="/login" className="hover:text-ink">로그인</Link>
        </div>
      </footer>
    </div>
  );
}
