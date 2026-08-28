import { useMemo } from "react";
import type { ProjectCategory } from "../../admin/types";
import { findCategoryIdPath } from "../utils";

const LEVEL_LABELS = ["대분류", "중분류", "소분류", "세분류"];

// 카테고리 트리를 단계별(대분류 → 중분류 → 소분류) 드롭다운으로 선택한다.
// 상위를 고르면 categoryId가 그 노드로 확정되고, 하위가 있으면 다음 드롭다운이 나타나 더 좁힐 수 있다.
export function CategoryCascader({
  categories,
  value,
  onChange,
  disabled = false,
}: {
  categories: ProjectCategory[];
  value: number;
  onChange: (id: number) => void;
  disabled?: boolean;
}) {
  const levels = useMemo(() => {
    const idPath = findCategoryIdPath(categories, value);
    const result: { options: ProjectCategory[]; selectedId: number | "" }[] = [];
    let options = categories;
    for (let depth = 0; ; depth++) {
      const selectedId = idPath[depth];
      result.push({ options, selectedId: selectedId ?? "" });
      const selectedNode = options.find((o) => o.id === selectedId);
      if (!selectedNode?.children?.length) break;
      options = selectedNode.children;
    }
    return result;
  }, [categories, value]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {levels.map((level, i) => (
        <label key={i} className="flex-1">
          <span className="mb-1 block text-xs text-mist">{LEVEL_LABELS[i] ?? `${i + 1}단계`}</span>
          <select
            disabled={disabled}
            value={level.selectedId}
            onChange={(e) => {
              const v = e.target.value;
              if (v) onChange(Number(v));
              // 하위 단계에서 "선택"으로 되돌리면 상위 노드로 확정
              else if (i > 0) onChange(Number(levels[i - 1].selectedId));
            }}
            className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink disabled:bg-surface disabled:text-mist focus:border-brand focus:outline-none bg-surface"
          >
            {i > 0 && <option value="">선택 안 함</option>}
            {level.options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
