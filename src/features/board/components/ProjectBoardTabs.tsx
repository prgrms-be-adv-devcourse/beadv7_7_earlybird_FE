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
          className={`rounded-2xl px-3 py-1 font-jua ${tab === "notices" ? "bg-mint" : "bg-lavender/20"}`}
          onClick={() => setTab("notices")}
        >
          공지
        </button>
        <button
          className={`rounded-2xl px-3 py-1 font-jua ${tab === "reviews" ? "bg-mint" : "bg-lavender/20"}`}
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
              <li key={notice.id} className="rounded-2xl bg-mint/10 p-3">
                <p className="font-semibold">{notice.title}</p>
                <p className="text-sm text-slate-600">{notice.content}</p>
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
              <li key={review.id} className="rounded-2xl bg-peach/10 p-3 text-sm text-slate-600">
                {review.content}
              </li>
            ))}
          </ul>
        ))}
    </Card>
  );
}
