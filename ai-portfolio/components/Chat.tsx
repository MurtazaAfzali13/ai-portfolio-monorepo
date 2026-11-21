"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { UserButton } from "@clerk/nextjs";
import {
  ArrowDown,
  CheckCheck,
  Copy,
  Check,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  Trash2,
  X
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Types (unchanged, plus a `time` label for the timestamps)                  */
/* -------------------------------------------------------------------------- */

type StageId = "understand" | "retrieve" | "rank" | "generate";
type StepStatus = "pending" | "active" | "done";

type Step = { id: StageId; status: StepStatus; detail?: string; ms?: number };
type Source = { title: string; score: number; snippet: string };

type StreamEvent =
  | { type: "stage"; id: StageId; status: "start" | "done"; detail: string; ms: number }
  | { type: "sources"; sources: Source[] }
  | { type: "token"; content: string }
  | { type: "done"; total_ms: number }
  | { type: "error"; message: string };

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  sources?: Source[];
  steps?: Step[];
  totalMs?: number;
  isError?: boolean;
};

type Live = { steps: Step[]; content: string; sources: Source[] };

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const STAGE_ORDER: StageId[] = ["understand", "retrieve", "rank", "generate"];

const STARTER_PROMPTS: string[] = [
  "Who is Murtaza Afzali?",
  "What skills does he have?",
  "What projects has he built?",
  "What is VidBrain, his flagship project?",
  "What is his education and experience?",
  "How can I contact or hire him?"
];

const FOLLOW_UPS: string[] = [
  "Explain in more detail",
  "Summarize in 3 bullets",
  "Give a concrete example"
];

const freshSteps = (): Step[] => STAGE_ORDER.map((id) => ({ id, status: "pending" }));

const RTL = /[\u0590-\u08FF]/;
const dirOf = (text: string) => (RTL.test(text) ? "rtl" : "ltr");
const NEAR_BOTTOM_PX = 80;

const nowLabel = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/* -------------------------------------------------------------------------- */
/*  Markdown (light styling)                                                   */
/* -------------------------------------------------------------------------- */

const mdComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-[#2b1a10]">{children}</strong>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 ps-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 ps-5 last:mb-0">{children}</ol>,
  h1: ({ children }) => <h3 className="mb-1 text-base font-semibold text-[#2b1a10]">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-1 text-base font-semibold text-[#2b1a10]">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-1 text-[15px] font-semibold text-[#2b1a10]">{children}</h4>,
  code: ({ children }) => (
    <code className="rounded bg-orange-100 px-1 py-0.5 font-mono text-[0.85em] text-orange-800">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-xl bg-orange-50 p-3 font-mono text-[13px] text-[#3b2a20] [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-orange-600 underline underline-offset-2"
    >
      {children}
    </a>
  )
};

/* -------------------------------------------------------------------------- */
/*  Small pieces                                                               */
/* -------------------------------------------------------------------------- */

function AssistantAvatar() {
  return (
    <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-md shadow-orange-500/30">
      <Sparkles className="size-4 text-white" />
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-3">
      <AssistantAvatar />
      <div className="flex items-center gap-1.5 rounded-2xl bg-white px-4 py-3.5 shadow-sm shadow-orange-900/5">
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            style={{ animationDelay: `${d}ms` }}
            className="size-2 animate-bounce rounded-full bg-orange-500 motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  );
}

function SourceChips({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5" dir="ltr">
      {sources.map((s, i) => (
        <span
          key={`${s.title}-${i}`}
          title={s.snippet}
          className="max-w-[200px] truncate rounded-full bg-white/70 px-2.5 py-0.5 text-[11px] text-orange-800 ring-1 ring-orange-200"
        >
          {s.title} · {Math.round(s.score * 100)}%
        </span>
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable: ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={copied ? "Copied" : "Copy answer"}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-stone-400 transition-colors hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Bubble({
  message,
  streaming
}: {
  message: Pick<Message, "role" | "content" | "isError">;
  streaming?: boolean;
}) {
  const dir = dirOf(message.content);

  if (message.role === "user") {
    return (
      <div
        dir={dir}
        className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-[15px] font-medium leading-relaxed text-white shadow-md shadow-orange-600/25"
      >
        {message.content}
      </div>
    );
  }

  return (
    <div
      dir={dir}
      className={`min-w-0 max-w-[88%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm shadow-orange-900/5 ${
        message.isError ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-white text-[#3b2a20]"
      }`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {message.content}
      </ReactMarkdown>
      {streaming && (
        <span className="ms-0.5 inline-block h-4 w-[3px] translate-y-0.5 animate-pulse rounded-sm bg-orange-500 align-middle" />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Welcome                                                                    */
/* -------------------------------------------------------------------------- */

function Welcome({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex min-h-full flex-col justify-center py-4">
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 size-16 overflow-hidden rounded-full ring-4 ring-orange-400/70">
          <Image
            src="/images/murtazaafzali.png"
            width={64}
            height={64}
            alt="Murtaza AI Agent"
            className="size-full object-cover"
          />
        </div>
        <h3 className="text-xl font-semibold text-[#2b1a10]">Ask about Murtaza’s work</h3>
        <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-stone-500">
          I answer from his real portfolio.
        </p>
      </div>

      <div className="grid gap-2">
        {STARTER_PROMPTS.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => onPick(text)}
            className="rounded-2xl bg-white px-4 py-3 text-start text-[14px] text-[#3b2a20] shadow-sm shadow-orange-900/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-orange-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

interface ChatPageProps {
  onClose?: () => void;
}

export default function ChatPage({ onClose }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [live, setLive] = useState<Live | null>(null);
  const [showJump, setShowJump] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pinnedRef = useRef(true);
  const runIdRef = useRef(0);

  const updatePinned = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    pinnedRef.current = near;
    setShowJump(!near);
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // Follow the answer while it grows.
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const ro = new ResizeObserver(() => {
      if (pinnedRef.current) scrollToBottom();
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, [scrollToBottom]);

  useEffect(() => {
    if (pinnedRef.current) scrollToBottom();
  }, [messages, live, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const resizeInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  };

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || isLoading) return;

    // A "run" is one question. If the chat is reset mid-answer, the old run must not write anything.
    const runId = ++runIdRef.current;
    const isCurrent = () => runIdRef.current === runId;
    const append = (message: Message) => {
      if (isCurrent()) setMessages((prev) => [...prev, message]);
    };

    pinnedRef.current = true;
    setShowJump(false);
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      time: nowLabel()
    };
    const history = [...messages, userMessage];

    setMessages(history);
    setInput("");
    requestAnimationFrame(resizeInput);
    setIsLoading(true);

    const acc = {
      steps: freshSteps(),
      content: "",
      sources: [] as Source[],
      totalMs: undefined as number | undefined,
      error: ""
    };
    setLive({ steps: acc.steps, content: "", sources: [] });

    const controller = new AbortController();
    abortRef.current = controller;

    const apply = (ev: StreamEvent) => {
      switch (ev.type) {
        case "stage":
          acc.steps = acc.steps.map((s) =>
            s.id === ev.id
              ? {
                  ...s,
                  status: ev.status === "start" ? "active" : "done",
                  detail: ev.detail || s.detail,
                  ms: ev.status === "done" ? ev.ms : undefined
                }
              : s
          );
          break;
        case "sources":
          acc.sources = ev.sources;
          break;
        case "token":
          acc.content += ev.content;
          break;
        case "done":
          acc.totalMs = ev.total_ms;
          break;
        case "error":
          acc.error = ev.message;
          break;
      }
      if (isCurrent()) setLive({ steps: acc.steps, content: acc.content, sources: acc.sources });
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content }))
        }),
        signal: controller.signal
      });
      if (!res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const flushLines = (final = false) => {
        let nl: number;
        while ((nl = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (line) {
            try {
              apply(JSON.parse(line) as StreamEvent);
            } catch {
              /* ignore a malformed line */
            }
          }
        }
        if (final && buffer.trim()) {
          try {
            apply(JSON.parse(buffer) as StreamEvent);
          } catch {
            /* ignore */
          }
          buffer = "";
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        flushLines();
      }
      flushLines(true);

      if (acc.content) {
        append({
          id: crypto.randomUUID(),
          role: "assistant",
          content: acc.content,
          time: nowLabel(),
          sources: acc.sources,
          steps: acc.steps,
          totalMs: acc.totalMs
        });
      } else {
        append({
          id: crypto.randomUUID(),
          role: "assistant",
          content: acc.error || "No answer came back. Try asking again.",
          time: nowLabel(),
          isError: true
        });
      }
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === "AbortError";
      if (aborted && acc.content) {
        append({
          id: crypto.randomUUID(),
          role: "assistant",
          content: acc.content,
          time: nowLabel(),
          sources: acc.sources,
          steps: acc.steps
        });
      } else if (!aborted) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        append({
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Connection error: ${msg}. Check that the backend is running and try again.`,
          time: nowLabel(),
          isError: true
        });
      }
    } finally {
      if (isCurrent()) {
        setIsLoading(false);
        setLive(null);
        abortRef.current = null;
        setTimeout(() => inputRef.current?.focus(), 80);
      }
    }
  };

  const handleCancel = () => abortRef.current?.abort();

  const resetChat = () => {
    runIdRef.current += 1; // invalidates any answer that is still streaming
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setLive(null);
    setIsLoading(false);
    setInput("");
    pinnedRef.current = true;
    setShowJump(false);
    requestAnimationFrame(resizeInput);
    inputRef.current?.focus();
  };

  const jumpToLatest = () => {
    pinnedRef.current = true;
    setShowJump(false);
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  };

  const canSend = input.trim().length > 0;
  const showWelcome = messages.length === 0 && !live;
  const hasConversation = messages.length > 0 || live !== null;
  const canFollowUp = !isLoading && messages.some((m) => m.role === "assistant" && !m.isError);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-[#fff6ef] via-[#ffeadb] to-[#ffdcc4] text-[#3b2a20] shadow-2xl ring-1 ring-orange-200/60 sm:rounded-3xl">
      {/* header */}
     {/* header */}
      <header className="flex shrink-0 items-center justify-between px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="relative size-11">
            <div className="size-full overflow-hidden rounded-full ring-2 ring-orange-500/80">
              <Image
                src="/images/murtazaafzali.png"
                width={44}
                height={44}
                alt="Murtaza AI Agent"
                className="size-full object-cover"
              />
            </div>
            <span className="absolute -bottom-0.5 -left-0.5 size-3.5 rounded-full border-2 border-[#fff6ef] bg-emerald-500" />
          </div>
          <h2 className="text-[16px] font-semibold text-[#3b2a20]">Murtaza AI Agent</h2>
        </div>

        <div className="flex items-center gap-1.5">
        <UserButton
            appearance={{
              elements: {
                avatarBox: "size-8 ring-2 ring-orange-400/70",
              },
            }}
          />

          {hasConversation && (
            <button
              type="button"
              onClick={resetChat}
              aria-label="Start a new chat"
              title="New chat"
              className="rounded-full p-2 text-stone-500 transition-colors hover:bg-orange-500/10 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <RotateCcw className="size-[18px]" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chat"
              className="rounded-full p-2 text-stone-500 transition-colors hover:bg-orange-500/10 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
      </header>

      {/* conversation */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={updatePinned}
          className="h-full overflow-y-auto px-4 py-3 sm:px-5 [scrollbar-color:#fdba74_transparent] [scrollbar-width:thin]"
        >
          {showWelcome && <Welcome onPick={(text) => void send(text)} />}

          <div ref={contentRef} className="space-y-4">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex flex-col items-end gap-1">
                  <Bubble message={m} />
                  <span className="flex items-center gap-1 text-[11px] text-stone-400">
                    {m.time}
                    <CheckCheck className="size-3.5 text-orange-500" />
                  </span>
                </div>
              ) : (
                <div key={m.id} className="flex items-start gap-3">
                  <AssistantAvatar />
                  <div className="min-w-0 flex-1">
                    <Bubble message={m} />
                    {m.sources && <SourceChips sources={m.sources} />}
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-stone-400" dir="ltr">
                      <span>{m.time}</span>
                      {!m.isError && <CopyButton text={m.content} />}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* live run: three dots first, then the streaming answer */}
            {live && !live.content && <TypingDots />}
            {live && live.content && (
              <div className="flex items-start gap-3">
                <AssistantAvatar />
                <div className="min-w-0 flex-1">
                  <Bubble message={{ role: "assistant", content: live.content }} streaming />
                  <SourceChips sources={live.sources} />
                </div>
              </div>
            )}
          </div>
        </div>

        {showJump && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <button
              type="button"
              onClick={jumpToLatest}
              aria-label="Scroll to the latest message"
              className="pointer-events-auto flex size-9 items-center justify-center rounded-full bg-white text-orange-600 shadow-lg shadow-orange-900/15 transition-colors hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <ArrowDown className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* composer */}
      <footer className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-5">
        {canFollowUp && (
          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
            {FOLLOW_UPS.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => void send(text)}
                className="shrink-0 rounded-full bg-white/80 px-3 py-1.5 text-[12px] font-medium text-orange-700 ring-1 ring-orange-200 transition-colors hover:bg-orange-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              >
                {text}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2.5">
          <textarea
            ref={inputRef}
            value={input}
            dir="auto"
            rows={1}
            onChange={(e) => {
              setInput(e.target.value);
              pinnedRef.current = true;
              resizeInput();
            }}
            onKeyDown={onKeyDown}
            placeholder="Type your message..."
            aria-label="Message"
            className="max-h-32 min-h-[46px] w-full resize-none rounded-3xl bg-white/80 px-5 py-3 text-[15px] text-[#3b2a20] outline-none ring-1 ring-orange-200/70 placeholder:text-stone-400 focus:ring-2 focus:ring-orange-400"
          />
          {isLoading ? (
            <button
              type="button"
              onClick={handleCancel}
              title="Stop generating"
              aria-label="Stop generating"
              className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 ring-1 ring-orange-300 transition-colors hover:bg-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <Square className="size-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void send()}
              disabled={!canSend}
              aria-label="Send message"
              className={`flex size-[46px] shrink-0 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                canSend
                  ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md shadow-orange-600/35 hover:scale-105"
                  : "cursor-not-allowed bg-orange-300/60 text-white/80"
              }`}
            >
              <Send className="size-[18px]" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={resetChat}
          disabled={!hasConversation}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-2.5 text-[13px] font-medium text-[#3b2a20] shadow-sm shadow-orange-900/5 ring-1 ring-orange-100 transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          <Trash2 className="size-4" />
          Clear chat
        </button>
      </footer>
    </div>
  );
}
