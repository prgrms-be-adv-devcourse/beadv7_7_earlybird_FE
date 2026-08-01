import { Card, EmptyState, ErrorState, Spinner } from "../../../shared/ui";
import { useCategories } from "../hooks";

export function CategoryAdminPage() {
  const { data: categories, isPending, isError } = useCategories();

  if (isPending) return <Spinner label="카테고리 불러오는 중..." />;
  if (isError) return <ErrorState error={{ message: "카테고리를 불러오지 못했습니다.", errors: null }} />;
  if (categories.length === 0) return <EmptyState message="등록된 카테고리가 없어요." />;

  return (
    <Card>
      <h1 className="mb-3 font-jua text-2xl">카테고리 관리</h1>
      <p className="mb-3 text-sm text-slate-500">
        최상위 카테고리만 표시돼요. 하위 카테고리(children)는 아직 이 화면에 그려지지 않아요.
      </p>
      <ul className="flex flex-col gap-2">
        {categories.map((category) => (
          <li key={category.id} className="rounded-2xl bg-mint/10 p-3">
            {category.name}
            {category.children.length > 0 && (
              <span className="ml-2 text-xs text-slate-400">
                (하위 카테고리 {category.children.length}개)
              </span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
