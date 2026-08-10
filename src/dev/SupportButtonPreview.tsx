import { useEffect, useState } from "react";
import { SupportButton } from "../shared/ui";

// TEMP visual QA harness — not wired into the app, delete after review.
export function SupportButtonPreview() {
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTrigger((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-surface p-16">
      <div className="mx-auto flex max-w-sm flex-col gap-10">
        <div>
          <p className="mb-2 text-xs text-mist">desktop / full</p>
          <SupportButton label="스타터 키트 후원하기" disabled={false} onClick={() => setTrigger((t) => t + 1)} trigger={trigger} />
        </div>
        <div className="max-w-[220px]">
          <p className="mb-2 text-xs text-mist">mobile / compact</p>
          <SupportButton label="후원하기" disabled={false} onClick={() => setTrigger((t) => t + 1)} trigger={trigger} compact />
        </div>
      </div>
    </div>
  );
}
