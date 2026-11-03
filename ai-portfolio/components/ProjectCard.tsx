"use client";
// last update
import Image from "next/image";
import { useState } from "react";

interface ProjectCardProps {
  title: string;
  desc?: string;
  tech?: string[];
  liveUrl?: string;
  githubUrl?: string;
  image?: string;
}

export default function ProjectCard({ 
  title, 
  desc = "", 
  tech = [],  
  liveUrl, 
  githubUrl, 
  image 
}: ProjectCardProps) {
  const [showText, setShowText] = useState<boolean>(false);

  // اطمینان از اینکه desc همیشه یک string است
  const description = desc || "";

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover-lift group overflow-hidden">
      {/* 🔹 بخش تصویر یا iframe */}
      <div className="mb-4 w-full h-48 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg overflow-hidden flex items-center justify-center">
        {/* اگر لینک زنده وجود دارد، iframe نمایش بده */}
        {liveUrl && liveUrl !== "#" ? (
          <iframe
            src={liveUrl}
            title={title}
            loading="lazy"
            className="w-full h-full border-none rounded-lg"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          ></iframe>
        ) : (
          <>
            {typeof image === "string" && image.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <Image
                src={image}
                alt={title}
                width={400}
                height={192}
                className="w-full h-full object-cover rounded-lg transform group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <span className="text-6xl opacity-70">{image}</span>
            )}
          </>
        )}
      </div>

      {/* 🔹 عنوان پروژه */}
      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-yellow-300 transition-colors">
        {title || "بدون عنوان"}
      </h3>

      {/* 🔹 توضیحات با دکمه بیشتر/کمتر */}
      {description && (
        <div className="text-white/80 leading-relaxed mb-4">
          <span>
            {showText || description.length <= 200 ? description : `${description.slice(0, 150)}...`}
          </span>
          {description.length > 200 && (
            <button
              onClick={() => setShowText(prev => !prev)}
              className="ml-2 text-yellow-300 font-semibold hover:underline"
            >
              {showText ? "less" : "more"}
            </button>
          )}
        </div>
      )}

      {/* 🔹 تکنولوژی‌ها */}
      {tech && tech.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {tech.map((technology, index) => (
              <span
                key={index}
                className="bg-yellow-300/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-medium"
              >
                {technology}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 🔹 لینک‌ها */}
      <div className="flex gap-3">
        {liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-center font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
          >
            Live Demo
          </a>
        )}
        {githubUrl && (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 border-2 border-white/30 text-white px-4 py-2 rounded-lg text-center font-semibold hover:bg-white/10 transition-all duration-300"
          >
            GitHub
          </a>
        )}
      </div>
    </div>
  );
}