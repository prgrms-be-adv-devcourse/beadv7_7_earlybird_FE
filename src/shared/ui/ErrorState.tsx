import type { ApiError } from "../types/ApiResponse";

export function ErrorState({ error }: { error: ApiError | null }) {
  return (
    <div role="alert" className="rounded-2xl bg-peach/30 p-4 text-rose-700">
      {error?.message ?? "알 수 없는 오류가 발생했습니다."}
    </div>
  );
}
