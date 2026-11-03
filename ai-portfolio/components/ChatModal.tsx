// components/ChatModal.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const Chat = dynamic(() => import("@/components/Chat"), { ssr: false });

export default function ChatModal() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [teaserDismissed, setTeaserDismissed] = useState(false);

  const closeChat = useCallback(() => setIsChatOpen(false), []);

  // Show a small teaser bubble a few seconds after the page loads
  useEffect(() => {
    if (teaserDismissed || isChatOpen) return;
    const timer = setTimeout(() => setShowTeaser(true), 4000);
    return () => clearTimeout(timer);
  }, [teaserDismissed, isChatOpen]);

  // Close on Escape and lock page scroll while the dialog is open
  useEffect(() => {
    if (!isChatOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isChatOpen, closeChat]);

  const openChat = () => {
    setShowTeaser(false);
    setTeaserDismissed(true);
    setIsChatOpen(true);
  };

  return (
    <>
      {/* Launcher */}
      {!isChatOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          {/* Teaser bubble */}
          {showTeaser && (
            <div className="relative max-w-[260px] bg-gray-900/90 backdrop-blur-lg text-white rounded-2xl rounded-br-sm border border-white/20 shadow-2xl px-4 py-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <button
                type="button"
                onClick={() => {
                  setShowTeaser(false);
                  setTeaserDismissed(true);
                }}
                aria-label="Dismiss message"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 text-white/80 text-xs border border-white/20 transition-colors"
              >
                ✕
              </button>
              <p className="text-sm leading-snug">
                Questions about <span className="text-yellow-300 font-semibold">VidBrain</span> or
                the <span className="text-yellow-300 font-semibold">Restaurant Agent</span>? Ask
                away.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={openChat}
            aria-label="Open AI assistant chat"
            className="relative group cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 rounded-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white pl-4 pr-6 py-3 rounded-2xl shadow-2xl border border-white/20 transition-all duration-300 transform group-hover:scale-105 group-active:scale-95">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-2xl">
                  <span aria-hidden="true">🤖</span>
                  <span className="absolute -top-0.5 -right-0.5 flex w-3.5 h-3.5">
                    <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full w-3.5 h-3.5 bg-green-400 border-2 border-blue-700"></span>
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-base leading-tight">AI Assistant</div>
                  <div className="text-xs opacity-90 whitespace-nowrap">
                    Ask about my projects ✨
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Modal */}
      {isChatOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="AI Assistant chat"
          onClick={closeChat}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:pr-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md h-[92vh] sm:h-[90vh] max-h-[750px] rounded-t-2xl sm:rounded-xl shadow-2xl animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-t-2xl sm:rounded-xl opacity-75 blur"></div>
            <div className="absolute inset-[2px] bg-gray-800 rounded-t-2xl sm:rounded-xl"></div>
            <div className="relative h-full">
              <Chat onClose={closeChat} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
