// components/CVModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Download, ExternalLink, FileText, Loader2, X } from "lucide-react";

interface CVModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// The file lives in /public, so it is served from the site root.
const PDF_URL = "/Murtaza_Afzali_Resume.pdf";
const PDF_PREVIEW_URL = `${PDF_URL}#toolbar=0&navpanes=0&view=FitH`;
const DOWNLOAD_NAME = "Murtaza_Afzali_CV.pdf";

function CVDialog({ onClose }: { onClose: () => void }) {
  const reduce = useReducedMotion() ?? false;
  const [loaded, setLoaded] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Escape to close, Tab stays inside the dialog, scroll lock, and focus is restored on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 60);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      const root = dialogRef.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center sm:items-center sm:p-6">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(109,40,217,0.35),rgba(3,3,15,0.88)_70%)] backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-modal-title"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 48, scale: 0.96 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="relative h-[94vh] w-full max-w-5xl rounded-t-3xl bg-gradient-to-br from-yellow-300/60 via-violet-500/40 to-cyan-400/50 p-px shadow-[0_30px_120px_-20px_rgba(124,58,237,0.6)] sm:h-[90vh] sm:rounded-3xl"
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-t-[23px] bg-[#070A16] sm:rounded-[23px]">
          {/* ambient glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="cv-float absolute -left-24 -top-24 size-80 rounded-full bg-violet-600/25 blur-[90px]" />
            <div
              className="cv-float absolute -bottom-28 -right-20 size-80 rounded-full bg-cyan-500/15 blur-[100px]"
              style={{ animationDelay: "-7s" }}
            />
          </div>

          {/* Header */}
          <div className="relative z-10 flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.08] bg-black/30 px-5 py-4 backdrop-blur-xl sm:px-7">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="cv-badge relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-300 via-amber-300 to-orange-400 text-gray-900">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0">
                <h2
                  id="cv-modal-title"
                  className="truncate text-lg font-bold tracking-tight text-white sm:text-xl"
                >
                  Murtaza Afzali
                </h2>
                <p className="truncate text-[12px] font-medium text-slate-400 sm:text-[13px]">
                  Resume · Full-Stack AI Engineer
                </p>
              </div>
            </div>

            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close resume"
              className="group flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition-all duration-300 hover:border-yellow-300/50 hover:bg-white/10 hover:text-white hover:shadow-[0_0_20px_rgba(253,224,71,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/80"
            >
              <X className="size-5 transition-transform duration-300 group-hover:rotate-90" />
            </button>
          </div>

          {/* Viewer */}
          <div className="relative z-10 min-h-0 flex-1 p-3 sm:p-5">
            {/* Desktop and tablet: inline PDF preview */}
            <div className="relative hidden h-full overflow-hidden rounded-2xl bg-white p-1.5 shadow-2xl shadow-black/60 ring-1 ring-white/20 md:block">
              {!loaded && (
                <div className="cv-skeleton absolute inset-1.5 z-10 flex flex-col items-center justify-center gap-3 rounded-xl text-slate-500">
                  <Loader2 className="size-6 animate-spin motion-reduce:animate-none" />
                  <span className="text-sm font-medium">Loading resume...</span>
                </div>
              )}
              <iframe
                src={PDF_PREVIEW_URL}
                title="Murtaza Afzali resume preview"
                onLoad={() => setLoaded(true)}
                className={`h-full w-full rounded-xl transition-opacity duration-500 ${
                  loaded ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>

            {/* Phones: mobile browsers cannot scroll PDFs inside an iframe, so offer a clean card instead */}
            <div className="flex h-full flex-col items-center justify-center gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center md:hidden">
              <div className="cv-badge flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-300 to-orange-400 text-gray-900">
                <FileText className="size-9" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Murtaza Afzali, Resume</p>
                <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-slate-400">
                  Phone browsers can’t preview PDFs inside a page. Open it in your viewer or save a
                  copy.
                </p>
              </div>
              <a
                href={PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white transition-all hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/80"
              >
                <ExternalLink className="size-4" />
                Open PDF
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="relative z-10 flex shrink-0 flex-col-reverse items-stretch justify-between gap-3 border-t border-white/[0.08] bg-black/30 px-5 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:px-7">
            <p className="hidden text-[12px] text-slate-500 sm:block">
              Press{" "}
              <kbd className="rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">
                Esc
              </kbd>{" "}
              to close
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/80 md:inline-flex"
              >
                <ExternalLink className="size-4" />
                Open in new tab
              </a>

              <a
                href={PDF_URL}
                download={DOWNLOAD_NAME}
                className="cv-download group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-green-500 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-900/40 transition-all duration-300 hover:-translate-y-0.5 hover:from-green-400 hover:to-blue-500 hover:shadow-[0_10px_34px_-6px_rgba(34,197,94,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/80"
              >
                <span
                  aria-hidden="true"
                  className="cv-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                />
                <Download className="relative size-4 transition-transform duration-300 group-hover:translate-y-0.5" />
                <span className="relative">Download CV (PDF)</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/20 px-5 py-3 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/80 sm:hidden"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes cvFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(22px, -16px, 0) scale(1.08);
          }
        }
        @keyframes cvBadge {
          0%,
          100% {
            box-shadow: 0 0 16px rgba(253, 224, 71, 0.35);
          }
          50% {
            box-shadow: 0 0 28px rgba(253, 224, 71, 0.65);
          }
        }
        @keyframes cvShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        @keyframes cvShine {
          0% {
            transform: translateX(-130%) skewX(-20deg);
          }
          100% {
            transform: translateX(420%) skewX(-20deg);
          }
        }
        .cv-float {
          animation: cvFloat 16s ease-in-out infinite;
        }
        .cv-badge {
          animation: cvBadge 2.8s ease-in-out infinite;
        }
        .cv-skeleton {
          background: linear-gradient(100deg, #f1f5f9 30%, #e2e8f0 50%, #f1f5f9 70%);
          background-size: 200% 100%;
          animation: cvShimmer 1.8s linear infinite;
        }
        .cv-download:hover .cv-shine {
          animation: cvShine 0.9s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .cv-float,
          .cv-badge,
          .cv-skeleton,
          .cv-download:hover .cv-shine {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

export default function CVModal({ isOpen, onClose }: CVModalProps) {
  return <AnimatePresence>{isOpen && <CVDialog onClose={onClose} />}</AnimatePresence>;
}
