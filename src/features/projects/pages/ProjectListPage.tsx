import {useEffect, useMemo, useRef, useState} from "react";
import {Link, useSearchParams} from "react-router-dom";
import {Search, X} from "lucide-react";
import {
  CardSkeleton,
  EmptyState,
  ErrorState,
  Reveal,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/ui";
import {useProjects} from "../hooks";
import {useCategories} from "../../admin/hooks";
import {ProjectCard} from "../components/ProjectCard";
import {getCategoryIdsIncludingChildren, getCreatorDisplayName, getStatusLabel,} from "../utils";

import {useAuthStore} from "../../../shared/auth/authStore";

const ALL = "ALL";

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="font-bold text-brand underline decoration-brand/30">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

export function ProjectListPage() {
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial filter values from URL params
  const urlKeyword = searchParams.get("keyword") || "";
  const initialCategory = searchParams.get("category") || ALL;
  const initialStatus = searchParams.get("status") || ALL;
  const initialSort = searchParams.get("sort") || "RELEVANCE";
  const initialCreatorId = searchParams.get("creatorId") || ALL;

  const [inputKeyword, setInputKeyword] = useState(urlKeyword);
  const [keyword, setKeyword] = useState(urlKeyword);
  const [status, setStatus] = useState(initialStatus);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [creatorId, setCreatorId] = useState(initialCreatorId);

  // Autocomplete suggestions state
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const isUpdatingUrlRef = useRef(false); // <-- 내부 필터 변경으로 URL을 갱신하는지 구분합니다.
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Fetch all projects for autocomplete pool
  const { data: rawAllProjects } = useProjects();

  // Compute matching autocomplete items with flexible word & synonym matching
  const suggestions = useMemo(() => {
    const term = inputKeyword.trim().toLowerCase();
    if (!term || !rawAllProjects) return [];

    const words = term.split(/\s+/).filter(Boolean);

    return rawAllProjects
      .filter((p) => {
        const titleLower = p.title.toLowerCase();
        const summaryLower = (p.summary || "").toLowerCase();

        // Exact substring match
        if (titleLower.includes(term) || summaryLower.includes(term)) return true;

        // Word-by-word match
        if (words.some((w) => titleLower.includes(w) || summaryLower.includes(w))) return true;

        // Synonym match (e.g. '냥이' <-> '고양이', '멍멍이' <-> '강아지')
        if (
          (term.includes("냥이") || term.includes("고양이")) &&
          (titleLower.includes("고양이") || titleLower.includes("냥이") || summaryLower.includes("고양이") || summaryLower.includes("냥이"))
        ) {
          return true;
        }

        return false;
      })
      .slice(0, 6);
  }, [inputKeyword, rawAllProjects]);

  // Click outside listener to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync state if URL searchParams change externally
  useEffect(() => {
    if (isUpdatingUrlRef.current) {
      isUpdatingUrlRef.current = false; // <-- 내부 갱신 URL은 입력 중인 검색어에 다시 반영하지 않습니다.
      return;
    }

    const currentUrlKeyword = searchParams.get("keyword") || "";
    const currentCreatorId = searchParams.get("creatorId") || ALL;
    const currentCategory = searchParams.get("category") || ALL;
    const currentStatus = searchParams.get("status") || ALL;
    const currentSort = searchParams.get("sort") || "RELEVANCE";

    setInputKeyword(currentUrlKeyword);
    setKeyword(currentUrlKeyword);
    setCreatorId(currentCreatorId);
    setCategoryId(currentCategory);
    setStatus(currentStatus);
    setSort(currentSort);
  }, [searchParams]);

  // 2-tier 검색:
  //  · 타이핑 중(각 글자)  → 이미 받아둔 전체 목록을 클라이언트에서 필터링만 (LLM·서버 호출 없음, 아래 liveFiltered)
  //  · 엔터 or 500ms 무입력 → keyword를 확정해 기존 하이브리드 검색 플로우(LLM 질의이해+임베딩+kNN) 실행
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(inputKeyword.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [inputKeyword]);

  // Sync URL query params with current filter state
  useEffect(() => {
    const params: Record<string, string> = {};
    const trimmed = keyword.trim();

    if (trimmed) params.keyword = trimmed;
    if (categoryId !== ALL) params.category = categoryId;
    if (status !== ALL) params.status = status;
    if (sort !== "RELEVANCE") params.sort = sort;
    if (creatorId !== ALL) params.creatorId = creatorId;
    isUpdatingUrlRef.current = true; // <-- 현재 필터 상태로 URL을 갱신했음을 표시합니다.
    setSearchParams(params, { replace: true });
  }, [keyword, categoryId, status, sort, creatorId, setSearchParams]);

  // Fetch projects passing params (tier 2: 확정된 keyword로만 하이브리드 검색)
  const { data: projects, isPending, isError, error } = useProjects({
    keyword: keyword.trim() || undefined,
    status: status !== ALL ? status : undefined,
    sort: sort === "RELEVANCE" ? undefined : sort,
  });

  // tier 1: 타이핑 중이거나(입력이 아직 keyword로 확정 안 됨) 확정 검색이 첫 로딩 중이면,
  // 전체 풀(rawAllProjects)을 클라이언트에서 필터링해 바로 보여준다(서버·LLM 호출 없음, 스켈레톤 깜빡임 방지).
  const trimmedInput = inputKeyword.trim();
  const isTyping = trimmedInput.length > 0 && trimmedInput !== keyword.trim();
  const showLive = trimmedInput.length > 0 && (isTyping || (isPending && !projects));
  const liveFiltered = useMemo(() => {
    if (!showLive || !rawAllProjects) return null;
    const term = trimmedInput.toLowerCase();
    const words = term.split(/\s+/).filter(Boolean);
    const termNoSpace = term.replace(/\s/g, ""); // "롱 코트" ↔ "롱코트" 매칭
    return rawAllProjects.filter((p) => {
      const hay = `${p.title} ${p.summary ?? ""}`.toLowerCase();
      return (
        hay.includes(term) ||
        hay.replace(/\s/g, "").includes(termNoSpace) ||
        words.every((w) => hay.includes(w))
      );
    });
  }, [showLive, trimmedInput, rawAllProjects]);

  // 그리드에 쓸 소스: 타이핑 중이면 클라 필터 결과, 아니면 하이브리드 검색 결과
  const baseProjects = liveFiltered ?? projects;

  const { data: categories } = useCategories();

  const categoryOptions = useMemo(() => {
    if (!categories) return [];
    const parents = categories.filter((c) => !c.parentProjectCategoryId);
    const result: { id: string; label: string }[] = [];

    parents.forEach((parent) => {
      result.push({ id: String(parent.id), label: `📁 ${parent.name}` });
      const children = categories.filter((c) => c.parentProjectCategoryId === parent.id);
      children.forEach((child) => {
        result.push({ id: String(child.id), label: `↳ ${child.name}` });
      });
    });
    return result;
  }, [categories]);

  const statusOptions = useMemo(
    () => Array.from(new Set((baseProjects ?? []).map((project) => project.status))),
    [baseProjects]
  );

  // Filter & sort including parent/child category tree matching
  const filteredAndSorted = useMemo(() => {
    if (!baseProjects) return [];

    let list = baseProjects;

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
    // When sort === "RELEVANCE", preserve the server's Elasticsearch relevance ranking!

    return list;
  }, [baseProjects, status, categoryId, creatorId, sort, categories]);

  const handleClearSearch = () => {
    setInputKeyword("");
    setKeyword("");
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (title: string) => {
    setInputKeyword(title);
    setKeyword(title);
    setSort("RELEVANCE");
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter는 추천어 목록 유무와 무관하게 항상 검색을 확정한다(디바운스 우회).
    if (e.key === "Enter") {
      e.preventDefault();
      if (showSuggestions && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSelectSuggestion(suggestions[highlightedIndex].title);
      } else {
        setKeyword(inputKeyword.trim());
        setShowSuggestions(false);
      }
      return;
    }

    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
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
          <p className="text-xs text-mist">카테고리 드롭다운과 키워드로 원하시는 프로젝트를 쉽게 찾아보세요.</p>
        </div>
        {user?.role === "CREATOR" && (
          <Link
            to="/projects/new"
            className="rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-stamp transition-transform hover:scale-105"
          >
            + 프로젝트 만들기
          </Link>
        )}
      </div>

      {/* Search Bar & Filter Controls (Category, Status, Sort) */}
      <div className="flex flex-col gap-3 rounded-lg border border-ink/15 bg-paper/60 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          {/* Search Input Bar with Autocomplete Suggestions */}
          <div ref={searchContainerRef} className="relative flex items-center flex-1 w-full">
            <Search className="absolute left-3.5 h-4 w-4 text-mist" />
            <input
              type="text"
              placeholder="프로젝트 제목 또는 한 줄 요약으로 검색..."
              value={inputKeyword}
              onChange={(e) => {
                setInputKeyword(e.target.value);
                setShowSuggestions(true);
                setHighlightedIndex(-1);
              }}
              onFocus={() => {
                if (inputKeyword.trim()) setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              className="w-full !rounded-lg border border-ink/20 bg-surface pl-10 pr-10 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand" // <-- 검색 입력창을 둥근 사각형으로 표시합니다.
            />
            {inputKeyword && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3.5 flex h-5 w-5 items-center justify-center rounded-lg bg-ink/10 text-ink/60 hover:bg-ink/20 hover:text-ink"
              >
                <X className="h-3 w-3" />
              </button>
            )}

            {/* Autocomplete Recommended Search Terms Dropdown */}
            {showSuggestions && inputKeyword.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-ink/15 bg-surface p-1.5 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-mist border-b border-ink/5">
                  <span>💡 추천 검색어 ({suggestions.length})</span>
                  <span className="text-[10px] text-mist/70">↑↓ 이동 · Enter 선택</span>
                </div>
                {suggestions.length > 0 ? (
                  <ul className="flex flex-col py-1">
                    {suggestions.map((project, index) => (
                      <li key={project.projectId}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectSuggestion(project.title);
                          }}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            index === highlightedIndex
                              ? "bg-brand/10 text-brand font-medium"
                              : "text-ink hover:bg-ink/5"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <span className="text-xs">🔍</span>
                            <div className="flex flex-col truncate">
                              <span className="truncate text-sm font-medium">
                                <HighlightMatch text={project.title} query={inputKeyword.trim()} />
                              </span>
                              {project.summary && (
                                <span className="truncate text-xs text-mist">
                                  {project.summary}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-medium text-mist">
                            {getStatusLabel(project.status)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-3 py-3 text-center text-xs text-mist">
                    '{inputKeyword}'(으)로 시작하거나 포함된 추천 검색어가 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Dropdown Filter */}
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="!rounded-lg">
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent className="!rounded-lg">
              <SelectItem value={ALL}>📁 전체 카테고리</SelectItem>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="!rounded-lg">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent className="!rounded-lg">
              <SelectItem value={ALL}>🏷️ 전체 상태</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {getStatusLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="!rounded-lg">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent className="!rounded-lg">
              <SelectItem value="RELEVANCE">🎯 연관도순</SelectItem>
              <SelectItem value="LATEST">🆕 최신순</SelectItem>
              <SelectItem value="DEADLINE">⏰ 마감임박순</SelectItem>
              <SelectItem value="FUNDED_AMOUNT">🔥 인기순</SelectItem>
            </SelectContent>
          </Select>

          {(keyword.trim() || categoryId !== ALL || status !== ALL || sort !== "RELEVANCE" || creatorId !== ALL) && (
            <button
              type="button"
              onClick={() => {
                setInputKeyword("");
                setKeyword("");
                setCategoryId(ALL);
                setStatus(ALL);
                setSort("RELEVANCE");
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
              👤 <strong className="text-ink">{getCreatorDisplayName(Number(creatorId), user)}</strong> 창작자의 개설 프로젝트 목록을 보는 중입니다.
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
        {isTyping ? (
          <span>
            '<span className="text-brand font-semibold">{trimmedInput}</span>' 입력 중 · Enter로 정밀 검색
          </span>
        ) : keyword ? (
          <span>
            '<span className="text-brand font-semibold">{keyword}</span>' 검색어 적용 중
          </span>
        ) : null}
      </div>

      {/* Grid Content / Skeletons / Error / Empty */}
      {isPending && !liveFiltered && (!projects || (projects as any[]).length === 0) ? (
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError && !isTyping ? (
        <ErrorState error={{ message: errorMsg!, errors: null }} />
      ) : filteredAndSorted.length === 0 ? (
        <EmptyState message="조건에 맞는 프로젝트가 없어요. 다른 키워드나 카테고리로 검색해 보세요." />
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {filteredAndSorted.map((project, index) => (
            <Reveal key={project.projectId} delay={Math.min(index, 8) * 0.04}>
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
