"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import type { ComponentType, ReactElement, ReactNode } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { MotionProps, Variants } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Briefcase,
  Check,
  ChevronDown,
  Copy,
  Cpu,
  FileText,
  Layers,
  ListFilter,
  MessagesSquare,
  RotateCcw,
  SearchCode,
  ShieldCheck,
  Sparkles,
  Square,
  X
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
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
  sources?: Source[];
  steps?: Step[];
  totalMs?: number;
  isError?: boolean;
};

type Live = { steps: Step[]; content: string; sources: Source[] };

type IconType = ComponentType<{ className?: string }>;

type StarterPrompt = { icon: IconType; text: string; accent: string };

/* -------------------------------------------------------------------------- */
/*  Pipeline metadata (one entry per REAL backend stage)                       */
/* -------------------------------------------------------------------------- */

const STAGE_ORDER: StageId[] = ["understand", "retrieve", "rank", "generate"];

const STAGE_META: Record<
  StageId,
  {
    activeLabel: string;
    doneLabel: string;
    icon: IconType;
    accent: string;
    glow: string;
  }
> = {
  understand: {
    activeLabel: "Understanding your question",
    doneLabel: "Understood your question",
    icon: MessagesSquare,
    accent: "from-sky-400 to-blue-600",
    glow: "shadow-sky-500/50"
  },
  retrieve: {
    activeLabel: "Searching the knowledge base",
    doneLabel: "Searched the knowledge base",
    icon: SearchCode,
    accent: "from-violet-400 to-indigo-600",
    glow: "shadow-violet-500/50"
  },
  rank: {
    activeLabel: "Ranking the best passages",
    doneLabel: "Ranked the best passages",
    icon: ListFilter,
    accent: "from-fuchsia-400 to-purple-600",
    glow: "shadow-fuchsia-500/50"
  },
  generate: {
    activeLabel: "Writing the answer",
    doneLabel: "Wrote the answer",
    icon: Sparkles,
    accent: "from-amber-300 to-rose-500",
    glow: "shadow-rose-500/50"
  }
};

const STARTER_PROMPTS: StarterPrompt[] = [
  {
    icon: Sparkles,
    text: "Who is Murtaza Afzali?",
    accent: "from-violet-400 to-indigo-600"
  },
  {
    icon: Cpu,
    text: "What skills does he have?",
    accent: "from-fuchsia-400 to-purple-600"
  },
  {
    icon: Layers,
    text: "What projects has he built?",
    accent: "from-sky-400 to-blue-600"
  },
  {
    icon: ShieldCheck,
    text: "What is VidBrain, his flagship project?",
    accent: "from-emerald-400 to-teal-600"
  },
  {
    icon: Briefcase,
    text: "What is his education and experience?",
    accent: "from-amber-300 to-orange-500"
  },
  {
    icon: MessagesSquare,
    text: "How can I contact or hire him?",
    accent: "from-rose-400 to-pink-600"
  }
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

const fmtMs = (ms?: number) =>
  ms === undefined ? "" : ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

/* -------------------------------------------------------------------------- */
/*  Markdown styling                                                           */
/* -------------------------------------------------------------------------- */

type LiProps = { children?: ReactNode; ordered?: boolean; index?: number };

// Bullets for unordered lists, numbered badges for ordered lists.
const ListItem = ({ children, ordered, index }: LiProps) => (
  <li className="flex gap-2.5">
    {ordered ? (
      <span className="mt-[0.2em] flex size-5 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-violet-500/40 to-cyan-500/30 font-mono text-[11px] font-semibold text-cyan-100">
        {index}
      </span>
    ) : (
      <span className="mt-[0.62em] size-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-400 to-cyan-300" />
    )}
    <span className="min-w-0">{children}</span>
  </li>
);

const numberListItems = (children: ReactNode, ordered: boolean): ReactNode => {
  let i = 0;
  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    i += 1;
    return cloneElement(child as ReactElement<LiProps>, { ordered, index: i });
  });
};

const mdComponents: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  ul: ({ children }) => (
    <ul className="mb-3 space-y-1.5 last:mb-0">{numberListItems(children, false)}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 space-y-1.5 last:mb-0">{numberListItems(children, true)}</ol>
  ),
  li: ListItem,
  h1: ({ children }) => <h3 className="mb-2 mt-1 text-lg font-semibold text-white">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-2 mt-1 text-base font-semibold text-white">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-1.5 mt-1 text-[15px] font-semibold text-white">{children}</h4>,
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-s-2 border-violet-400/50 ps-3 text-slate-300">{children}</blockquote>
  ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[13px] leading-relaxed text-slate-200 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-slate-200">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-cyan-200">
      {children}
    </code>
  ),
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full border-collapse text-[13px]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-white/10 bg-white/[0.04] px-3 py-2 text-start font-semibold text-white">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border-b border-white/[0.06] px-3 py-2">{children}</td>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 hover:decoration-cyan-300"
    >
      {children}
    </a>
  )
};

/* -------------------------------------------------------------------------- */
/*  Agent pipeline card: the live trace of what the backend is doing           */
/* -------------------------------------------------------------------------- */

function AgentPipeline({
  steps,
  live,
  compact,
  totalMs
}: {
  steps: Step[];
  live: boolean;
  compact?: boolean;
  totalMs?: number;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const expanded = open || (live && !compact);

  const doneCount = steps.filter((s) => s.status === "done").length;
  const hasActive = steps.some((s) => s.status === "active");
  const pct = ((doneCount + (hasActive ? 0.5 : 0)) / steps.length) * 100;
  const summaryMs = totalMs ?? steps.reduce((sum, s) => sum + (s.ms ?? 0), 0);

  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B1022]/80 shadow-xl shadow-violet-950/30 backdrop-blur-xl">
      {/* progress bar */}
      <div className="h-[3px] w-full bg-white/[0.04]">
        <motion.div
          className="pf-bar h-full rounded-r-full bg-gradient-to-r from-sky-400 via-violet-500 to-rose-400"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* summary row (collapsible once the run is finished) */}
      {(!live || compact) && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={expanded}
          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-start text-[12px] font-medium text-slate-300 transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
            <Check className="size-3" />
          </span>
          <span>{live ? "Agent trace" : `Reasoned in ${fmtMs(summaryMs)}`}</span>
          <span className="text-slate-500">
            {doneCount}/{steps.length} steps
          </span>
          <ChevronDown
            className={`ms-auto size-4 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <ol className="px-4 pb-1 pt-3.5" dir="ltr">
              {steps.map((step, i) => {
                const meta = STAGE_META[step.id];
                const Icon = meta.icon;
                const isLast = i === steps.length - 1;
                return (
                  <li key={step.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="relative flex size-8 shrink-0 items-center justify-center">
                        {step.status === "active" && !reduce && (
                          <motion.span
                            className={`absolute inset-0 rounded-full bg-gradient-to-br ${meta.accent} opacity-40 blur-md`}
                            animate={{ scale: [1, 1.45, 1], opacity: [0.35, 0.7, 0.35] }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                          />
                        )}
                        <span
                          className={`relative flex size-7 items-center justify-center rounded-full transition-all duration-300 ${
                            step.status === "active"
                              ? `bg-gradient-to-br ${meta.accent} text-white shadow-lg ${meta.glow}`
                              : step.status === "done"
                                ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
                                : "border border-white/10 bg-white/[0.03] text-slate-600"
                          }`}
                        >
                          {step.status === "done" ? (
                            <Check className="size-3.5" />
                          ) : (
                            <Icon className="size-3.5" />
                          )}
                        </span>
                      </div>
                      {!isLast && (
                        <span
                          className={`my-0.5 w-px flex-1 transition-colors duration-500 ${
                            step.status === "done"
                              ? "bg-gradient-to-b from-emerald-400/50 to-white/10"
                              : "bg-white/10"
                          }`}
                        />
                      )}
                    </div>

                    <div className={`min-w-0 flex-1 ${isLast ? "pb-3" : "pb-4"}`}>
                      <div className="flex items-center gap-2">
                        <p
                          className={`truncate text-[13px] font-medium ${
                            step.status === "active"
                              ? "pf-shimmer bg-gradient-to-r from-slate-100 via-white to-slate-400 bg-clip-text text-transparent"
                              : step.status === "done"
                                ? "text-slate-200"
                                : "text-slate-600"
                          }`}
                        >
                          {step.status === "done" ? meta.doneLabel : meta.activeLabel}
                        </p>
                        {step.status === "done" && (
                          <span className="ms-auto shrink-0 rounded-md bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                            {fmtMs(step.ms)}
                          </span>
                        )}
                        {step.status === "active" && (
                          <span className="ms-auto flex shrink-0 items-center gap-1">
                            {[0, 150, 300].map((d) => (
                              <span
                                key={d}
                                style={{ animationDelay: `${d}ms` }}
                                className="size-1 animate-bounce rounded-full bg-violet-300 motion-reduce:animate-none"
                              />
                            ))}
                          </span>
                        )}
                      </div>
                      <AnimatePresence mode="wait" initial={false}>
                        {step.detail && step.status !== "pending" && (
                          <motion.p
                            key={step.detail}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            className="mt-0.5 text-[12px] leading-snug text-slate-400"
                          >
                            {step.detail}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </li>
                );
              })}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sources & actions                                                          */
/* -------------------------------------------------------------------------- */

function SourceChips({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <div className="mt-2.5 flex max-w-full flex-wrap items-center gap-1.5" dir="ltr">
      <FileText className="size-3.5 text-slate-500" aria-hidden />
      {sources.map((s, i) => (
        <span
          key={`${s.title}-${i}`}
          title={s.snippet}
          className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] py-1 pe-2.5 ps-2 text-[11px] text-slate-300 transition-colors hover:border-white/25 hover:bg-white/[0.08]"
        >
          <span className="rounded-full bg-gradient-to-r from-violet-500/30 to-cyan-500/30 px-1.5 font-mono text-[10px] text-cyan-100">
            {Math.round(s.score * 100)}%
          </span>
          <span className="truncate">{s.title}</span>
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
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
    >
      {copied ? <Check className="size-3.5 text-emerald-300" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Message bubble                                                             */
/* -------------------------------------------------------------------------- */

function AssistantAvatar({ busy }: { busy?: boolean }) {
  return (
    <div
      className={`mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30 ${
        busy ? "pf-pulse" : ""
      }`}
    >
      <Sparkles className="size-3.5 text-white" />
    </div>
  );
}

function Bubble({
  message,
  streaming
}: {
  message: Pick<Message, "role" | "content" | "isError">;
  streaming?: boolean;
}) {
  const isUser = message.role === "user";
  const dir = dirOf(message.content);

  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div
          dir={dir}
          className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-4 py-3 text-[15px] leading-relaxed text-white shadow-lg shadow-indigo-900/40 ring-1 ring-white/15 sm:max-w-[75%]"
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      dir={dir}
      className={`min-w-0 max-w-full rounded-2xl rounded-tl-md border px-4 py-3 text-[15px] leading-[1.7] shadow-lg backdrop-blur-xl transition-shadow duration-500 sm:max-w-[85%] ${
        message.isError
          ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
          : streaming
            ? "border-cyan-400/25 bg-white/[0.05] text-slate-200 shadow-[0_0_34px_-10px_rgba(34,211,238,0.55)]"
            : "border-white/[0.09] bg-white/[0.045] text-slate-200 shadow-black/20"
      }`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {message.content}
      </ReactMarkdown>
      {streaming && (
        <span className="pf-caret ms-0.5 inline-block h-4 w-[3px] translate-y-0.5 rounded-sm bg-cyan-300 align-middle" />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Welcome screen                                                             */
/* -------------------------------------------------------------------------- */

const welcomeContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } }
};

const welcomeItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

function Welcome({ onPick, reduce }: { onPick: (text: string) => void; reduce: boolean }) {
  return (
    <div className="flex min-h-full flex-col justify-center py-4">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-4 text-center"
      >
        <div className="relative mx-auto mb-3 size-16">
          <span className="pf-spin absolute -inset-1 rounded-full bg-[conic-gradient(from_0deg,#8b5cf6,#22d3ee,#f472b6,#8b5cf6)] opacity-90 blur-[3px]" />
          <span className="absolute inset-0 rounded-full bg-[#05070F]" />
          <span className="absolute inset-[3px] overflow-hidden rounded-full">
            <Image
              src="/images/murtazaafzali.png"
              width={64}
              height={64}
              alt="Murtaza AI Agent"
              className="size-full object-cover"
            />
          </span>
        </div>
        <h3 className="bg-gradient-to-r from-violet-300 via-white to-cyan-300 bg-clip-text text-2xl font-semibold tracking-tight text-transparent sm:text-[28px]">
          Ask about Murtaza’s work
        </h3>
        <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-slate-400">
          I answer from his real portfolio, and show you exactly how I found each answer.
        </p>
      </motion.div>

      <motion.div
        variants={welcomeContainer}
        initial={reduce ? "show" : "hidden"}
        animate="show"
        className="grid gap-2"
      >
        {STARTER_PROMPTS.map((prompt) => {
          const Icon = prompt.icon;
          return (
            <motion.button
              key={prompt.text}
              type="button"
              variants={welcomeItem}
              whileHover={reduce ? undefined : { y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPick(prompt.text)}
              className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.04] p-3 text-start backdrop-blur-xl transition-colors hover:border-white/25 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <span
                className={`relative flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${prompt.accent} text-white shadow-lg`}
              >
                <Icon className="size-4" />
              </span>
              <span className="relative min-w-0 flex-1 text-[13.5px] leading-snug text-slate-200">
                {prompt.text}
              </span>
              <ArrowUpRight className="relative size-4 shrink-0 text-slate-500 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
            </motion.button>
          );
        })}
      </motion.div>
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
  const reduce = useReducedMotion() ?? false;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [live, setLive] = useState<Live | null>(null);
  const [showJump, setShowJump] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
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

  // Follow the answer while it grows (tokens, pipeline collapsing, animations).
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
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: text };
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
          sources: acc.sources,
          steps: acc.steps,
          totalMs: acc.totalMs
        });
      } else {
        append({
          id: crypto.randomUUID(),
          role: "assistant",
          content: acc.error || "No answer came back. Try asking again.",
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
          sources: acc.sources,
          steps: acc.steps
        });
      } else if (!aborted) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        append({
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Connection error: ${msg}. Check that the backend is running and try again.`,
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
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
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

  const messageAnim: MotionProps = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: "easeOut" }
      };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#05070F] text-slate-200 shadow-2xl ring-1 ring-white/10 sm:rounded-3xl">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="pf-float absolute -left-24 -top-24 size-[22rem] rounded-full bg-violet-600/25 blur-[90px]" />
        <div
          className="pf-float absolute -bottom-28 -right-20 size-[24rem] rounded-full bg-cyan-500/15 blur-[100px]"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="pf-float absolute right-1/3 top-1/3 size-[14rem] rounded-full bg-fuchsia-600/10 blur-[80px]"
          style={{ animationDelay: "-12s" }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            maskImage: "radial-gradient(ellipse at 50% 30%, #000 20%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, #000 20%, transparent 75%)"
          }}
        />
      </div>

      {/* header */}
      <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#05070F]/60 px-4 py-3 backdrop-blur-2xl sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="relative size-11">
            <span className="pf-spin absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#8b5cf6,#22d3ee,#f472b6,#8b5cf6)] opacity-90" />
            <span className="absolute inset-[2px] overflow-hidden rounded-full bg-[#05070F]">
              <Image
                src="/images/murtazaafzali.png"
                width={44}
                height={44}
                alt="Murtaza AI Agent"
                className="size-full rounded-full object-cover"
              />
            </span>
          </div>
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-white">Murtaza AI Agent</h2>
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 sm:text-xs">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              Online, answers from his real portfolio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {hasConversation && (
            <button
              type="button"
              onClick={resetChat}
              aria-label="Start a new chat"
              title="New chat"
              className="rounded-xl p-2 text-slate-400 transition-all duration-300 hover:bg-white/10 hover:text-white hover:[&>svg]:-rotate-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
            >
              <RotateCcw className="size-[18px] transition-transform duration-300" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close chat"
              className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
      </header>

      {/* conversation */}
      <div className="relative z-10 min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={updatePinned}
          className="h-full overflow-y-auto px-4 py-5 sm:px-6 [scrollbar-color:#334155_transparent] [scrollbar-width:thin]"
        >
          {showWelcome && (
            <Welcome
              reduce={reduce}
              onPick={(text) => {
                void send(text);
              }}
            />
          )}

          <div ref={contentRef} className="space-y-5 sm:space-y-6">
            {messages.map((m) => (
              <motion.div key={m.id} {...messageAnim} className="flex w-full flex-col gap-2.5">
                {m.role === "assistant" && m.steps && (
                  <div className="flex gap-3">
                    <div className="w-7 shrink-0" />
                    <AgentPipeline steps={m.steps} live={false} totalMs={m.totalMs} />
                  </div>
                )}
                <div className={m.role === "assistant" ? "flex gap-3" : ""}>
                  {m.role === "assistant" && <AssistantAvatar />}
                  <div className="min-w-0 flex-1">
                    <Bubble message={m} />
                    {m.role === "assistant" && m.sources && <SourceChips sources={m.sources} />}
                    {m.role === "assistant" && !m.isError && (
                      <div className="mt-1.5 flex items-center" dir="ltr">
                        <CopyButton text={m.content} />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* live run */}
            {live && (
              <div className="flex w-full flex-col gap-2.5">
                <div className="flex gap-3">
                  <div className="w-7 shrink-0" />
                  <AgentPipeline steps={live.steps} live compact={live.content.length > 0} />
                </div>
                {live.content && (
                  <div className="flex gap-3">
                    <AssistantAvatar busy />
                    <div className="min-w-0 flex-1">
                      <Bubble message={{ role: "assistant", content: live.content }} streaming />
                      <SourceChips sources={live.sources} />
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={endRef} className="h-px" />
          </div>
        </div>

        {/* jump to latest */}
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <AnimatePresence>
            {showJump && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={jumpToLatest}
                aria-label="Scroll to the latest message"
                className="pointer-events-auto flex size-9 items-center justify-center rounded-full border border-white/15 bg-[#0B1022]/90 text-slate-200 shadow-lg shadow-black/40 backdrop-blur-xl transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
              >
                <ArrowDown className="size-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* composer */}
      <footer className="relative z-10 shrink-0 border-t border-white/[0.07] bg-[#05070F]/70 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-2xl sm:px-5">
        {canFollowUp && (
          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
            {FOLLOW_UPS.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => void send(text)}
                className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-slate-300 transition-all hover:border-violet-400/50 hover:bg-violet-500/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
              >
                {text}
              </button>
            ))}
          </div>
        )}

        <div className="relative rounded-2xl bg-gradient-to-r from-white/10 via-white/10 to-white/10 p-px transition-all duration-300 focus-within:from-violet-500/70 focus-within:via-cyan-400/60 focus-within:to-fuchsia-500/70 focus-within:shadow-[0_0_28px_-6px_rgba(139,92,246,0.55)]">
          <div className="flex items-end gap-2 rounded-[15px] bg-[#0A0F1E] p-1.5">
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
              placeholder="Ask about his skills, projects or experience..."
              aria-label="Message"
              className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-3 py-3 text-[15px] text-slate-100 outline-none placeholder:text-slate-500"
            />
            {isLoading ? (
              <button
                onClick={handleCancel}
                title="Stop generating"
                aria-label="Stop generating"
                className="mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30 transition-colors hover:bg-rose-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70"
              >
                <Square className="size-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={() => void send()}
                disabled={!canSend}
                aria-label="Send message"
                className={`mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 ${
                  canSend
                    ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-600/40 hover:scale-105 hover:from-violet-400"
                    : "cursor-not-allowed bg-white/[0.05] text-slate-600"
                }`}
              >
                <ArrowUp className="size-5" />
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] font-medium tracking-wide text-slate-500">
          Enter to send, Shift+Enter for a new line. Powered by RAG, Pinecone and OpenRouter.
        </p>
      </footer>

      <style jsx global>{`
        @keyframes pf-float {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(24px, -18px, 0) scale(1.08);
          }
        }
        @keyframes pf-shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        @keyframes pf-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pf-caret {
          0%,
          45% {
            opacity: 1;
          }
          55%,
          100% {
            opacity: 0;
          }
        }
        @keyframes pf-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.55);
          }
          70% {
            box-shadow: 0 0 0 9px rgba(139, 92, 246, 0);
          }
        }
        .pf-float {
          animation: pf-float 18s ease-in-out infinite;
        }
        .pf-shimmer {
          background-size: 200% 100%;
          animation: pf-shimmer 2.4s linear infinite;
        }
        .pf-spin {
          animation: pf-spin 7s linear infinite;
        }
        .pf-caret {
          animation: pf-caret 1s steps(1) infinite;
        }
        .pf-pulse {
          animation: pf-pulse 1.8s ease-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .pf-float,
          .pf-shimmer,
          .pf-spin,
          .pf-caret,
          .pf-pulse {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
