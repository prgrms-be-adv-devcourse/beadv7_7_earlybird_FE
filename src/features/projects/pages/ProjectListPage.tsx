import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import {
  CardSkeleton,
  EmptyState,
  ErrorState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/ui";
import { useProjects } from "../hooks";
import { useCategories } from "../../admin/hooks";
import { ProjectCard } from "../components/ProjectCard";

const ALL = "ALL";

export function ProjectListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial filter values from URL params
  const initialKeyword = searchParams.get("keyword") || "";
  const initialCategory = searchParams.get("category") || ALL;
  const initialStatus = searchParams.get("status") || ALL;
  const initialSort = searchParams.get("sort") || "LATEST";

  const [keyword, setKeyword] = useState(initialKeyword);
  const [status, setStatus] = useState(initialStatus);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);

  // Sync component state with URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (keyword.trim()) params.keyword = keyword.trim();
    if (categoryId !== ALL) params.category = categoryId;
    if (status !== ALL) params.status = status;
    if (sort !== "LATEST") params.sort = sort;
    setSearchParams(params, { replace: true });
  }, [keyword, categoryId, status, sort, setSearchParams]);

  // Fetch projects passing params
  const { data: projects, isPending, isError, error } = useProjects({
    keyword: keyword.trim() || undefined,
    categoryId: categoryId !== ALL ? categoryId : undefined,
    status: status !== ALL ? status : undefined,
    sort,
  });

  const { data: categories } = useCategories();

  const statusOptions = useMemo(
    () => Array.from(new Set((projects ?? []).map((project) => project.status))),
    [projects]
  );

  // Fallback client-side filter and sort to guarantee immediate responsiveness
  const filteredAndSorted = useMemo(() => {
    if (!projects) return [];

    let list = projects.filter((project) => {
      const matchesKeyword =
        !keyword.trim() ||
        project.title.toLowerCase().includes(keyword.trim().toLowerCase()) ||
        (project.summary && project.summary.toLowerCase().includes(keyword.trim().toLowerCase()));

      const matchesStatus = status === ALL || project.status === status;
      const matchesCategory = categoryId === ALL || String(project.categoryId) === categoryId;

      return matchesKeyword && matchesStatus && matchesCategory;
    });

    // Client-side sort fallback
    if (sort === "DEADLINE") {
      list = [...list].sort((a, b) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime());
    } else if (sort === "FUNDED_AMOUNT") {
      list = [...list].sort((a, b) => b.fundedAmount - a.fundedAmount);
    } else if (sort === "LATEST") {
      list = [...list].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
    }

    return list;
  }, [projects, keyword, status, categoryId, sort]);

  const handleClearSearch = () => {
    setKeyword("");
  };

  if (isPending) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-ink">전체 프로젝트</h1>
          <Link
            to="/projects/new"
            className="rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-stamp transition-transform hover:scale-105"
          >
            + 프로젝트 만들기
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    const errorMsg =
      (error as any)?.response?.data?.error?.message ||
      (error as any)?.response?.data?.message ||
      (error as Error)?.message ||
      "프로젝트 목록을 불러오지 못했습니다.";
    return <ErrorState error={{ message: errorMsg, errors: null }} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-ink/10 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">🔍 프로젝트 탐색 및 검색</h1>
          <p className="text-xs text-mist">원하는 키워드, 카테고리, 정렬 기준으로 펀딩 프로젝트를 찾아보세요.</p>
        </div>
        <Link
          to="/projects/new"
          className="rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-stamp transition-transform hover:scale-105"
        >
          + 프로젝트 만들기
        </Link>
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="flex flex-col gap-3 rounded-lg border border-ink/15 bg-paper/60 p-4 shadow-sm">
        {/* Search Bar */}
        <div className="relative flex items-center w-full">
          <Search className="absolute left-3.5 h-4 w-4 text-mist" />
          <input
            type="text"
            placeholder="프로젝트 제목 또는 한 줄 요약으로 검색..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full rounded-full border border-ink/20 bg-surface pl-10 pr-10 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
          />
          {keyword && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink/10 text-ink/60 hover:bg-ink/20 hover:text-ink"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* Category Filter */}
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-44 bg-surface">
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>📁 전체 카테고리</SelectItem>
              {(categories ?? []).map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36 bg-surface">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>🏷️ 전체 상태</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-36 bg-surface">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LATEST">🆕 최신순</SelectItem>
              <SelectItem value="DEADLINE">⏰ 마감임박순</SelectItem>
              <SelectItem value="FUNDED_AMOUNT">🔥 펀딩액순</SelectItem>
            </SelectContent>
          </Select>

          {(keyword || categoryId !== ALL || status !== ALL || sort !== "LATEST") && (
            <button
              type="button"
              onClick={() => {
                setKeyword("");
                setCategoryId(ALL);
                setStatus(ALL);
                setSort("LATEST");
              }}
              className="text-xs font-semibold text-brand hover:underline ml-auto"
            >
              필터 초기화 🔄
            </button>
          )}
        </div>
      </div>

      {/* Result Count Header */}
      <div className="flex items-center justify-between text-xs text-mist px-1">
        <span>
          검색 결과 <strong className="text-ink font-bold">{filteredAndSorted.length}</strong>개
        </span>
        {keyword && (
          <span>
            '<span className="text-brand font-semibold">{keyword}</span>' 검색어 적용 중
          </span>
        )}
      </div>

      {filteredAndSorted.length === 0 ? (
        <EmptyState message="조건에 맞는 프로젝트가 없어요. 다른 키워드나 필터로 검색해 보세요." />
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {filteredAndSorted.map((project) => (
            <ProjectCard key={project.projectId} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
