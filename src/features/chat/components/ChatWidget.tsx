import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ImageOff, MessageCircle, RotateCcw, SendHorizontal, X } from "lucide-react";
import { Mascot } from "../../../shared/ui";
import { useChatIdentitySync, useSendChatMessage, useResetChatSession, useThumbnailSrc } from "../hooks";
import { useChatStore } from "../store";
import type { ProjectCard, ToolStartEvent } from "../types";

// 서버 reply에 **굵게**/### 제목/- 목록 같은 마크다운 문법이 섞여 오는데, 이 챗봇 응답 범위가
// 딱 그 정도라 전체 마크다운 라이브러리 대신 이 부분만 가볍게 줄 단위로 파싱한다.
function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function renderMarkdownContent(text: string) {
  return text.split("\n").map((line, i) => {
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      return (
        <div key={i} className="mt-1.5 font-bold first:mt-0">
          {renderInlineMarkdown(heading[1])}
        </div>
      );
    }
    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      return (
        <div key={i} className="flex gap-1.5 pl-0.5">
          <span aria-hidden>•</span>
          <span>{renderInlineMarkdown(bullet[1])}</span>
        </div>
      );
    }
    if (line.trim() === "") {
      return <div key={i} className="h-1.5" />;
    }
    return <div key={i}>{renderInlineMarkdown(line)}</div>;
  });
}

// BE가 "여러 프로젝트 추천 시 항목 사이마다 `---`만 있는 줄을 넣어라"고 LLM에 지시해뒀다
// (마지막 항목 뒤엔 안 붙음) — 그 줄 기준으로 텍스트를 나눠 세그먼트 i를 projects[i]와 매칭한다.
function splitIntoProjectSegments(content: string): string[] {
  const lines = content.split("\n");
  const segments: string[] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (/^-{3,}$/.test(line.trim())) {
      segments.push(current.join("\n"));
      current = [];
    } else {
      current.push(line);
    }
  }
  segments.push(current.join("\n"));
  return segments;
}

function ProjectThumbnail({ project }: { project: ProjectCard }) {
  const src = useThumbnailSrc(project);
  const [broken, setBroken] = useState(false);

  return (
    <Link
      to={`/projects/${project.projectId}`}
      className="mb-2 mt-3 flex items-center gap-3.5 rounded-lg border border-ink/15 bg-white/70 p-2.5 transition first:mt-0 hover:scale-[1.02] hover:border-ink/30 hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-ink/10">
        {src && !broken ? (
          <img src={src} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
        ) : (
          <ImageOff className="h-8 w-8 text-ink/30" />
        )}
      </div>
      <span className="text-sm font-bold text-ink">{project.title}</span>
    </Link>
  );
}

// projects[0]의 헤더는 metadata 도착 즉시(텍스트가 한 글자도 오기 전에) 보여줄 수 있다 —
// `---`는 2번째 프로젝트부터의 구분자일 뿐이다. 스트리밍이 끝났는데도 세그먼트 개수가
// projects.length와 안 맞으면(LLM이 구분선을 빠뜨린 드문 경우) 위치 매칭을 포기하고
// 텍스트는 그대로 둔 채 카드를 답변 하단에 나열하는 방식으로 폴백한다.
function renderProjectContent(content: string, projects: ProjectCard[], isStreaming: boolean) {
  const segments = splitIntoProjectSegments(content);
  if (!isStreaming && segments.length !== projects.length) {
    return (
      <>
        {renderMarkdownContent(content)}
        <div className="mt-2 flex flex-col border-t border-ink/15 pt-1">
          {projects.map((project) => (
            <ProjectThumbnail key={project.projectId} project={project} />
          ))}
        </div>
      </>
    );
  }
  return segments.map((segment, i) => (
    <Fragment key={i}>
      {projects[i] && <ProjectThumbnail project={projects[i]} />}
      {renderMarkdownContent(segment)}
    </Fragment>
  ));
}

function ChatBubble({
  role,
  content,
  references,
  projects,
  isStreaming,
}: {
  role: "user" | "assistant";
  content: string;
  references?: { category: string; topic: string }[];
  projects?: ProjectCard[];
  isStreaming?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl border-2 border-ink px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser ? "bg-brand text-white" : "bg-paper text-ink"
        }`}
      >
        {projects && projects.length > 0
          ? renderProjectContent(content, projects, !!isStreaming)
          : renderMarkdownContent(content)}
        {references && references.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 border-t border-ink/15 pt-2">
            {references.map((ref, i) => (
              <span
                key={i}
                className="rounded-full border border-ink/20 bg-white/60 px-2 py-0.5 text-[11px] font-semibold text-ink/70"
              >
                {ref.category} · {ref.topic}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// tool_start마다 항목을 쌓아 진행형 문구로 보여주다가, metadata 도착(=그 턴의 tool 호출이
// 전부 성공)을 신호로 스택 전체를 완료형 문구로 한 번에 전환한다. 응답이 빨라 진행형 문구
// 하나만 띄우면 읽기 전에 사라지는 문제 때문에 완료된 항목을 계속 쌓아 보여주는 방식이다.
function ToolProgressStack({ items, completed }: { items: ToolStartEvent[]; completed: boolean }) {
  return (
    <div className="flex justify-start">
      <div className="flex max-w-[80%] flex-col gap-1 rounded-2xl border-2 border-ink bg-paper px-3.5 py-2.5 text-xs text-ink/70">
        {items.map((item) => (
          <div key={item.sequence} className="flex items-center gap-1.5">
            <span className={completed ? "text-brand" : "animate-pulse"}>{completed ? "✓" : "•"}</span>
            <span>{completed ? item.completedMessage : item.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl border-2 border-ink bg-paper px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/50 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/50 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/50" />
      </div>
    </div>
  );
}

function ChatWindow() {
  const messages = useChatStore((state) => state.messages);
  const isSending = useChatStore((state) => state.isSending);
  const close = useChatStore((state) => state.close);
  const sendMessage = useSendChatMessage();
  const resetSession = useResetChatSession();
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  // 응답이 스트리밍되는 동안 계속 addMessage가 일어나 매번 강제로 바닥까지 스크롤하면
  // 사용자가 위로 스크롤해 이전 내용을 봐도 곧바로 다시 끌려 내려온다 — 이미 바닥 근처에
  // 있을 때만 따라 내려가고, 위로 올려 읽는 중이면 그 위치를 유지한다.
  const stickToBottomRef = useRef(true);
  const BOTTOM_THRESHOLD_PX = 32;

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD_PX;
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    stickToBottomRef.current = true;
    sendMessage.mutate(trimmed);
    setInput("");
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 flex h-[640px] max-h-[80vh] w-[380px] max-w-[92vw] flex-col overflow-hidden rounded-lg border-2 border-ink bg-surface shadow-stamp-lg">
      <div className="flex items-center justify-between border-b-2 border-ink bg-brand px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Mascot variant="face" className="h-8 w-8" />
          <div className="flex flex-col leading-tight">
            <span className="font-display font-extrabold">오목눈이</span>
            <span className="text-[11px] text-white/80">얼리버드 도우미</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => resetSession.mutate()}
            disabled={resetSession.isPending}
            aria-label="새 채팅"
            title="새 채팅"
            className="rounded-full p-1.5 transition-colors hover:bg-white/20 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="닫기"
            className="rounded-full p-1.5 transition-colors hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={listRef} onScroll={handleScroll} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-mist">
            <Mascot variant="face" className="h-12 w-12" />
            <p>안녕하세요! 오목눈이예요.{"\n"}프로젝트나 이용 방법이 궁금하면 물어보세요.</p>
          </div>
        )}
        {messages.map((message, index) => {
          const isLastAssistant = isSending && index === messages.length - 1 && message.role === "assistant";
          const isPlaceholder = isLastAssistant && message.content === "";
          const hasToolProgress = (message.toolProgress?.length ?? 0) > 0;

          if (isPlaceholder && !hasToolProgress) {
            return <TypingIndicator key={message.id} />;
          }
          return (
            <Fragment key={message.id}>
              {hasToolProgress && (
                <ToolProgressStack items={message.toolProgress!} completed={!!message.toolProgressCompleted} />
              )}
              {!isPlaceholder && (
                <ChatBubble
                  role={message.role}
                  content={message.content}
                  references={message.references}
                  projects={message.projects}
                  isStreaming={isLastAssistant}
                />
              )}
            </Fragment>
          );
        })}
      </div>

      <div className="flex items-end gap-2 border-t-2 border-ink bg-surface p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="메시지를 입력하세요"
          rows={1}
          className="max-h-24 flex-1 resize-none rounded-lg border-2 border-ink/20 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || isSending}
          aria-label="전송"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-brand text-white transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ChatWidget() {
  useChatIdentitySync();
  const isOpen = useChatStore((state) => state.isOpen);
  const toggle = useChatStore((state) => state.toggle);

  return (
    <>
      {isOpen && <ChatWindow />}
      <button
        type="button"
        onClick={toggle}
        aria-label={isOpen ? "챗봇 닫기" : "챗봇 열기"}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-brand text-white shadow-stamp transition-transform hover:scale-105 active:scale-95"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
