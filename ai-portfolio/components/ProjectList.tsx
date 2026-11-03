// app/components/ProjectsList.tsx
"use client";
import { useState, useEffect } from "react";
import ProjectCard from "@/components/ProjectCard";
import HeroSkeleton from "@/components/skeletons/HeroSkeleton";
import ProjectCardSkeleton from "@/components/skeletons/ProjectCardSkeleton";
import FeaturedProjectSkeleton from "@/components/skeletons/FeaturedProjectSkeleton";

interface Project {
  id?: string;
  title: string;
  desc: string;
  tech: string[];
  image: string;
  liveUrl: string;
  githubUrl: string;
  createdAt?: string;
}

interface Technology {
  name: string;
  icon: string;
}

interface PipelineNode {
  name: string;
  role: string;
}

interface Highlight {
  icon: string;
  title: string;
  description: string;
}

const pipeline: PipelineNode[] = [
  { name: "contextualize", role: "Rewrites follow-ups into standalone questions" },
  { name: "supervisor", role: "Routes to Q&A or summary, respects search scope" },
  { name: "retriever", role: "Pinecone micro-chunks, namespaced per user" },
  { name: "reranker", role: "Cross-encoder with automatic LLM-scorer fallback" },
  { name: "expander", role: "Fetches parent passages, stitches neighbors" },
  { name: "validator", role: "Strict relevance grading, fails closed" },
  { name: "web_search", role: "Live Tavily fallback, flagged as web-sourced" },
  { name: "generator", role: "Grounded answer, then Self-RAG graders" }
];

const vidbrainHighlights: Highlight[] = [
  {
    icon: "🔒",
    title: "Single-Flight Indexing",
    description:
      "A Postgres lock (claim_video) lets only the first request index a video. Concurrent requests wait without blocking and reuse the same vectors."
  },
  {
    icon: "⏱️",
    title: "Verified Timestamps",
    description:
      "Citations are built from retrieved data, never from IDs the model claims. Drifting timestamps snap to the nearest real transcript marker."
  },
  {
    icon: "📡",
    title: "SSE Streaming",
    description:
      "Answers stream progressively to Next.js over Server-Sent Events, with live pipeline progress and the Nginx buffering bypass."
  },
  {
    icon: "📊",
    title: "Observability",
    description:
      "Every node is traced and timed. Per-node timings and success rates feed a role-based dashboard on a Supabase traces table."
  }
];

const restaurantHighlights: Highlight[] = [
  {
    icon: "💰",
    title: "Zero Price Hallucination",
    description:
      "Prices are never guessed. The agent reads live cart items and totals through secure backend tools."
  },
  {
    icon: "✋",
    title: "Human-in-the-Loop",
    description:
      "Checkout and room-booking nodes interrupt the graph and show a visual card. Nothing is placed until the user clicks Confirm."
  },
  {
    icon: "⚖️",
    title: "Anti-Race-Condition",
    description:
      "If the cart changed in another tab during the pause, the live total is recalculated on resume and the transaction is rejected."
  },
  {
    icon: "🪟",
    title: "UI Artifacts",
    description:
      "The backend sends rich metadata (meal images, receipts) alongside text, so cards render without polluting the LLM context."
  },
  {
    icon: "🔐",
    title: "Dependency Injection",
    description:
      "The AI never sees or handles raw user IDs. Authentication is handled entirely by the backend framework."
  },
  {
    icon: "🛟",
    title: "Fail-Fast Errors",
    description:
      "If the database drops, tools return a graceful error string and the agent apologizes without losing conversation state."
  }
];

const restaurantFlow: string[] = ["User input", "Agent brain", "Tool execution", "HITL pause", "Confirm → DB write"];

const technologies: Technology[] = [
  { name: "LangGraph", icon: "🕸️" },
  { name: "FastAPI", icon: "⚡" },
  { name: "Next.js", icon: "▲" },
  { name: "Pinecone", icon: "🌲" },
  { name: "Supabase", icon: "🗄️" },
  { name: "Tavily", icon: "🌐" },
  { name: "Small-to-Big RAG", icon: "🔍" },
  { name: "Self-RAG", icon: "✅" },
  { name: "HITL Gating", icon: "✋" },
  { name: "SSE Streaming", icon: "📡" },
  { name: "Checkpointing", icon: "♻️" },
  { name: "Docker", icon: "🐳" }
];

function findProject(projects: Project[], keywords: string[]): Project | undefined {
  return projects.find((p) =>
    keywords.some((k) => p.title?.toLowerCase().includes(k))
  );
}

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchProjects(): Promise<void> {
      try {
        const res = await fetch("/api/projects");
        const data: Project[] = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  // Links come from your own /api/projects data when a matching title exists.
  const vidbrain = findProject(projects, ["vidbrain"]);
  const restaurant = findProject(projects, ["restaurant", "ariana", "hospitality"]);

  if (loading) {
    return (
      <div className="relative z-10 w-full">
        <HeroSkeleton />

        <section className="max-w-7xl mx-auto px-4 mb-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        </section>

        <FeaturedProjectSkeleton />
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full">
      {/* HERO */}
      <section className="fade-in mb-16 px-4">
        <div className="mb-8 flex flex-col items-center">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 text-white text-center drop-shadow-2xl">
            Intelligent <span className="text-yellow-300 glow-text">Systems</span>
          </h1>

          <div className="text-2xl md:text-3xl text-white/95 mb-4 slide-in-left text-center">
            <span className="pulse-slow font-semibold drop-shadow-lg">
              Multi-Agent RAG & Transactional AI Agents
            </span>
          </div>

          <p className="text-xl text-white/85 max-w-3xl mx-auto slide-in-right text-center backdrop-blur-lg bg-black/40 p-6 rounded-2xl border border-white/20 shadow-2xl">
            Production-grade systems built on one rule: never present a guess as a fact. VidBrain
            grades its own evidence before answering, and the Restaurant Agent pauses for human
            approval before touching your database.
          </p>
        </div>
      </section>

      {/* VIDBRAIN SPOTLIGHT */}
      <section className="max-w-6xl mx-auto px-4 mb-16 slide-in-left">
        <div className="bg-gradient-to-r from-blue-500/30 to-purple-600/30 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-white/70 mb-2">Flagship project</div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">
              <span className="text-yellow-300 glow-text">VidBrain</span>
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              AI video intelligence with a self-correcting, multi-agent RAG pipeline. Chat with any
              video, get timestamped, grounded answers, and search the web only when the video
              itself cannot answer.
            </p>
          </div>

          {/* Pipeline */}
          <h3 className="text-2xl font-semibold text-white mb-4 text-center">
            The LangGraph pipeline
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 text-left">
            {pipeline.map((node, index) => (
              <div
                key={node.name}
                className={`rounded-xl p-4 border transition-colors duration-300 ${
                  node.name === "validator"
                    ? "bg-yellow-300/10 border-yellow-300/60"
                    : "bg-black/30 border-white/10 hover:border-white/30"
                }`}
              >
                <div className="text-yellow-300 font-mono text-sm mb-1">
                  {index + 1}. {node.name}
                </div>
                <div className="text-white/80 text-sm">{node.role}</div>
              </div>
            ))}
          </div>

          {/* Small-to-Big */}
          <div className="bg-black/30 rounded-xl p-6 border border-white/10 mb-10 text-left">
            <h3 className="text-2xl font-semibold text-yellow-300 mb-2">Small-to-Big retrieval</h3>
            <p className="text-white/85 mb-5">
              Small chunks are embedded for precise search. The larger parent passage lives in
              Supabase and is fetched after the hit, so the model reads rich context while search
              stays accurate.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {[
                "Question",
                "Pinecone micro-chunk match",
                "Parent passage from Supabase",
                "Neighbors stitched at boundaries",
                "Rich context to the model"
              ].map((step, index, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="bg-white/10 border border-white/15 text-white/90 px-3 py-1 rounded-lg">
                    {step}
                  </span>
                  {index < arr.length - 1 && <span className="text-white/40">→</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Highlights */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {vidbrainHighlights.map((item) => (
              <div
                key={item.title}
                className="group bg-black/20 hover:bg-white/10 p-6 rounded-xl border border-white/10 transition-all duration-300 text-left"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300 inline-block">
                  {item.icon}
                </div>
                <h4 className="text-lg font-semibold text-white mb-1 group-hover:text-yellow-300 transition-colors duration-300">
                  {item.title}
                </h4>
                <p className="text-white/75">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {["LangGraph", "FastAPI", "Next.js", "Pinecone", "Supabase", "Tavily"].map((t) => (
              <span
                key={t}
                className="bg-yellow-300/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-medium"
              >
                {t}
              </span>
            ))}
          </div>

          {(vidbrain?.liveUrl || vidbrain?.githubUrl) && (
            <div className="flex flex-wrap justify-center gap-4">
              {vidbrain.liveUrl && (
                <a
                  href={vidbrain.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 backdrop-blur-lg border border-white/20 shadow-2xl hover-lift"
                >
                  Live Demo
                </a>
              )}
              {vidbrain.githubUrl && (
                <a
                  href={vidbrain.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-white/30 text-white px-6 py-3 rounded-full font-semibold hover:bg-white/10 transition-all duration-300 backdrop-blur-lg hover-lift"
                >
                  View Code
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* RESTAURANT AGENT SPOTLIGHT */}
      <section className="max-w-6xl mx-auto px-4 mb-16 slide-in-right">
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-white/70 mb-2">Transactional AI agent</div>
            <h2 className="text-4xl font-bold text-white mb-3">
              Enterprise <span className="text-yellow-300 glow-text">Restaurant &amp; Hospitality</span> Agent
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              A state-based agent for autonomous ordering and reservations. Unlike a standard
              chatbot that hallucinates menu items or fails at checkout, it is deterministic:
              orders and payments are verified by the user before any database write.
            </p>
          </div>

          <div className="bg-black/30 rounded-xl p-6 border border-white/10 mb-8">
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              {restaurantFlow.map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-lg border ${
                      step === "HITL pause"
                        ? "bg-yellow-300/20 border-yellow-300/60 text-yellow-200"
                        : "bg-white/10 border-white/15 text-white/90"
                    }`}
                  >
                    {step}
                  </span>
                  {index < restaurantFlow.length - 1 && <span className="text-white/40">→</span>}
                </div>
              ))}
            </div>
            <p className="text-white/70 text-center text-sm mt-4">
              Tools run one at a time to prevent race conditions, and live database context is
              injected into the system prompt at every turn.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {restaurantHighlights.map((item) => (
              <div
                key={item.title}
                className="group hover:bg-white/10 p-6 rounded-xl border border-white/10 transition-all duration-300 text-left"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300 inline-block">
                  {item.icon}
                </div>
                <h4 className="text-lg font-semibold text-white mb-1 group-hover:text-yellow-300 transition-colors duration-300">
                  {item.title}
                </h4>
                <p className="text-white/75">{item.description}</p>
              </div>
            ))}
          </div>

          {(restaurant?.liveUrl || restaurant?.githubUrl) && (
            <div className="flex flex-wrap justify-center gap-4">
              {restaurant.liveUrl && (
                <a
                  href={restaurant.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 backdrop-blur-lg border border-white/20 shadow-2xl hover-lift"
                >
                  Live Demo
                </a>
              )}
              {restaurant.githubUrl && (
                <a
                  href={restaurant.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-white/30 text-white px-6 py-3 rounded-full font-semibold hover:bg-white/10 transition-all duration-300 backdrop-blur-lg hover-lift"
                >
                  View Code
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ALL PROJECTS GRID (from /api/projects) */}
      {projects.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center drop-shadow-2xl">
            All Projects
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <div
                key={project.id ?? index}
                className="fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ProjectCard
                  title={project.title}
                  desc={project.desc}
                  tech={project.tech}
                  image={project.image}
                  liveUrl={project.liveUrl}
                  githubUrl={project.githubUrl}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* STACK */}
      <section className="max-w-6xl mx-auto px-4 mb-16 slide-in-left">
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Agent &amp; Platform Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {technologies.map((tech) => (
              <div
                key={tech.name}
                className="text-center p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300 group hover-lift border border-white/10"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  {tech.icon}
                </div>
                <div className="text-white text-sm font-medium group-hover:text-yellow-300 transition-colors duration-300">
                  {tech.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center fade-in px-4">
        <div className="bg-gradient-to-r from-green-500/30 to-blue-600/30 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-4">
            Want a System Like This on Your Data?
          </h2>
          <p className="text-white/80 mb-6 text-lg max-w-2xl mx-auto">
            Searchable videos and courses with verified citations, or an ordering and reservations
            agent with human approval built in. Tell me your use case and I will recommend the
            right scope.
          </p>
          <a
            href="/contact"
            className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-full shadow-2xl hover-lift text-lg font-semibold transition-all duration-300 inline-block backdrop-blur-lg border border-white/20 hover:from-green-600 hover:to-blue-700 transform hover:scale-105"
          >
            Start an AI Project
          </a>
        </div>
      </section>

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
