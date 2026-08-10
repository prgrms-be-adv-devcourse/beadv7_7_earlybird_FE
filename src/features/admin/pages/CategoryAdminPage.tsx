import { useState } from "react";
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  ErrorState,
  RowSkeleton,
} from "../../../shared/ui";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "../hooks";
import type { ProjectCategory } from "../types";

function CategoryTreeNode({
  category,
  allCategories,
  onEdit,
  onDelete,
}: {
  category: ProjectCategory;
  allCategories: ProjectCategory[];
  onEdit: (category: ProjectCategory) => void;
  onDelete: (id: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <li className="flex flex-col gap-1 border-l-2 border-brand/20 pl-3 my-1">
      <div className="flex items-center justify-between rounded-sm border border-ink/15 bg-paper/60 p-2.5 hover:border-ink/30 transition-colors">
        <div className="flex items-center gap-2">
          {hasChildren && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-5 w-5 items-center justify-center rounded border border-ink/20 text-xs font-bold text-ink hover:bg-surface"
            >
              {isOpen ? "−" : "+"}
            </button>
          )}
          <span className="font-semibold text-sm text-ink">{category.name}</span>
          <span className="text-xs text-mist font-mono">(ID: {category.id})</span>
          {hasChildren && (
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
              하위 {category.children.length}개
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="py-1 px-2.5 text-xs border-ink/20 hover:border-brand hover:text-brand"
            onClick={() => onEdit(category)}
          >
            수정
          </Button>
          {!hasChildren && (
            <Button
              variant="secondary"
              className="py-1 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => onDelete(category.id)}
            >
              삭제
            </Button>
          )}
        </div>
      </div>

      {hasChildren && isOpen && (
        <ul className="flex flex-col gap-1 mt-1 ml-2">
          {category.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              allCategories={allCategories}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CategoryAdminPage() {
  const { data: categories, isPending, isError } = useCategories();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createParentId, setCreateParentId] = useState<number | null>(null);

  // Edit Modal state
  const [editingCategory, setEditingCategory] = useState<ProjectCategory | null>(null);
  const [editName, setEditName] = useState("");
  const [editParentId, setEditParentId] = useState<number | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = () => {
    setErrorMsg(null);
    if (!createName.trim()) {
      setErrorMsg("카테고리 이름을 입력해주세요.");
      return;
    }

    createCategoryMutation.mutate(
      {
        name: createName.trim(),
        parentProjectCategoryId: createParentId,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setCreateName("");
          setCreateParentId(null);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.error?.message || err.message || "카테고리 생성에 실패했습니다.";
          setErrorMsg(msg);
        },
      }
    );
  };

  const handleOpenEdit = (category: ProjectCategory) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditParentId(category.parentProjectCategoryId ?? null);
    setErrorMsg(null);
  };

  const handleUpdate = () => {
    if (!editingCategory) return;
    setErrorMsg(null);

    if (!editName.trim()) {
      setErrorMsg("카테고리 이름을 입력해주세요.");
      return;
    }

    updateCategoryMutation.mutate(
      {
        id: editingCategory.id,
        data: {
          name: editName.trim(),
          parentProjectCategoryId: editParentId,
        },
      },
      {
        onSuccess: () => {
          setEditingCategory(null);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.error?.message || err.message || "카테고리 수정에 실패했습니다.";
          setErrorMsg(msg);
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("이 카테고리를 삭제할까요?")) return;
    deleteCategoryMutation.mutate(id, {
      onError: (err: any) => {
        alert(err.response?.data?.error?.message || err.message || "카테고리 삭제에 실패했습니다.");
      },
    });
  };

  // Helper to flatten all categories for parent selector dropdown
  const flattenCategories = (list: ProjectCategory[], depth = 0): { id: number; name: string; depth: number }[] => {
    return list.flatMap((c) => [
      { id: c.id, name: c.name, depth },
      ...(c.children ? flattenCategories(c.children, depth + 1) : []),
    ]);
  };

  const flatList = categories ? flattenCategories(categories) : [];

  if (isPending) {
    return (
      <Card>
        <h1 className="mb-3 font-display text-2xl font-bold text-ink">📁 카테고리 관리</h1>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <RowSkeleton key={index} />
          ))}
        </div>
      </Card>
    );
  }

  if (isError) return <ErrorState error={{ message: "카테고리를 불러오지 못했습니다.", errors: null }} />;

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-ink/10 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">📁 카테고리 관리 (관리자)</h1>
          <p className="text-sm text-mist">서비스 전체 카테고리 트리를 생성, 조회, 수정, 삭제합니다.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="py-2 px-4 text-sm font-bold text-white">
          + 카테고리 추가
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState message="등록된 카테고리가 없어요." />
      ) : (
        <ul className="flex flex-col gap-2">
          {categories.map((category) => (
            <CategoryTreeNode
              key={category.id}
              category={category}
              allCategories={categories}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}

      {/* Create Category Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>새 카테고리 추가</DialogTitle>
          <DialogDescription>새로운 카테고리 명과 상위 카테고리를 지정하세요.</DialogDescription>

          <div className="my-4 flex flex-col gap-4 text-sm">
            <div>
              <label className="mb-1 block font-semibold text-ink">카테고리 이름 *</label>
              <input
                type="text"
                placeholder="예: AI 헬스케어"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-ink">상위 카테고리 (선택)</label>
              <select
                value={createParentId ?? ""}
                onChange={(e) => setCreateParentId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none bg-surface"
              >
                <option value="">(최상위 루트 카테고리로 등록)</option>
                {flatList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {"—".repeat(c.depth)} {c.name} (ID: {c.id})
                  </option>
                ))}
              </select>
            </div>

            {errorMsg && <ErrorState error={{ message: errorMsg, errors: null }} />}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreate} disabled={createCategoryMutation.isPending}>
              {createCategoryMutation.isPending ? "생성 중..." : "카테고리 생성"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle>카테고리 수정</DialogTitle>
          <DialogDescription>카테고리 이름을 변경하거나 상위 카테고리를 이동합니다.</DialogDescription>

          <div className="my-4 flex flex-col gap-4 text-sm">
            <div>
              <label className="mb-1 block font-semibold text-ink">카테고리 이름 *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-ink">상위 카테고리</label>
              <select
                value={editParentId ?? ""}
                onChange={(e) => setEditParentId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-sm border border-ink/30 px-3 py-2 text-ink focus:border-brand focus:outline-none bg-surface"
              >
                <option value="">(최상위 루트 카테고리로 변경)</option>
                {flatList
                  .filter((c) => c.id !== editingCategory?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {"—".repeat(c.depth)} {c.name} (ID: {c.id})
                    </option>
                  ))}
              </select>
            </div>

            {errorMsg && <ErrorState error={{ message: errorMsg, errors: null }} />}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditingCategory(null)}>
              취소
            </Button>
            <Button onClick={handleUpdate} disabled={updateCategoryMutation.isPending}>
              {updateCategoryMutation.isPending ? "저장 중..." : "수정 완료"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
