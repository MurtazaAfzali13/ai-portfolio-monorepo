"use client";

import { MouseEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ImageModalPage() {
  const router = useRouter();

  const close = () => router.back();

  const handleBackgroundClick = (e: MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) close();
  };

  return (
    <div
      onClick={handleBackgroundClick}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative bg-gray-900 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl transform transition-transform duration-300 hover:scale-105"
      >
        <button
          type="button"
          onClick={close}
          className="absolute top-3 left-3 text-white text-2xl hover:text-yellow-400 z-10 bg-black/50 rounded-full w-9 h-9 flex items-center justify-center shadow-md"
        >
          ←
        </button>

        {/* Image container */}
        <div className="p-4">
          <Image
            src="/images/murtazaafzali.png"
            alt="Murtaza Afzali"
            width={400}
            height={400}
            className="rounded-xl object-contain w-full h-auto shadow-lg"
            priority
          />
        </div>
      </div>
    </div>
  );
}