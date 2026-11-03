// app/components/AboutContent.tsx
"use client";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface PipelineNode {
  name: string;
  role: string;
}

interface Skills {
  aiStack: string[];
  backendTools: string[];
}

export default function AboutContent() {
  const pipeline: PipelineNode[] = [
    { name: "contextualize", role: "History-aware rewrite" },
    { name: "supervisor", role: "Routes Q&A or summary" },
    { name: "retriever", role: "Pinecone micro-chunks" },
    { name: "reranker", role: "Cross-encoder, LLM fallback" },
    { name: "expander", role: "Small-to-Big parent text" },
    { name: "validator", role: "Strict evidence gate" },
    { name: "web_search", role: "Labeled Tavily fallback" },
    { name: "generator", role: "Grounded synthesis + Self-RAG" }
  ];

  const retrievalFeatures: Feature[] = [
    {
      icon: "🔍",
      title: "Small-to-Big Retrieval",
      description:
        "Small micro-chunks are embedded in Pinecone for precise matching. After a hit, the larger parent passage is fetched from Supabase and neighboring chunks are stitched at the boundaries, so the model reads rich context while search stays accurate."
    },
    {
      icon: "🔒",
      title: "Single-Flight Indexing",
      description:
        "A Postgres lock (claim_video) lets only the first request index a video. Concurrent requests wait without blocking and reuse the same vectors, so no video is ever embedded twice."
    },
    {
      icon: "⏱️",
      title: "Verified Timestamps",
      description:
        "Citations are built from retrieved data, never from IDs the model claims. If a timestamp drifts, it snaps to the nearest real transcript marker, so every clickable [MM:SS] jumps the player to the right moment."
    },
    {
      icon: "🧠",
      title: "Two-Stage Reranking",
      description:
        "A local cross-encoder reorders retrieved chunks by relevance. If it fails, the system falls back automatically to an LLM scorer instead of crashing."
    }
  ];

  const qualityFeatures: Feature[] = [
    {
      icon: "🛡️",
      title: "Evidence Gate (Fails Closed)",
      description:
        "A validator grades every retrieved passage strictly. No evidence means no guess: the system either says so or searches the web."
    },
    {
      icon: "🌐",
      title: "Labeled Web Fallback",
      description:
        "When the video cannot answer, a live Tavily search runs with exponential-backoff retry. The answer is clearly marked as web-sourced and never passed off as the video."
    },
    {
      icon: "💬",
      title: "History-Aware Follow-Ups",
      description:
        "Messages like “explain that in more detail” are rewritten into standalone questions before any search runs."
    },
    {
      icon: "✅",
      title: "Self-RAG Grading",
      description:
        "The generator answers only from the provided context. Sources come from what was retrieved, then Self-RAG graders check the result."
    }
  ];

  const reliabilityFeatures: Feature[] = [
    {
      icon: "🏢",
      title: "Tenant Isolation",
      description:
        "Vector search is namespaced per user, with video-level filtering on top."
    },
    {
      icon: "♻️",
      title: "Checkpointing & Smart Retries",
      description:
        "State is saved at every step, so a failed run resumes from the failing node. Transient faults retry with backoff; permanent ones fail fast."
    },
    {
      icon: "📡",
      title: "Streaming over SSE",
      description:
        "Answers stream progressively to the Next.js frontend over Server-Sent Events, with live pipeline progress and the Nginx buffering bypass included."
    },
    {
      icon: "📊",
      title: "Observability",
      description:
        "Every node is traced and timed. Per-node timings and success rates appear in a role-based monitoring dashboard backed by a Supabase traces table."
    }
  ];

  const skills: Skills = {
    aiStack: [
      "LangGraph Multi-Agent Pipelines & State Checkpointing",
      "Anti-Hallucination RAG (Evidence Gate, Self-RAG Graders)",
      "Small-to-Big Retrieval, Reranking & Query Rewriting",
      "Human-in-the-Loop Gating & Anti-Race-Condition Guards",
      "FastAPI Asynchronous Services & SSE Streaming",
      "Pinecone Vector Search with Per-User Namespaces"
    ],
    backendTools: [
      "Python & LLM APIs (OpenAI, Anthropic, OpenRouter)",
      "Next.js App Router, React & TypeScript",
      "Tailwind CSS & shadcn/ui Component Systems",
      "PostgreSQL & Supabase (locks, traces, role-based access)",
      "Docker Deployment (Render, AWS)",
      "Git & API Architecture"
    ]
  };

  const renderFeatures = (items: Feature[]) => (
    <div className="grid md:grid-cols-2 gap-6">
      {items.map((item) => (
        <div
          key={item.title}
          className="group hover:bg-white/10 p-6 rounded-xl transition-all duration-300 border border-white/10"
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
            {item.icon}
          </div>
          <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-300 transition-colors duration-300">
            {item.title}
          </h4>
          <p className="text-white/75 group-hover:text-white/90 transition-colors duration-300">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative z-10 w-full">
      {/* HERO */}
      <section className="fade-in mb-16 px-4">
        <div className="mb-8 flex flex-col items-center">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 text-white text-center drop-shadow-2xl">
            About <span className="text-yellow-300 glow-text">Murtaza</span>
          </h1>

          <div className="text-2xl md:text-3xl text-white/95 mb-4 slide-in-left text-center">
            <span className="pulse-slow font-semibold drop-shadow-lg">
              Full-Stack AI Engineer · Multi-Agent RAG Systems
            </span>
          </div>

          <p className="text-xl text-white/85 max-w-2xl mx-auto slide-in-right text-center backdrop-blur-lg bg-black/40 p-6 rounded-2xl border border-white/20 shadow-2xl">
            I build AI systems that refuse to guess. My flagship project, VidBrain, is a
            self-correcting multi-agent RAG pipeline that gives grounded, timestamped answers
            from any video, and only searches the web when the video cannot answer.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4">
        {/* INTRO */}
        <section className="mb-16 slide-in-left">
          <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">Who I Am</h2>
            <div className="text-white/90 leading-relaxed space-y-4 text-lg">
              <p>
                I am Murtaza Afzali, a Full-Stack AI Engineer based in Herat, Afghanistan. I
                completed my bachelor’s degree in computer science (software) at Herat
                University in 2026, and I focus on production-grade AI systems built with{" "}
                <strong>LangGraph, FastAPI, Next.js, Pinecone, and Supabase</strong>.
              </p>
              <p>
                Most AI chatbots answer from memory when they lack evidence, which means
                hallucinations. I design the opposite: systems with an evidence gate, verified
                citations, and honest fallbacks. VidBrain is the clearest example of how I think
                about that problem, and my Restaurant &amp; Hospitality Agent applies the same
                discipline to live orders and bookings, with a{" "}
                <a
                  href="https://autonomous-restaurant-agent.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-300 underline hover:text-yellow-200"
                >
                  live demo you can try
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        {/* VIDBRAIN HERO */}
        <section className="mb-16 fade-in">
          <div className="bg-gradient-to-r from-blue-500/30 to-purple-600/30 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
              Flagship Project: <span className="text-yellow-300 glow-text">VidBrain</span>
            </h2>
            <p className="text-xl text-white/90 text-center max-w-3xl mx-auto mb-8">
              Chat with any video. Get timestamped, grounded answers. Search the web only when
              the video itself cannot answer.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {["LangGraph", "FastAPI", "Next.js", "Pinecone", "Supabase", "Tavily"].map((t) => (
                <span
                  key={t}
                  className="bg-white/15 text-white px-4 py-2 rounded-full border border-white/20 font-medium"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6 text-white/90 text-lg">
              <div className="bg-black/30 rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-red-300 mb-3">A typical video chatbot</h3>
                <ul className="space-y-2 list-disc list-inside text-white/80">
                  <li>Answers from memory when the video has no answer</li>
                  <li>Loses the thread on follow-ups</li>
                  <li>Re-indexes the same video for every user</li>
                  <li>Shows citations nobody checked</li>
                </ul>
              </div>
              <div className="bg-black/30 rounded-xl p-6 border border-yellow-300/30">
                <h3 className="text-xl font-semibold text-yellow-300 mb-3">VidBrain</h3>
                <ul className="space-y-2 list-disc list-inside text-white/90">
                  <li>An evidence gate grades every passage and refuses to guess</li>
                  <li>A history-aware rewrite resolves follow-ups before search</li>
                  <li>A single-flight lock indexes each video once and shares it</li>
                  <li>Citations come from retrieved data and snap to real timestamps</li>
                </ul>
              </div>
            </div>

            <p className="text-white/85 text-center mt-8 text-lg max-w-3xl mx-auto">
              <strong>Design principle:</strong> when the video lacks the evidence, the system
              says so or searches the web and labels the answer as web-sourced. It never blends
              a guess into the answer.
            </p>
          </div>
        </section>

        {/* PIPELINE */}
        <section className="mb-16 slide-in-right">
          <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-3 text-center">
              The Self-Correcting LangGraph Pipeline
            </h2>
            <p className="text-white/80 text-center mb-8 text-lg max-w-3xl mx-auto">
              Each box is a graph node, and the validator decides whether local evidence is
              enough. Insufficient evidence routes to web search; a separate summary path
              samples context evenly across the whole video.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {pipeline.map((node, index) => (
                <div
                  key={node.name}
                  className="bg-black/30 rounded-xl p-4 border border-white/10 hover:border-yellow-300/60 transition-colors duration-300"
                >
                  <div className="text-yellow-300 font-mono text-sm mb-1">
                    {index + 1}. {node.name}
                  </div>
                  <div className="text-white/80 text-sm">{node.role}</div>
                </div>
              ))}
            </div>

            <p className="text-white/70 text-center mt-6">
              Every node is traced and timed. Pipeline state is checkpointed, so a failed run
              resumes from the step that failed.
            </p>
          </div>
        </section>

        {/* RETRIEVAL ENGINEERING */}
        <section className="mb-16 slide-in-left">
          <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-3 text-center">
              Accurate Search Without Paying Twice
            </h2>
            <p className="text-white/80 text-center mb-8 text-lg">
              Retrieval and cost engineering behind VidBrain
            </p>
            {renderFeatures(retrievalFeatures)}
          </div>
        </section>

        {/* ANSWER QUALITY */}
        <section className="mb-16 slide-in-right">
          <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-3 text-center">
              Answers You Can Verify
            </h2>
            <p className="text-white/80 text-center mb-8 text-lg">
              How VidBrain stays grounded and honest
            </p>
            {renderFeatures(qualityFeatures)}
          </div>
        </section>

        {/* RELIABILITY */}
        <section className="mb-16 slide-in-left">
          <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-3 text-center">
              Built for the Failures Real Systems Meet
            </h2>
            <p className="text-white/80 text-center mb-8 text-lg">
              Reliability, security, and observability
            </p>
            {renderFeatures(reliabilityFeatures)}
          </div>
        </section>

        {/* USER EXPERIENCE */}
        <section className="mb-16 fade-in">
          <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              A Video Workspace, Not Just a Chat Box
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: "▶️",
                  title: "Clickable Timestamps",
                  description:
                    "Paste a YouTube link, and every answer carries [MM:SS] citations that jump the player to the exact moment."
                },
                {
                  icon: "📝",
                  title: "Whole-Video Summary",
                  description:
                    "A chronological summary anchored to timestamps, with a clickable timeline beside the player."
                },
                {
                  icon: "📈",
                  title: "Live Progress & Plan Limits",
                  description:
                    "The interface shows which pipeline step is running, groups past chats by date, and displays free-plan usage."
                }
              ].map((item) => (
                <div
                  key={item.title}
                  className="text-center group hover:bg-white/10 p-6 rounded-xl transition-all duration-300"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-300 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-white/70 group-hover:text-white/90 transition-colors duration-300">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RESTAURANT AGENT */}
        <section className="mb-16 slide-in-right">
          <div className="bg-gradient-to-r from-green-500/20 to-blue-600/20 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
            <div className="text-center mb-8">
              <div className="text-white/70 mb-2">Also built</div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Enterprise <span className="text-yellow-300 glow-text">Restaurant &amp; Hospitality</span> Agent
              </h2>
              <p className="text-white/85 text-lg max-w-3xl mx-auto">
                The same principle applied to transactions. A state-based agent for autonomous
                ordering and reservations that never guesses prices: it reads live carts and
                totals from the database through secure backend tools, and every order is
                verified by the user before any database write.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-white/85 mb-8">
              {[
                {
                  title: "Human-in-the-Loop",
                  text: "The graph pauses at checkout and room-booking nodes and shows a visual card. Orders are placed only after the user clicks Confirm."
                },
                {
                  title: "Anti-Race-Condition",
                  text: "If the cart changed in another tab during the pause, the live total is recalculated on resume and the transaction is rejected."
                },
                {
                  title: "Secure by Design",
                  text: "Dependency injection keeps raw user IDs away from the model, and authentication is handled entirely by the backend."
                },
                {
                  title: "State Injection",
                  text: "Live cart and reservation snapshots are injected into the system prompt at every turn, so the agent works from truth, not memory."
                },
                {
                  title: "UI Artifacts",
                  text: "Meal images and receipts render as visual cards from backend metadata, without polluting the LLM context window."
                },
                {
                  title: "Live Database Sync",
                  text: "Add an item in chat and the website’s cart icon updates instantly. Tools run one at a time to prevent race conditions."
                }
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-black/30 rounded-xl p-5 border border-white/10 text-left hover:border-yellow-300/50 transition-colors duration-300"
                >
                  <strong className="text-yellow-300">{item.title}</strong>
                  <p className="mt-2 text-white/75">{item.text}</p>
                </div>
              ))}
            </div>

            <p className="text-white/70 text-center mb-6">
              Fail-fast error handling keeps the conversation alive if the database drops, and
              context trimming keeps token costs flat on long chats.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {["LangGraph", "Next.js", "Supabase", "Vercel"].map((t) => (
                <span
                  key={t}
                  className="bg-white/15 text-white px-4 py-2 rounded-full border border-white/20 font-medium"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="flex justify-center">
              <a
                href="https://autonomous-restaurant-agent.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full shadow-2xl hover-lift text-lg font-semibold transition-all duration-300 inline-block backdrop-blur-lg border border-white/20 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105"
              >
                🍽️ Try the Live Demo
              </a>
            </div>
          </div>
        </section>

        {/* SKILLS */}
        <section className="mb-16 slide-in-left">
          <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Technical Expertise
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-yellow-300 mb-4">
                  AI &amp; Agent Engineering
                </h3>
                <div className="space-y-3">
                  {skills.aiStack.map((skill) => (
                    <div
                      key={skill}
                      className="flex items-center text-white/90 group hover:bg-white/5 p-3 rounded-lg transition-all duration-300"
                    >
                      <span className="w-2 h-2 bg-yellow-300 rounded-full mr-3 shrink-0 group-hover:scale-125 transition-transform duration-300"></span>
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-yellow-300 mb-4">
                  Full-Stack &amp; Infrastructure
                </h3>
                <div className="space-y-3">
                  {skills.backendTools.map((tool) => (
                    <div
                      key={tool}
                      className="flex items-center text-white/90 group hover:bg-white/5 p-3 rounded-lg transition-all duration-300"
                    >
                      <span className="w-2 h-2 bg-yellow-300 rounded-full mr-3 shrink-0 group-hover:scale-125 transition-transform duration-300"></span>
                      {tool}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center fade-in">
          <div className="bg-gradient-to-r from-blue-500/30 to-purple-600/30 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-4">
              Have Videos, Courses, or a Training Library to Make Searchable?
            </h2>
            <p className="text-white/80 mb-6 text-lg max-w-2xl mx-auto">
              Message me your use case and I will recommend the right scope. You can also review
              the code and architecture on GitHub.
            </p>
            <a
              href="https://github.com/MurtazaAfzali13?tab=repositories"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-full shadow-2xl hover-lift text-lg font-semibold transition-all duration-300 inline-block backdrop-blur-lg border border-white/20 hover:from-green-600 hover:to-blue-700 transform hover:scale-105"
            >
              View GitHub Repositories
            </a>
          </div>
        </section>
      </div>

      <style jsx>{`
        .glow-text {
          text-shadow: 0 0 10px rgba(255, 255, 0, 0.5),
            0 0 20px rgba(255, 255, 0, 0.3),
            0 0 30px rgba(255, 255, 0, 0.2);
        }
        .hover-lift:hover {
          transform: translateY(-5px);
        }
        .slide-in-left {
          animation: slideInLeft 0.8s ease-out;
        }
        .slide-in-right {
          animation: slideInRight 0.8s ease-out;
        }
        .fade-in {
          animation: fadeIn 1s ease-out;
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .slide-in-left,
          .slide-in-right,
          .fade-in {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
