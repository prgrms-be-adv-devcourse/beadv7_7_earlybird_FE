import { ChevronDown } from "lucide-react";
import { useCategories } from "../../admin/hooks";

interface CategoryNavProps {
  activeCategoryId?: string;
  onSelectCategory?: (categoryId: string) => void;
}

export function CategoryNav({ activeCategoryId = "ALL", onSelectCategory }: CategoryNavProps) {
  const { data: categories } = useCategories();
  const topCategories = categories ?? [];

  const handleCategoryClick = (catId: string) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
  };

  return (
    <nav className="relative z-30 w-full border-b-2 border-ink bg-surface shadow-sm mb-6">
      <div className="mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-2 py-2 text-sm no-scrollbar">
        {/* ALL Categories item */}
        <button
          type="button"
          onClick={() => handleCategoryClick("ALL")}
          className={`flex items-center gap-1.5 px-4 py-2 font-extrabold rounded-md transition-all whitespace-nowrap ${
            activeCategoryId === "ALL"
              ? "bg-brand text-white shadow-stamp-sm scale-105"
              : "text-ink hover:bg-brand/10 hover:text-brand"
          }`}
        >
          📁 전체
        </button>

        {/* Top-Level Categories with Hover Subcategory Dropdowns */}
        {topCategories.map((topCat) => {
          const isTopActive = activeCategoryId === String(topCat.id);
          const hasChildren = topCat.children && topCat.children.length > 0;

          return (
            <div key={topCat.id} className="group relative">
              <button
                type="button"
                onClick={() => handleCategoryClick(String(topCat.id))}
                className={`flex items-center gap-1.5 px-4 py-2 font-bold rounded-md transition-all whitespace-nowrap ${
                  isTopActive
                    ? "bg-brand text-white shadow-stamp-sm scale-105"
                    : "text-ink hover:bg-brand/10 hover:text-brand"
                }`}
              >
                <span>{topCat.name}</span>
                {hasChildren && (
                  <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" />
                )}
              </button>

              {/* Hover Dropdown showing Subcategories */}
              {hasChildren && (
                <div className="invisible absolute left-0 top-full pt-1.5 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 z-50">
                  <div className="min-w-[200px] rounded-lg border-2 border-ink bg-surface p-2.5 shadow-stamp-lg flex flex-col gap-1">
                    {/* Option to select top category explicitly */}
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(String(topCat.id))}
                      className="w-full text-left px-3 py-1.5 text-xs font-extrabold text-brand hover:bg-brand/10 rounded transition-colors"
                    >
                      전체 {topCat.name} 보기
                    </button>
                    <div className="my-1 h-px bg-ink/15" />

                    {topCat.children.map((subCat) => {
                      const isSubActive = activeCategoryId === String(subCat.id);
                      const hasSubSub = subCat.children && subCat.children.length > 0;

                      return (
                        <div key={subCat.id} className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => handleCategoryClick(String(subCat.id))}
                            className={`w-full text-left px-3 py-1.5 text-xs font-bold rounded transition-colors flex items-center justify-between ${
                              isSubActive
                                ? "bg-brand text-white"
                                : "text-ink hover:bg-paper/80 hover:text-brand"
                            }`}
                          >
                            <span>└ {subCat.name}</span>
                          </button>

                          {/* Level 3 subcategories if present */}
                          {hasSubSub && (
                            <div className="ml-3 flex flex-col gap-0.5 border-l-2 border-brand/20 pl-2 my-1">
                              {subCat.children.map((leafCat) => (
                                <button
                                  key={leafCat.id}
                                  type="button"
                                  onClick={() => handleCategoryClick(String(leafCat.id))}
                                  className={`text-left px-2 py-1 text-[11px] font-semibold rounded transition-colors ${
                                    activeCategoryId === String(leafCat.id)
                                      ? "text-brand font-extrabold"
                                      : "text-mist hover:text-ink"
                                  }`}
                                >
                                  • {leafCat.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
