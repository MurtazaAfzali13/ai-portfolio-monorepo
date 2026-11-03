"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface IndicatorRect {
  left: number;
  width: number;
}

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/about", label: "About", icon: "👤" },
  { href: "/projects", label: "Projects", icon: "🚀" },
  { href: "/contact", label: "Contact", icon: "✉️" }
];

const isRouteActive = (pathname: string, href: string): boolean =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

export default function Header() {
  const pathname = usePathname() ?? "/";

  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const [activeRect, setActiveRect] = useState<IndicatorRect | null>(null);
  const [hoverRect, setHoverRect] = useState<IndicatorRect | null>(null);
  const [hoverVisible, setHoverVisible] = useState<boolean>(false);

  const navRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);

  const activeIndex = navItems.findIndex((item) => isRouteActive(pathname, item.href));

  const measureItem = useCallback((index: number): IndicatorRect | null => {
    const el = linkRefs.current[index];
    if (!el) return null;
    return { left: el.offsetLeft, width: el.offsetWidth };
  }, []);

  /* Scroll state + scroll progress bar (no re-render for the progress itself) */
  useEffect(() => {
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      setIsScrolled(y > 20);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress})`;
      }
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  /* Position the active pill (re-measure on route change, resize, and when fonts load) */
  useEffect(() => {
    let cancelled = false;
    const update = () => {
      if (cancelled) return;
      setActiveRect(activeIndex >= 0 ? measureItem(activeIndex) : null);
    };

    update();
    window.addEventListener("resize", update);
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(update);
    }
    return () => {
      cancelled = true;
      window.removeEventListener("resize", update);
    };
  }, [activeIndex, measureItem]);

  /* Close the mobile menu on route change, Escape, and when growing to desktop width */
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const showHover = (index: number) => {
    const rect = measureItem(index);
    if (!rect) return;
    setHoverRect(rect);
    setHoverVisible(true);
  };

  const hideHover = () => setHoverVisible(false);

  const handleNavMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = navRef.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - box.left}px`);
  };

  return (
    <>
      {/* Backdrop for the mobile menu (kept outside the header so backdrop-filter cannot trap it) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[rgba(8,6,30,0.55)] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
            : "bg-transparent"
        }`}
      >
        <nav
          aria-label="Main"
          className={`container mx-auto flex items-center justify-between px-4 transition-all duration-300 ${
            isScrolled ? "py-2.5" : "py-4"
          }`}
        >
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/80"
            aria-label="Murtaza Afzali, home"
          >
            <span className="logo-pulse relative grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-300 via-amber-300 to-orange-400 text-gray-900 font-extrabold text-lg shadow-[0_0_20px_rgba(253,224,71,0.45)] transition-transform duration-500 ease-out group-hover:rotate-[360deg] group-hover:scale-110 motion-reduce:transition-none">
              M
            </span>
            <span className="leading-tight">
              <span className="block text-lg sm:text-xl font-bold text-white transition-colors duration-300 group-hover:text-yellow-300">
                Murtaza Afzali
              </span>
              <span className="hidden sm:block text-[11px] tracking-[0.2em] uppercase text-white/50 transition-colors duration-300 group-hover:text-white/80">
                AI Engineer
              </span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <div
            ref={navRef}
            onMouseMove={handleNavMouseMove}
            onMouseLeave={hideHover}
            className="relative hidden md:block rounded-full border border-white/15 bg-black/30 backdrop-blur-xl p-1.5 shadow-[0_0_30px_rgba(124,58,237,0.18)]"
          >
            {/* Cursor spotlight */}
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 rounded-full transition-opacity duration-300 ${
                hoverVisible ? "opacity-100" : "opacity-0"
              }`}
              style={{
                background:
                  "radial-gradient(120px circle at var(--mx, 50%) 50%, rgba(253,224,71,0.16), transparent 70%)"
              }}
            />

            {/* Hover pill: glides to whichever item the mouse is over */}
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute top-1.5 bottom-1.5 left-0 rounded-full border border-white/25 bg-gradient-to-r from-blue-500/30 to-purple-500/30 shadow-[0_0_22px_rgba(139,92,246,0.45)] transition-[transform,width,opacity] duration-300 ease-out motion-reduce:transition-none ${
                hoverVisible && hoverRect ? "opacity-100" : "opacity-0"
              }`}
              style={{
                width: hoverRect?.width ?? 0,
                transform: `translateX(${hoverRect?.left ?? 0}px)`
              }}
            />

            {/* Active pill: glowing, with a moving sheen, and slides between pages */}
            <span
              aria-hidden="true"
              className={`active-glow pointer-events-none absolute top-1.5 bottom-1.5 left-0 overflow-hidden rounded-full bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-400 transition-[transform,width,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none ${
                activeRect ? "opacity-100" : "opacity-0"
              }`}
              style={{
                width: activeRect?.width ?? 0,
                transform: `translateX(${activeRect?.left ?? 0}px)`
              }}
            >
              <span className="sheen absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </span>

            <ul className="relative z-10 flex items-center">
              {navItems.map((item, index) => {
                const active = index === activeIndex;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      ref={(el) => {
                        linkRefs.current[index] = el;
                      }}
                      aria-current={active ? "page" : undefined}
                      onMouseEnter={() => showHover(index)}
                      onFocus={() => showHover(index)}
                      onBlur={hideHover}
                      className={`group relative inline-flex items-center gap-2 rounded-full px-5 py-2 text-[15px] font-semibold transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/80 ${
                        active
                          ? "text-gray-900"
                          : "text-white/80 hover:text-white hover:[text-shadow:0_0_14px_rgba(196,181,253,0.9)]"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`inline-block transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-12 group-hover:scale-125 motion-reduce:transition-none ${
                          active ? "scale-110" : ""
                        }`}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            className="relative md:hidden w-11 h-11 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:border-yellow-300/60 hover:shadow-[0_0_18px_rgba(253,224,71,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/80"
          >
            <span
              className={`absolute left-1/2 top-1/2 h-0.5 w-5 -ml-2.5 rounded bg-white transition-all duration-300 ${
                isMobileMenuOpen ? "translate-y-0 rotate-45 bg-yellow-300" : "-translate-y-[7px] rotate-0"
              }`}
            />
            <span
              className={`absolute left-1/2 top-1/2 h-0.5 w-5 -ml-2.5 rounded bg-white transition-all duration-300 ${
                isMobileMenuOpen ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
              }`}
            />
            <span
              className={`absolute left-1/2 top-1/2 h-0.5 w-5 -ml-2.5 rounded bg-white transition-all duration-300 ${
                isMobileMenuOpen ? "translate-y-0 -rotate-45 bg-yellow-300" : "translate-y-[7px] rotate-0"
              }`}
            />
          </button>
        </nav>

        {/* Mobile navigation */}
        <div
          id="mobile-menu"
          className={`md:hidden absolute left-0 right-0 top-full px-3 transition-all duration-300 ${
            isMobileMenuOpen
              ? "visible opacity-100 translate-y-0"
              : "invisible opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <div className="mt-2 rounded-2xl border border-white/15 bg-[rgba(10,6,36,0.85)] backdrop-blur-xl p-2 shadow-2xl">
            <ul className="space-y-1">
              {navItems.map((item, index) => {
                const active = index === activeIndex;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      tabIndex={isMobileMenuOpen ? 0 : -1}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setIsMobileMenuOpen(false)}
                      style={isMobileMenuOpen ? { animationDelay: `${80 + index * 70}ms` } : undefined}
                      className={`${
                        isMobileMenuOpen ? "menu-item-in" : ""
                      } flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/80 ${
                        active
                          ? "bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-400 text-gray-900 shadow-[0_0_20px_rgba(253,224,71,0.4)]"
                          : "text-white/90 hover:bg-white/10 hover:text-white hover:translate-x-1"
                      }`}
                    >
                      <span aria-hidden="true" className="text-xl">
                        {item.icon}
                      </span>
                      {item.label}
                      {active && <span className="ml-auto text-xs font-bold tracking-wider uppercase">Here</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Scroll progress */}
        <div
          aria-hidden="true"
          className={`absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 transition-opacity duration-300 ${
            isScrolled ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            ref={progressRef}
            className="h-full origin-left bg-gradient-to-r from-yellow-300 via-fuchsia-400 to-blue-500 shadow-[0_0_10px_rgba(253,224,71,0.8)] will-change-transform"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </header>

      <style jsx>{`
        @keyframes sheen {
          0% {
            transform: translateX(-120%) skewX(-20deg);
          }
          60%,
          100% {
            transform: translateX(380%) skewX(-20deg);
          }
        }
        @keyframes activeGlow {
          0%,
          100% {
            box-shadow: 0 0 16px rgba(253, 224, 71, 0.4), 0 0 36px rgba(251, 146, 60, 0.18);
          }
          50% {
            box-shadow: 0 0 26px rgba(253, 224, 71, 0.75), 0 0 54px rgba(251, 146, 60, 0.35);
          }
        }
        @keyframes logoPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(253, 224, 71, 0.55);
          }
          70%,
          100% {
            box-shadow: 0 0 0 12px rgba(253, 224, 71, 0);
          }
        }
        @keyframes menuItemIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .sheen {
          animation: sheen 3.6s ease-in-out infinite;
        }
        .active-glow {
          animation: activeGlow 2.6s ease-in-out infinite;
        }
        .logo-pulse {
          animation: logoPulse 2.8s ease-out infinite;
        }
        .menu-item-in {
          animation: menuItemIn 0.4s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .sheen,
          .active-glow,
          .logo-pulse,
          .menu-item-in {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
