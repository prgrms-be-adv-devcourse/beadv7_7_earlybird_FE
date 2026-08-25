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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  references?: PolicyReference[];
  projects?: ProjectCard[];
  toolProgress?: ToolStartEvent[];
  toolProgressCompleted?: boolean;
}
