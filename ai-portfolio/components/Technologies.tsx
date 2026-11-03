"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Technology {
  name: string;
  icon: string;
  color: string;
  level: number;
}

const technologies: Technology[] = [
  { name: "React", icon: "⚛️", color: "#61DAFB", level: 90 },
  { name: "Next.js", icon: "▲", color: "#000000", level: 85 },
  { name: "TypeScript", icon: "🔷", color: "#3178C6", level: 80 },
  { name: "Tailwind CSS", icon: "🎨", color: "#06B6D4", level: 95 },
  { name: "FastAPI", icon: "🚀", color: "#009688", level: 75 },
  { name: "LangChain", icon: "⛓️", color: "#1C3D5A", level: 72 },
  { name: "LangGraph", icon: "🕸️", color: "#6366F1", level: 70 },
  { name: "Supabase", icon: "🗄️", color: "#3ECF8E", level: 78 },
];

const SCROLL_SPEED = 1.2;
const PROGRESS_INCREMENT = 2;
const PROGRESS_INTERVAL_MS = 20;

export default function Technologies() {
  const trackRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const positionRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const step = () => {
      positionRef.current -= SCROLL_SPEED;
      track.style.transform = `translateX(${positionRef.current}px)`;

      if (Math.abs(positionRef.current) >= track.scrollWidth / 2) {
        positionRef.current = 0;
      }

      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <TooltipProvider delayDuration={100}>
      <section className="w-full max-w-6xl mx-auto px-4 py-8">
        <div
          ref={trackRef}
          className="flex gap-10 items-center px-6"
          style={{ whiteSpace: "nowrap", willChange: "transform" }}
        >
          {technologies.map((tech, idx) => (
            <TechCard key={idx} tech={tech} />
          ))}
          {/* دوباره تکرار برای افکت بی‌نهایت */}
          {technologies.map((tech, idx) => (
            <TechCard key={`duplicate-${idx}`} tech={tech} />
          ))}
        </div>
      </section>
    </TooltipProvider>
  );
}

interface TechCardProps {
  tech: Technology;
}

function TechCard({ tech }: TechCardProps) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = useCallback(() => {
    if (intervalRef.current) return;

    setProgress(0);
    let current = 0;

    intervalRef.current = setInterval(() => {
      current += PROGRESS_INCREMENT;
      if (current >= tech.level) {
        current = tech.level;
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setProgress(current);
    }, PROGRESS_INTERVAL_MS);
  }, [tech.level]);

  const stopProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setProgress(0);
  }, []);

  return (
    <Tooltip onOpenChange={(open) => open ? startProgress() : stopProgress()}>
      <TooltipTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className="flex-shrink-0 flex flex-col items-center justify-center 
          w-32 h-32 md:w-40 md:h-40
          bg-white/10 backdrop-blur-xl  
          rounded-3xl border border-white/20 shadow-xl 
          p-4 cursor-pointer transition-all duration-500
          hover:scale-110 hover:border-white/50 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]
          focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          <div
            className="text-5xl mb-3 transition-all duration-500"
            style={{
              filter: `drop-shadow(0 5px 15px ${tech.color}80)`,
            }}
          >
            {tech.icon}
          </div>
          <p className="text-white font-bold text-lg">{tech.name}</p>
        </div>
      </TooltipTrigger>

      <TooltipContent
        side="top"
        className="bg-black/80 text-white border border-white/20 rounded-xl p-4 shadow-xl backdrop-blur-xl w-44"
      >
        <p className="text-sm font-semibold mb-2">
          مهارت: {progress}%
        </p>

        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-100"
            style={{
              width: `${progress}%`,
              boxShadow: "0 0 8px #22c55e",
            }}
          />
        </div>
      </TooltipContent>
    </Tooltip>
  );
}