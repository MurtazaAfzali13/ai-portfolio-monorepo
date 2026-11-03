// app/page.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import Technologies from "@/components/Technologies";
import DownloadCV from "@/components/DownloadCV";
import CVModal from "@/components/CVModal";

const SpaceBackground = dynamic(
  () => import("@/components/SpaceBackground"),
  { ssr: false }
);

interface Stat {
  value: string;
  label: string;
}

interface Flagship {
  icon: string;
  name: string;
  tagline: string;
  points: string[];
  stack: string[];
}

const pipeline: string[] = [
  "contextualize",
  "supervisor",
  "retriever",
  "reranker",
  "expander",
  "validator",
  "generator"
];

const stats: Stat[] = [
  { value: "8", label: "Graph nodes in VidBrain’s self-correcting pipeline" },
  { value: "2", label: "Production-grade agent systems: video and hospitality" },
  { value: "1×", label: "Each video is indexed once and shared, never embedded twice" }
];

const flagships: Flagship[] = [
  {
    icon: "🎬",
    name: "VidBrain",
    tagline: "Chat with any video. Grounded, timestamped answers.",
    points: [
      "Small-to-Big retrieval: precise micro-chunks, rich parent context",
      "Evidence gate that refuses to guess, with a labeled web fallback",
      "Verified timestamps that snap to real transcript markers",
      "Single-flight indexing with a Postgres lock"
    ],
    stack: ["LangGraph", "FastAPI", "Next.js", "Pinecone", "Supabase", "Tavily"]
  },
  {
    icon: "🍽️",
    name: "Restaurant & Hospitality Agent",
    tagline: "Autonomous ordering and bookings you can trust.",
    points: [
      "Prices read live from the database, never guessed",
      "Human-in-the-Loop checkout: nothing is placed until the user confirms",
      "Anti-race-condition guard re-checks the live cart total",
      "Cart icon on the website updates instantly from chat"
    ],
    stack: ["LangGraph", "Next.js", "Supabase", "Vercel"]
  }
];

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center relative overflow-hidden pt-20">
      <SpaceBackground />

      <div className="relative z-10 w-full">
        {/* HERO */}
        <section className="fade-in mb-16 px-4">
          <div className="mb-8 flex flex-col items-center">
            <div className="w-60 h-60 mb-6 rounded-full overflow-hidden border-4 border-yellow-300 shadow-2xl backdrop-blur-lg bg-white/20 avatar-glow">
              <Link href="/image">
                <Image
                  src="/images/murtazaafzali.png"
                  alt="Murtaza Afzali - AI & Full-Stack Engineer"
                  className="w-full h-full object-cover"
                  width={200}
                  height={200}
                  priority
                />
              </Link>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold mb-6 text-white text-center drop-shadow-2xl">
              Hi, I am{" "}
              <span className="text-yellow-300 glow-text">Murtaza Afzali</span>
            </h1>

            <div className="text-2xl md:text-3xl text-white/95 mb-4 slide-in-left text-center">
              <span className="pulse-slow font-semibold drop-shadow-lg">
                Full-Stack AI Engineer · Multi-Agent RAG Systems
              </span>
            </div>

            <p className="text-xl text-white/85 max-w-2xl mx-auto slide-in-right text-center backdrop-blur-lg bg-black/40 p-6 rounded-2xl border border-white/20 shadow-2xl">
              I build AI that refuses to guess. My systems grade their own evidence, cite
              verifiable sources, and pause for human approval before anything high-stakes
              happens. Built with LangGraph, FastAPI, Next.js, Pinecone, and Supabase.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center fade-in">
            <Link
              href="/projects"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full shadow-2xl hover-lift text-lg font-semibold transition-all duration-300 backdrop-blur-lg border border-white/20 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105"
            >
              View Projects
            </Link>

            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-4 rounded-full hover:bg-white hover:text-gray-900 transition-all duration-300 text-lg font-semibold backdrop-blur-lg bg-black/40 hover:bg-white/90 transform hover:scale-105 cursor-pointer"
            >
              Build an Agent
            </Link>
          </div>
        </section>

        {/* LIVE-STYLE ANSWER CARD */}
        <section className="w-full max-w-4xl mx-auto mb-16 px-4 slide-in-left">
          <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-6 md:p-8 text-left">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-white">How VidBrain answers</h2>
              <span className="text-xs text-white/50">Illustrative example</span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="bg-blue-500/30 border border-blue-300/30 text-white rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%]">
                  What does the speaker say about the first step?
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-white/10 border border-white/20 text-white/90 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]">
                  <p className="mb-3">
                    The answer is built only from retrieved transcript passages, with citations
                    you can click to jump the player.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-yellow-300 text-gray-900 text-sm font-semibold px-3 py-1 rounded-full">
                      [04:32]
                    </span>
                    <span className="bg-yellow-300 text-gray-900 text-sm font-semibold px-3 py-1 rounded-full">
                      [11:08]
                    </span>
                    <span className="bg-green-500/25 text-green-200 text-sm px-3 py-1 rounded-full border border-green-300/30">
                      Evidence verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-white/10 border border-purple-300/30 text-white/90 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]">
                  <p className="mb-2 text-white/80">
                    When the video has no evidence, the answer is clearly marked instead of
                    blended in:
                  </p>
                  <span className="bg-purple-500/30 text-purple-200 text-sm px-3 py-1 rounded-full border border-purple-300/40">
                    🌐 Web-sourced answer
                  </span>
                </div>
              </div>
            </div>

            {/* Pipeline strip */}
            <div className="mt-8 pt-6 border-t border-white/15">
              <div className="text-white/70 text-sm mb-3">LangGraph pipeline behind every answer</div>
              <div className="flex flex-wrap items-center gap-2">
                {pipeline.map((node, index) => (
                  <div key={node} className="flex items-center gap-2">
                    <span
                      className={`font-mono text-sm px-3 py-1 rounded-lg border ${
                        node === "validator"
                          ? "bg-yellow-300/20 border-yellow-300/60 text-yellow-200"
                          : "bg-white/10 border-white/15 text-white/85"
                      }`}
                    >
                      {node}
                    </span>
                    {index < pipeline.length - 1 && <span className="text-white/40">→</span>}
                  </div>
                ))}
              </div>
              <p className="text-white/60 text-sm mt-3">
                The validator decides: sufficient evidence goes to the generator, insufficient
                evidence goes to a labeled web search.
              </p>
            </div>
          </div>
        </section>

        {/* TECHNOLOGIES */}
        <div className="mb-10">
          <Technologies />
        </div>

        {/* STATS */}
        <section className="w-full max-w-4xl mx-auto mb-16 fade-in px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white/20 backdrop-blur-lg rounded-xl p-6 text-center hover-lift border border-white/20 shadow-xl transition-all duration-300 hover:bg-white/25"
              >
                <div className="text-5xl font-bold text-yellow-300 mb-2 drop-shadow-lg">
                  {stat.value}
                </div>
                <div className="text-white font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FLAGSHIP PROJECTS */}
        <section className="w-full max-w-6xl mx-auto mb-16 px-4 slide-in-right">
          <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-2xl">
            Systems I Have Built
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Two production-grade agent architectures, designed around one rule: never present a guess
            as a fact.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {flagships.map((project) => (
              <div
                key={project.name}
                className="text-left bg-white/20 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl hover-lift transition-all duration-300 hover:bg-white/25"
              >
                <div className="text-5xl mb-4">{project.icon}</div>
                <h3 className="text-2xl font-bold text-yellow-300 mb-1">{project.name}</h3>
                <p className="text-white/85 mb-4">{project.tagline}</p>

                <ul className="space-y-2 mb-6 text-white/85">
                  {project.points.map((point) => (
                    <li key={point} className="flex items-start">
                      <span className="w-2 h-2 bg-yellow-300 rounded-full mt-2 mr-3 shrink-0"></span>
                      {point}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-2">
                  {project.stack.map((tech) => (
                    <span
                      key={tech}
                      className="bg-black/30 text-white/90 text-sm px-3 py-1 rounded-full border border-white/15"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="flex flex-col items-center text-center fade-in px-4">
          <h3 className="text-2xl font-bold text-white mb-4 backdrop-blur-lg bg-black/40 p-4 rounded-2xl border border-white/20 shadow-2xl">
            Have Videos, Courses, or a Business That Needs a Trustworthy AI?
          </h3>
          <p className="text-white/80 mb-6 backdrop-blur-lg bg-black/40 p-3 rounded-xl border border-white/20 max-w-2xl">
            Message me your use case and I will recommend the right scope: grounded video search,
            or an ordering and reservations agent with human approval built in.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Link
              href="/contact"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full shadow-2xl hover-lift text-lg font-semibold transition-all duration-300 backdrop-blur-lg border border-white/20 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105"
            >
              Start a Project
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-full shadow-2xl hover-lift text-lg font-semibold transition-all duration-300 backdrop-blur-lg border border-white/20 hover:from-green-600 hover:to-blue-700 transform hover:scale-105"
            >
              📄 View Resume
            </button>
          </div>
        </section>

        <div className="m-4 cursor-pointer">
          <DownloadCV />
        </div>
      </div>

      <CVModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <style jsx>{`
        .glow-text {
          text-shadow: 0 0 10px rgba(255, 255, 0, 0.5),
            0 0 20px rgba(255, 255, 0, 0.3), 0 0 30px rgba(255, 255, 0, 0.2);
        }
        .avatar-glow {
          box-shadow: 0 0 40px rgba(253, 224, 71, 0.35);
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
