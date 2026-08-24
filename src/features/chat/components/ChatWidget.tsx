import { Fragment, useEffect, useRef, useState } from "react";
import { MessageCircle, RotateCcw, SendHorizontal, X } from "lucide-react";
import { Mascot } from "../../../shared/ui";
import { useChatIdentitySync, useSendChatMessage, useResetChatSession } from "../hooks";
import { useChatStore } from "../store";

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

function ChatBubble({ role, content, references }: { role: "user" | "assistant"; content: string; references?: { category: string; topic: string }[] }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl border-2 border-ink px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser ? "bg-brand text-white" : "bg-paper text-ink"
        }`}
      >
        {renderMarkdownContent(content)}
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
    <div className="fixed bottom-24 right-6 z-50 flex h-[560px] max-h-[75vh] w-[380px] max-w-[92vw] flex-col overflow-hidden rounded-lg border-2 border-ink bg-surface shadow-stamp-lg">
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
          const isStreamingPlaceholder =
            isSending && index === messages.length - 1 && message.role === "assistant" && message.content === "";
          if (isStreamingPlaceholder) {
            return <TypingIndicator key={message.id} />;
          }
          return (
            <ChatBubble key={message.id} role={message.role} content={message.content} references={message.references} />
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
