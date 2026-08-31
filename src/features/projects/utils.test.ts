import { describe, it, expect } from "vitest";
import {
  findCategoryPath,
  getCategoryPathString,
  getCategoryIdsIncludingChildren,
  daysLeft,
  fundedPercent,
  getStatusLabel,
  maxExtendedEndAt,
} from "./utils";
import type { ProjectCategory } from "../admin/types";
import { resolveThumbnailUrl } from "../files/hooks";
import type { FileRecord } from "../files/types";

const mockCategories: ProjectCategory[] = [
  {
    id: 1,
    name: "패션",
    parentProjectCategoryId: null,
    children: [
      {
        id: 2,
        name: "의류",
        parentProjectCategoryId: 1,
        children: [
          { id: 3, name: "상의", parentProjectCategoryId: 2, children: [] },
          { id: 4, name: "하의", parentProjectCategoryId: 2, children: [] },
        ],
      },
      {
        id: 5,
        name: "잡화",
        parentProjectCategoryId: 1,
        children: [{ id: 6, name: "액세서리", parentProjectCategoryId: 5, children: [] }],
      },
    ],
  },
  {
    id: 7,
    name: "전자기기",
    parentProjectCategoryId: null,
    children: [{ id: 8, name: "스마트기기", parentProjectCategoryId: 7, children: [] }],
  },
];

describe("projects utils", () => {
  it("findCategoryPath는 루트 카테고리의 경로를 반환한다", () => {
    expect(findCategoryPath(mockCategories, 1)).toEqual(["패션"]);
  });

  it("findCategoryPath는 중첩된 자식 카테고리의 전체 경로를 반환한다", () => {
    expect(findCategoryPath(mockCategories, 3)).toEqual(["패션", "의류", "상의"]);
    expect(findCategoryPath(mockCategories, 6)).toEqual(["패션", "잡화", "액세서리"]);
    expect(findCategoryPath(mockCategories, 8)).toEqual(["전자기기", "스마트기기"]);
  });

  it("getCategoryPathString은 ' > '로 연결된 문자열을 반환한다", () => {
    expect(getCategoryPathString(mockCategories, 3)).toBe("패션 > 의류 > 상의");
    expect(getCategoryPathString(mockCategories, 7)).toBe("전자기기");
    expect(getCategoryPathString(mockCategories, 999)).toBe("");
    expect(getCategoryPathString(undefined, 1)).toBe("");
  });

  it("getCategoryIdsIncludingChildren은 자기 자신과 하위 모든 카테고리 ID를 수집한다", () => {
    expect(getCategoryIdsIncludingChildren(mockCategories, 1)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(getCategoryIdsIncludingChildren(mockCategories, 2)).toEqual([2, 3, 4]);
    expect(getCategoryIdsIncludingChildren(mockCategories, 3)).toEqual([3]);
  });

  it("fundedPercent와 daysLeft를 올바르게 계산한다", () => {
    expect(fundedPercent(5000, 10000)).toBe(50);
    expect(fundedPercent(10000, 0)).toBe(0);
    expect(daysLeft(new Date(Date.now() + 86400000 * 2).toISOString())).toBeGreaterThanOrEqual(1);
    expect(getStatusLabel("IN_PROGRESS")).toBe("🔥 펀딩 진행 중");
  });

  it("resolveThumbnailUrl은 files[0]이 아니라 thumbnailId가 가리키는 파일을 쓴다 (이미지 변경 후 예전 파일이 남아 있어도 새 이미지 표시)", () => {
    const files = [
      { id: 10, storedUrl: "old.jpg" } as FileRecord,
      { id: 20, storedUrl: "new.jpg" } as FileRecord,
    ];
    expect(resolveThumbnailUrl(files, 20)).toBe("new.jpg");
    expect(resolveThumbnailUrl(files, null)).toBe("old.jpg"); // 레거시 폴백
    expect(resolveThumbnailUrl(files, 999)).toBe("old.jpg"); // 매칭 실패 시 폴백
    expect(resolveThumbnailUrl([], 20)).toBeNull();
    expect(resolveThumbnailUrl(undefined, 20)).toBeNull();
  });

  it("maxExtendedEndAt은 UTC 변환 없이 로컬 캘린더 날짜로 +3개월을 계산한다 (자정~9시 시작 프로젝트도 하루 밀리지 않음)", () => {
    // KST 05:00 시작 — toISOString() 기반 계산이면 UTC 날짜가 하루 전으로 밀려 "2026-11-23"이 나옴
    expect(maxExtendedEndAt("2026-08-24T05:00:00")).toBe("2026-11-24");
    expect(maxExtendedEndAt("2026-08-24T14:00:00")).toBe("2026-11-24");
    expect(maxExtendedEndAt("2026-01-31T05:00:00")).toBe("2026-05-01"); // Date.setMonth 롤오버
  });
});
