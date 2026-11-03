// app/contact/page.tsx
"use client";

import SpaceBackground from "@/components/SpaceBackground";
import ContactForm from "@/components/ContactForm";
import ContactInfo from "@/components/ContactInfo";

interface FAQ {
  question: string;
  answer: string;
}

interface Offer {
  icon: string;
  title: string;
  subtitle: string;
  points: string[];
}

interface Step {
  title: string;
  description: string;
}

interface Package {
  name: string;
  tag: string;
  description: string;
  recommended?: boolean;
}

export default function ContactPage() {
  const offers: Offer[] = [
    {
      icon: "🎬",
      title: "VidBrain-Style Video Intelligence",
      subtitle: "Make your videos, courses, or training library searchable",
      points: [
        "Timestamped answers with clickable [MM:SS] citations",
        "Small-to-Big retrieval: precise search, rich context",
        "Evidence gate that refuses to guess, plus a labeled web fallback",
        "Single-flight indexing so no video is embedded twice",
        "Per-user tenant isolation and a monitoring dashboard"
      ]
    },
    {
      icon: "🍽️",
      title: "Restaurant & Hospitality AI Agent",
      subtitle: "Autonomous ordering and reservations you can trust",
      points: [
        "Prices read live from your database, never guessed",
        "Human-in-the-Loop checkout: orders are placed only after the user clicks Confirm",
        "Anti-race-condition guard that re-checks the live cart total on resume",
        "Visual UI cards (meal images, receipts) without bloating the LLM context",
        "Cart icon on your website updates instantly when the agent adds an item"
      ]
    }
  ];

  const steps: Step[] = [
    {
      title: "Share your use case",
      description: "Tell me your use case and content type, such as videos, courses, menus, or bookings."
    },
    {
      title: "Agree on scope and package",
      description: "We choose the right package together before any work starts."
    },
    {
      title: "Build and demo on your data",
      description: "You see the system working on your own content, not a generic sample."
    },
    {
      title: "Review and revisions",
      description: "You review the demo and I apply revisions."
    },
    {
      title: "Handover with documentation",
      description: "Source code, setup guides, and an architecture walkthrough."
    }
  ];

  const deliverables: string[] = [
    "FastAPI and LangGraph backend source code",
    "Next.js frontend source code",
    "Database and vector index setup guide",
    "Environment and deployment guide",
    "Architecture walkthrough"
  ];

  const packages: Package[] = [
    {
      name: "Informational AI Agent",
      tag: "Standard Integration",
      description:
        "A conversational agent on your business data for FAQs, menu explanations, and general guidance, with context memory."
    },
    {
      name: "Read/Write Database Agent",
      tag: "Advanced Operations",
      description:
        "Adds tool-calling: the agent reads tables (room availability, active cart items) and performs non-critical modifications securely."
    },
    {
      name: "Full Agentic Workflow",
      tag: "Enterprise Production",
      description:
        "The complete architecture: Human-in-the-Loop checkpoints, artifact UI generation, anti-race-condition guards, and payment state interruptions.",
      recommended: true
    }
  ];

  const faqs: FAQ[] = [
    {
      question: "How do you stop the AI from hallucinating?",
      answer:
        "In VidBrain, an evidence gate grades every retrieved passage and fails closed: no evidence, no guess. Citations are built from retrieved data, and timestamps snap to real transcript markers. In the restaurant agent, prices and totals come from backend tools that read the live database."
    },
    {
      question: "What is Small-to-Big retrieval and why does it matter?",
      answer:
        "Small chunks are embedded for precise search. After a match, the larger parent passage is fetched from the database, so the model reads rich context while search stays accurate. You get better answers without sacrificing precision."
    },
    {
      question: "Can the agent place orders or bookings on its own?",
      answer:
        "Not for high-risk actions. Checkout and room-booking nodes pause the graph and show a visual card. The transaction runs only after the user clicks Confirm, and the live cart total is re-checked before it executes."
    },
    {
      question: "What does a failure look like in production?",
      answer:
        "Transient faults such as timeouts retry with backoff, and permanent ones fail fast. State is checkpointed, so a failed run resumes from the step that failed. If the database drops, tools return a graceful error and the agent apologizes without losing the conversation."
    },
    {
      question: "Who owns the accounts and API costs?",
      answer:
        "You do. AI provider, vector index, and database accounts are yours, and usage is billed to them. Plan and usage limits protect your API budget."
    },
    {
      question: "Can it handle heavy concurrent traffic?",
      answer:
        "A request queue for heavy concurrent traffic is not included by default and is scoped separately. Answer quality for video projects also depends on the quality of the source transcript."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center relative overflow-hidden pt-20">
      <SpaceBackground />

      <div className="relative z-10 w-full">
        {/* HERO */}
        <section className="fade-in mb-16 px-4">
          <div className="mb-8 flex flex-col items-center">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 text-white text-center drop-shadow-2xl">
              Build Your <span className="text-yellow-300 glow-text">Grounded AI</span>
            </h1>

            <div className="text-2xl md:text-3xl text-white/95 mb-4 slide-in-left text-center">
              <span className="pulse-slow font-semibold drop-shadow-lg">
                Multi-Agent RAG Systems That Refuse to Guess
              </span>
            </div>

            <p className="text-xl text-white/85 max-w-2xl mx-auto slide-in-right text-center backdrop-blur-lg bg-black/40 p-6 rounded-2xl border border-white/20 shadow-2xl">
              Have videos, courses, or a training library to make searchable? Running a restaurant
              or hotel that needs a trustworthy ordering agent? Message me your use case before
              ordering, and I will recommend the right scope.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4">
          {/* WHAT I BUILD */}
          <section className="fade-in mb-16">
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">What I Can Build for You</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {offers.map((offer) => (
                  <div
                    key={offer.title}
                    className="text-left bg-black/30 rounded-xl p-6 border border-white/10 hover:border-yellow-300/50 transition-colors duration-300"
                  >
                    <div className="text-4xl mb-3">{offer.icon}</div>
                    <h3 className="text-2xl font-semibold text-yellow-300 mb-1">{offer.title}</h3>
                    <p className="text-white/80 mb-4">{offer.subtitle}</p>
                    <ul className="space-y-2 text-white/85">
                      {offer.points.map((point) => (
                        <li key={point} className="flex items-start">
                          <span className="w-2 h-2 bg-yellow-300 rounded-full mt-2 mr-3 shrink-0"></span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FORM + INFO */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            <ContactForm />
            <div className="slide-in-right">
              <ContactInfo />
            </div>
          </div>

          {/* PROCESS */}
          <section className="slide-in-left mb-16">
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">How a Project Runs</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 text-left">
                {steps.map((step, index) => (
                  <div
                    key={step.title}
                    className="bg-black/30 rounded-xl p-5 border border-white/10"
                  >
                    <div className="text-yellow-300 font-bold text-lg mb-2">
                      {index + 1}. {step.title}
                    </div>
                    <p className="text-white/75 text-sm">{step.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-black/30 rounded-xl p-6 border border-white/10 text-left">
                <h3 className="text-xl font-semibold text-yellow-300 mb-3">What you get</h3>
                <ul className="grid md:grid-cols-2 gap-2 text-white/85">
                  {deliverables.map((item) => (
                    <li key={item} className="flex items-start">
                      <span className="w-2 h-2 bg-yellow-300 rounded-full mt-2 mr-3 shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* PACKAGES */}
          <section className="slide-in-right mb-16">
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-3 text-center">Integration Packages</h2>
              <p className="text-white/80 text-center mb-8 text-lg">
                Deployed as a headless backend API, ready for your React, Next.js, or Flutter app.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <div
                    key={pkg.name}
                    className={`text-left rounded-xl p-6 border transition-colors duration-300 ${
                      pkg.recommended
                        ? "bg-black/40 border-yellow-300/60"
                        : "bg-black/30 border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="text-sm text-white/60 mb-1">
                      {pkg.tag}
                      {pkg.recommended ? " · Recommended" : ""}
                    </div>
                    <h3 className="text-xl font-semibold text-yellow-300 mb-3">{pkg.name}</h3>
                    <p className="text-white/80">{pkg.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="fade-in mb-16">
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">Questions Clients Ask</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {faqs.map((faq) => (
                  <div
                    key={faq.question}
                    className="group hover:bg-white/5 p-6 rounded-xl transition-all duration-300 text-left"
                  >
                    <h3 className="text-xl font-semibold text-yellow-300 mb-3 group-hover:text-yellow-200 transition-colors duration-300">
                      {faq.question}
                    </h3>
                    <p className="text-white/80 group-hover:text-white/90 transition-colors duration-300">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center fade-in mb-16">
            <h3 className="w-fit mx-auto text-2xl font-bold text-white mb-4 backdrop-blur-lg bg-black/40 p-4 rounded-2xl border border-white/20 shadow-2xl">
              See VidBrain and the Restaurant Agent in Detail
            </h3>

            <p className="text-white/80 mb-6 backdrop-blur-lg bg-black/40 p-3 rounded-xl inline-block border border-white/20">
              Architecture breakdowns, pipeline nodes, and the engineering behind each project.
            </p>

            <br />

            <a
              href="/projects"
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-full shadow-2xl hover-lift text-lg font-semibold transition-all duration-300 inline-block backdrop-blur-lg border border-white/20 hover:from-green-600 hover:to-blue-700 transform hover:scale-105"
            >
              View Projects
            </a>
          </section>
        </div>
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
