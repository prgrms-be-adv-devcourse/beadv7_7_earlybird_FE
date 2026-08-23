export interface PolicyReference {
  category: string;
  topic: string;
}

export interface ChatMessageResponse {
  reply: string;
  toolsUsed: string[];
  references: PolicyReference[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  references?: PolicyReference[];
}
