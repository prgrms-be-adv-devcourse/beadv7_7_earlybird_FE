import type { ProjectCategory } from "../admin/types";

export function fundedPercent(fundedAmount: number, goalAmount: number) {
  return goalAmount > 0 ? (fundedAmount / goalAmount) * 100 : 0;
}

export function daysLeft(endAt: string) {
  const diff = new Date(endAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// 시작일 기준 최대 마감 연장일(yyyy-MM-dd, <input type="date">용) 계산.
// toISOString()은 UTC 날짜를 반환해 KST 자정~9시 시작 프로젝트는 하루가 밀리므로,
// 로컬 캘린더 날짜(getFullYear/getMonth/getDate)로 직접 조립한다.
export function maxExtendedEndAt(startAt: string, monthsAllowed = 3): string {
  const d = new Date(startAt);
  d.setMonth(d.getMonth() + monthsAllowed);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "PENDING_REVIEW":
      return "⌛ 심사 대기";
    case "IN_PROGRESS":
      return "🔥 펀딩 진행 중";
    case "SUCCEEDED":
      return "🎉 펀딩 성공";
    case "FAILED":
      return "😭 펀딩 실패";
    case "CANCELLED":
      return "🚫 펀딩 취소";
    case "REJECTED":
      return "❌ 심사 반려";
    default:
      return status;
  }
}

export function getOrderClosedMessage(status: string): string {
  switch (status) {
    case "SUCCEEDED":
      return "🎉 펀딩이 목표를 달성하고 종료됐어요";
    case "FAILED":
      return "😭 목표 금액 미달로 종료됐어요";
    case "CANCELLED":
      return "🚫 취소된 프로젝트예요";
    case "PENDING_REVIEW":
      return "⌛ 아직 심사 중이라 후원할 수 없어요";
    case "REJECTED":
      return "❌ 심사 반려로 후원할 수 없어요";
    default:
      return "지금은 후원할 수 없어요";
  }
}

export function getStatusBadgeTone(status: string): "mint" | "peach" | "lavender" {
  switch (status) {
    case "IN_PROGRESS":
      return "mint";
    case "SUCCEEDED":
      return "peach";
    case "PENDING_REVIEW":
      return "lavender";
    default:
      return "lavender";
  }
}

export function formatDateKorean(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}년 ${month}월 ${day}일`;
  } catch {
    return dateStr;
  }
}

// 백엔드는 creatorId만 내려주고 다른 사용자의 이름을 조회할 공개 API가 없다 — 로그인한
// 본인이 곧 그 creatorId일 때만 실제 이름을 알 수 있고, 그 외에는 정직하게 ID만 표시한다.
export function getCreatorDisplayName(
  creatorId?: number | null,
  currentUser?: { id?: number; name?: string } | null
): string {
  if (!creatorId) return "Earlybird 공식 메이커";

  if (currentUser && (currentUser.id === creatorId || String(currentUser.id) === String(creatorId))) {
    return currentUser.name || `창작자 #${creatorId}`;
  }

  return `창작자 #${creatorId}`;
}

export interface FlatCategory {
  id: number;
  name: string;
  displayName: string;
  level: number;
}

export function flattenCategories(categories: ProjectCategory[], level = 0): FlatCategory[] {
  const result: FlatCategory[] = [];
  for (const cat of categories) {
    // 브라우저는 <option> 텍스트의 일반 공백을 접어버려서 들여쓰기가 안 보인다.
    // NBSP( )는 접히지 않으므로 계층 깊이가 계단식으로 드러난다.
    const indent = level > 0 ? `${"   ".repeat(level)}└ ` : "";
    result.push({
      id: cat.id,
      name: cat.name,
      displayName: `${indent}${cat.name}`,
      level,
    });
    if (cat.children && cat.children.length > 0) {
      result.push(...flattenCategories(cat.children, level + 1));
    }
  }
  return result;
}

export function getCategoryIdsIncludingChildren(categories: ProjectCategory[], targetId: number): number[] {
  const foundNode = findCategoryNode(categories, targetId);
  if (!foundNode) return [targetId];
  return collectAllNodeIds(foundNode);
}

function findCategoryNode(categories: ProjectCategory[], targetId: number): ProjectCategory | null {
  for (const cat of categories) {
    if (cat.id === targetId) return cat;
    if (cat.children && cat.children.length > 0) {
      const childMatch = findCategoryNode(cat.children, targetId);
      if (childMatch) return childMatch;
    }
  }
  return null;
}

function collectAllNodeIds(node: ProjectCategory): number[] {
  const ids = [node.id];
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      ids.push(...collectAllNodeIds(child));
    }
  }
  return ids;
}

export function findCategoryPath(categories: ProjectCategory[], targetId: number): string[] {
  for (const cat of categories) {
    if (cat.id === targetId) {
      return [cat.name];
    }
    if (cat.children && cat.children.length > 0) {
      const subPath = findCategoryPath(cat.children, targetId);
      if (subPath.length > 0) {
        return [cat.name, ...subPath];
      }
    }
  }
  return [];
}

export function getCategoryPathString(categories: ProjectCategory[] | undefined, targetId?: number | null): string {
  if (!categories || !targetId) return "";
  const path = findCategoryPath(categories, targetId);
  return path.join(" > ");
}
