import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Badge, ProgressMeter, Thumbnail, buttonClassName } from "../../../shared/ui";
import type { ProjectSummary } from "../types";
import { daysLeft, fundedPercent } from "../utils";

interface ProjectCardProps {
  project: ProjectSummary;
  categoryName?: string;
  className?: string;
}

export function ProjectCard({ project, categoryName, className = "" }: ProjectCardProps) {
  const percent = fundedPercent(project.fundedAmount, project.goalAmount);
  const remaining = daysLeft(project.endAt);

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-sm border-2 border-ink bg-surface shadow-stamp transition-[transform,box-shadow] duration-150 hover:-translate-y-1 hover:shadow-stamp-lg ${className}`}
    >
      <Link to={`/projects/${project.projectId}`} className="absolute inset-0 z-10" aria-label={project.title} />

      <Thumbnail className="aspect-square w-full" />

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <Badge tone="mint">{project.status}</Badge>
          {categoryName && <span className="text-xs text-mist">{categoryName}</span>}
        </div>

        <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-brand">
          {project.title}
        </h3>

        <ProgressMeter percent={percent} />
        <div className="mt-2 flex items-baseline justify-between text-xs text-mist">
          <span className="tabular-nums font-bold text-ink">{Math.round(percent)}%</span>
          <span className="tabular-nums">{project.fundedAmount.toLocaleString()}원</span>
        </div>
        <div className="tabular-nums text-xs text-mist">목표 {project.goalAmount.toLocaleString()}원</div>

        <div className="mt-2 flex items-center gap-1 text-xs text-mist">
          <Clock className="h-3.5 w-3.5" />
          {remaining > 0 ? `${remaining}일 남음` : "마감"}
        </div>

        <Link
          to={`/projects/${project.projectId}`}
          className={buttonClassName("primary", "relative z-20 mt-3 w-full")}
        >
          후원하기
        </Link>
      </div>
    </div>
  );
}
