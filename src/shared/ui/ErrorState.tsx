import type { ApiError } from "../types/ApiResponse";
import { StampAlertIcon } from "./icons";

export function ErrorState({ error }: { error: ApiError | null }) {
  return (
    <div role="alert" className="flex items-center gap-3 rounded-sm border-2 border-danger bg-danger/[0.08] p-4 text-sm text-danger">
      <StampAlertIcon className="h-6 w-6 shrink-0" />
      <span>{error?.message ?? "알 수 없는 오류가 발생했습니다."}</span>
    </div>
  );
}
