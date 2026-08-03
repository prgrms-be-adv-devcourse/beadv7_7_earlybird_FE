import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  const { data: projects, isPending, isError } = useProjects();
  const { data: categories } = useCategories();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(ALL);
  const [categoryId, setCategoryId] = useState(searchParams.get("category") ?? ALL);

  const statusOptions = useMemo(
    () => Array.from(new Set((projects ?? []).map((project) => project.status))),
    [projects],
  );

  const filtered = useMemo(() => {
    if (!projects) return [];
    return projects.filter((project) => {
      const matchesStatus = status === ALL || project.status === status;
      const matchesCategory = categoryId === ALL || String(project.categoryId) === categoryId;
      return matchesStatus && matchesCategory;
    });
  }, [projects, status, categoryId]);

  if (isPending) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="font-display text-2xl font-bold text-ink">전체 프로젝트</h1>
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }
  if (isError) return <ErrorState error={{ message: "프로젝트 목록을 불러오지 못했습니다.", errors: null }} />;
  if (projects.length === 0) return <EmptyState message="아직 등록된 프로젝트가 없어요." />;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl font-bold text-ink">전체 프로젝트</h1>
      <div className="flex gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>전체 상태</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>전체 카테고리</SelectItem>
            {(categories ?? []).map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="조건에 맞는 프로젝트가 없어요." />
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((project) => (
            <ProjectCard key={project.projectId} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
