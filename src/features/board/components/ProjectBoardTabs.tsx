import { useState } from "react";
import { Card, EmptyState } from "../../../shared/ui";
import { useNotices, useReviews } from "../hooks";

export function ProjectBoardTabs({ projectId }: { projectId: number }) {
  const [tab, setTab] = useState<"notices" | "reviews">("notices");
  const { data: notices } = useNotices(projectId);
  const { data: reviews } = useReviews(projectId);

  return (
    <Card>
      <div className="mb-3 flex gap-2">
        <button
          className={`rounded-sm border-2 px-3 py-1.5 text-sm font-bold transition-colors ${
            tab === "notices" ? "border-ink bg-ink text-white" : "border-ink/20 text-mist hover:border-ink/40"
          }`}
          onClick={() => setTab("notices")}
        >
          공지
        </button>
        <button
          className={`rounded-sm border-2 px-3 py-1.5 text-sm font-bold transition-colors ${
            tab === "reviews" ? "border-ink bg-ink text-white" : "border-ink/20 text-mist hover:border-ink/40"
          }`}
          onClick={() => setTab("reviews")}
        >
          후기
        </button>
      </div>

      {tab === "notices" &&
        (!notices || notices.length === 0 ? (
          <EmptyState message="아직 공지가 없어요." />
        ) : (
          <ul className="flex flex-col gap-2">
            {notices.map((notice) => (
              <li key={notice.id} className="rounded-sm border border-ink/20 p-3">
                <p className="font-medium text-ink">{notice.title}</p>
                <p className="mt-1 text-sm text-mist">{notice.content}</p>
              </li>
            ))}
          </ul>
        ))}

      {tab === "reviews" &&
        (!reviews || reviews.length === 0 ? (
          <EmptyState message="아직 후기가 없어요." />
        ) : (
          <ul className="flex flex-col gap-2">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-sm border border-ink/20 p-3 text-sm text-mist">
                {review.content}
              </li>
            ))}
          </ul>
        ))}
    </Card>
  );
}
