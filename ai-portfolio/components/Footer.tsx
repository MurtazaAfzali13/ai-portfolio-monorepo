"use client";

import Link from "next/link";

interface LinkItem {
  href: string;
  label: string;
}

interface SocialItem {
  name: string;
  icon: string;
  url: string;
  external: boolean;
}

interface SystemItem {
  icon: string;
  name: string;
  description: string;
  href: string;
  external: boolean;
  cta: string;
}

const quickLinks: LinkItem[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/contact", label: "Contact" }
];

const systems: SystemItem[] = [
  {
    icon: "🎬",
    name: "VidBrain",
    description: "Self-correcting multi-agent RAG for video, with verified [MM:SS] citations.",
    href: "/projects",
    external: false,
    cta: "See architecture"
  },
  {
    icon: "🍽️",
    name: "Restaurant & Hospitality Agent",
    description: "Ordering and bookings with human approval before every transaction.",
    href: "https://autonomous-restaurant-agent.vercel.app/",
    external: true,
    cta: "Try the live demo"
  }
];

const socials: SocialItem[] = [
  { name: "GitHub", icon: "🐙", url: "https://github.com/MurtazaAfzali13/", external: true },
  {
    name: "LinkedIn",
    icon: "💼",
    url: "https://www.linkedin.com/in/murtaza-afzali-484446405/",
    external: true
  },
  { name: "Email", icon: "📧", url: "mailto:murtazaafzali13@gmail.com", external: false }
];

const stack: string[] = ["LangGraph", "FastAPI", "Next.js", "Pinecone", "Supabase"];

export default function Footer() {
  return (
    <footer className="bg-white/15 backdrop-blur-lg border-t border-white/20 mt-20 relative z-20">
      <div className="container mx-auto py-12 px-4">
        {/* CTA band */}
        <div className="bg-gradient-to-r from-blue-500/30 to-purple-600/30 rounded-2xl border border-white/20 shadow-2xl p-6 md:p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
              Need AI that <span className="text-yellow-300">refuses to guess</span>?
            </h3>
            <p className="text-white/80 text-lg">
              Searchable videos with verified citations, or an ordering agent with human approval
              built in.
            </p>
          </div>
          <Link
            href="/contact"
            className="shrink-0 bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-full shadow-2xl text-lg font-semibold transition-all duration-300 backdrop-blur-lg border border-white/20 hover:from-green-600 hover:to-blue-700 transform hover:scale-105"
          >
            Start a Project
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="text-center md:text-left">
            <h3 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
              Murtaza <span className="text-yellow-300">Afzali</span>
            </h3>
            <p className="text-white/80 leading-relaxed mb-5">
              Full-Stack AI Engineer building production-grade multi-agent RAG systems and
              transactional AI agents that ground every answer in evidence.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {stack.map((tech) => (
                <span
                  key={tech}
                  className="bg-black/30 text-white/85 text-sm px-3 py-1 rounded-full border border-white/15"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h4 className="text-xl font-semibold text-white mb-6 drop-shadow-lg">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/80 hover:text-yellow-300 transition-all duration-300 text-lg group inline-flex items-center"
                  >
                    <span className="mr-2 group-hover:mr-3 transition-all duration-300">→</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Featured systems */}
          <div className="text-center md:text-left">
            <h4 className="text-xl font-semibold text-white mb-6 drop-shadow-lg">Featured Systems</h4>
            <div className="space-y-4">
              {systems.map((system) => {
                const content = (
                  <>
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                      <span className="text-2xl" aria-hidden="true">
                        {system.icon}
                      </span>
                      <span className="text-white font-semibold group-hover:text-yellow-300 transition-colors duration-300">
                        {system.name}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm mb-1">{system.description}</p>
                    <span className="text-yellow-300 text-sm font-medium">{system.cta} →</span>
                  </>
                );

                const className =
                  "group block bg-black/25 hover:bg-white/10 rounded-xl p-4 border border-white/10 hover:border-yellow-300/50 transition-all duration-300";

                return system.external ? (
                  <a
                    key={system.name}
                    href={system.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {content}
                  </a>
                ) : (
                  <Link key={system.name} href={system.href} className={className}>
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Connect */}
          <div className="text-center md:text-left">
            <h4 className="text-xl font-semibold text-white mb-6 drop-shadow-lg">Connect With Me</h4>
            <div className="flex justify-center md:justify-start space-x-4">
              {socials.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  {...(social.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="text-3xl hover:text-yellow-300 transition-all duration-300 transform hover:scale-110 backdrop-blur-sm p-2 rounded-lg hover:bg-white/10 border border-white/10"
                  title={social.name}
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-white/70">📍 Herat, Afghanistan</p>
              <a
                href="mailto:murtazaafzali13@gmail.com"
                className="block text-white/80 hover:text-yellow-300 transition-colors"
              >
                murtazaafzali13@gmail.com
              </a>
              <a
                href="tel:+93783000247"
                className="block text-yellow-300 hover:text-yellow-200 transition-colors text-lg"
              >
                +93 783 000 247
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/80 text-lg text-center md:text-left">
              © {new Date().getFullYear()}{" "}
              <span className="text-yellow-300 font-semibold">Murtaza Afzali</span>. All rights
              reserved.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-2 text-white/60">
              <span>Built with</span>
              <span className="text-yellow-300 font-semibold">Next.js</span>
              <span>and designed around</span>
              <span className="text-cyan-400 font-semibold">LangGraph</span>
              <span>pipelines</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
