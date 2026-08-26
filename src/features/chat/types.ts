export interface PolicyReference {
  category: string;
  topic: string;
}

export interface ProjectCard {
  projectId: number;
  title: string;
  thumbnailUrl: string | null;
}

export interface ChatMessageResponse {
  reply: string;
  toolsUsed: string[];
  references: PolicyReference[];
}

export interface ToolStartEvent {
  toolName: string;
  sequence: number;
  message: string;
  completedMessage: string;
}

// metadata가 이 항목이 추가된 뒤에 도착해야만 completed:true로 바뀐다(store.ts의
// completeToolProgress) — 메시지 전체에 완료 여부를 boolean 하나로 두면, metadata가
// tool_start보다 먼저 오는 경우(순서 비보장) 방금 시작한 tool이 즉시 완료로 보이는 버그가 생긴다.
export interface ToolProgressEntry extends ToolStartEvent {
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  references?: PolicyReference[];
  projects?: ProjectCard[];
  toolProgress?: ToolProgressEntry[];
}
