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
import { CategoryNav } from "../components/CategoryNav";
import {
  getCreatorDisplayName,
  getCategoryIdsIncludingChildren,
} from "../utils";

const ALL = "ALL";

export function ProjectListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial filter values from URL params
  const urlKeyword = searchParams.get("keyword") || "";
  const initialCategory = searchParams.get("category") || ALL;
  const initialStatus = searchParams.get("status") || ALL;
  const initialSort = searchParams.get("sort") || "LATEST";
  const initialCreatorId = searchParams.get("creatorId") || ALL;

  const [inputKeyword, setInputKeyword] = useState(urlKeyword);
  const [keyword, setKeyword] = useState(urlKeyword);
  const [status, setStatus] = useState(initialStatus);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [creatorId, setCreatorId] = useState(initialCreatorId);

  // Sync state if URL searchParams change externally
  useEffect(() => {
    const currentUrlKeyword = searchParams.get("keyword") || "";
    const currentCreatorId = searchParams.get("creatorId") || ALL;
    const currentCategory = searchParams.get("category") || ALL;
    const currentStatus = searchParams.get("status") || ALL;
    const currentSort = searchParams.get("sort") || "LATEST";

    setInputKeyword(currentUrlKeyword);
    setKeyword(currentUrlKeyword);
    setCreatorId(currentCreatorId);
    setCategoryId(currentCategory);
    setStatus(currentStatus);
    setSort(currentSort);
  }, [searchParams]);

  // Debounce inputKeyword changes into active query keyword
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(inputKeyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputKeyword]);

  // Sync URL query params with current filter state
  useEffect(() => {
    const params: Record<string, string> = {};
    if (keyword.trim()) params.keyword = keyword.trim();
    if (categoryId !== ALL) params.category = categoryId;
    if (status !== ALL) params.status = status;
    if (sort !== "LATEST") params.sort = sort;
    if (creatorId !== ALL) params.creatorId = creatorId;
    setSearchParams(params, { replace: true });
  }, [keyword, categoryId, status, sort, creatorId, setSearchParams]);

  // Fetch projects passing params
  const { data: projects, isPending, isError, error } = useProjects({
    keyword: keyword.trim() || undefined,
    status: status !== ALL ? status : undefined,
    sort,
  });

  const { data: categories } = useCategories();

  const statusOptions = useMemo(
    () => Array.from(new Set((projects ?? []).map((project) => project.status))),
    [projects]
  );

  // Filter & sort including parent/child category tree matching
  const filteredAndSorted = useMemo(() => {
    if (!projects) return [];

    // Keyword filtering happens server-side (hybrid keyword + semantic search) via useProjects'
    // `keyword` param — re-filtering by literal substring here would drop semantic-only matches
    // (e.g. "냥이" matching "고양이 자동 급식기" via embedding similarity, not literal text).
    let list = projects;

    if (status !== ALL) {
      list = list.filter((project) => project.status === status);
    }

    if (categoryId !== ALL) {
      const validCategoryIds = getCategoryIdsIncludingChildren(categories ?? [], Number(categoryId));
      list = list.filter((project) => validCategoryIds.includes(project.categoryId));
    }

    if (creatorId !== ALL) {
      list = list.filter((project) => String(project.creatorId) === creatorId);
    }

    // Client-side sort fallback
    if (sort === "DEADLINE") {
      list = [...list].sort((a, b) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime());
    } else if (sort === "FUNDED_AMOUNT") {
      list = [...list].sort((a, b) => b.fundedAmount - a.fundedAmount);
    } else if (sort === "LATEST") {
      list = [...list].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
    }

    return list;
  }, [projects, status, categoryId, creatorId, sort, categories]);

  const handleClearSearch = () => {
    setInputKeyword("");
    setKeyword("");
  };

  const errorMsg =
    (error as any)?.response?.data?.error?.message ||
    (error as any)?.response?.data?.message ||
    (error as Error)?.message ||
    "프로젝트 목록을 불러오지 못했습니다.";

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-ink/10 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">🔍 프로젝트 탐색 및 검색</h1>
          <p className="text-xs text-mist">원하는 카테고리에 마우스를 올려 하위 카테고리를 확인하거나 키워드로 검색해 보세요.</p>
        </div>
        <Link
          to="/projects/new"
          className="rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-stamp transition-transform hover:scale-105"
        >
          + 프로젝트 만들기
        </Link>
      </div>

      {/* Sleek Top Horizontal Category Navigation Bar with Hover Subcategories Menu */}
      <CategoryNav activeCategoryId={categoryId} onSelectCategory={setCategoryId} />

      {/* Search Bar & Secondary Filter Controls */}
      <div className="flex flex-col gap-3 rounded-lg border border-ink/15 bg-paper/60 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          {/* Search Input Bar */}
          <div className="relative flex items-center flex-1 w-full">
            <Search className="absolute left-3.5 h-4 w-4 text-mist" />
            <input
              type="text"
              placeholder="프로젝트 제목 또는 한 줄 요약으로 검색..."
              value={inputKeyword}
              onChange={(e) => setInputKeyword(e.target.value)}
              className="w-full rounded-full border border-ink/20 bg-surface pl-10 pr-10 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
            />
            {inputKeyword && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink/10 text-ink/60 hover:bg-ink/20 hover:text-ink"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

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

          {(keyword || categoryId !== ALL || status !== ALL || sort !== "LATEST" || creatorId !== ALL) && (
            <button
              type="button"
              onClick={() => {
                setInputKeyword("");
                setKeyword("");
                setCategoryId(ALL);
                setStatus(ALL);
                setSort("LATEST");
                setCreatorId(ALL);
              }}
              className="text-xs font-semibold text-brand hover:underline shrink-0"
            >
              초기화 🔄
            </button>
          )}
        </div>

        {/* Active Creator Filter Banner */}
        {creatorId !== ALL && (
          <div className="mt-1 rounded-sm bg-brand/10 border border-brand/20 p-2.5 text-xs flex items-center justify-between">
            <span>
              👤 <strong className="text-ink">{getCreatorDisplayName(Number(creatorId))}</strong> 창작자의 개설 프로젝트 목록을 보는 중입니다.
            </span>
            <button
              type="button"
              onClick={() => setCreatorId(ALL)}
              className="text-brand font-bold hover:underline"
            >
              전체 창작자 보기 ✕
            </button>
          </div>
        )}
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

      {/* Grid Content / Skeletons / Error / Empty */}
      {isPending && (!projects || (projects as any[]).length === 0) ? (
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={{ message: errorMsg!, errors: null }} />
      ) : filteredAndSorted.length === 0 ? (
        <EmptyState message="조건에 맞는 프로젝트가 없어요. 다른 키워드나 카테고리로 검색해 보세요." />
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
