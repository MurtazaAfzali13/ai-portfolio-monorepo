import type { Metadata, Viewport } from "next";
import ChatModal from "@/components/ChatModal";
import MouseTrail from "@/components/MouseTrail";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Murtaza Afzali | Full-Stack AI Engineer · Multi-Agent RAG Systems",
    template: "%s | Murtaza Afzali"
  },
  description:
    "Full-Stack AI Engineer building production-grade multi-agent RAG systems with LangGraph, FastAPI, and Next.js. Projects: VidBrain, grounded video intelligence with verified timestamps, and an Enterprise Restaurant & Hospitality Agent with human approval.",
  keywords: [
    "Murtaza Afzali",
    "AI Engineer",
    "Full-Stack Developer",
    "LangGraph",
    "Multi-Agent Systems",
    "RAG",
    "FastAPI",
    "Next.js",
    "VidBrain"
  ],
  authors: [{ name: "Murtaza Afzali", url: "https://github.com/MurtazaAfzali13" }],
  openGraph: {
    title: "Murtaza Afzali | Full-Stack AI Engineer",
    description:
      "Multi-agent RAG systems that refuse to guess: VidBrain and an Enterprise Restaurant & Hospitality Agent.",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "Murtaza Afzali | Full-Stack AI Engineer",
    description:
      "Multi-agent RAG systems that refuse to guess: VidBrain and an Enterprise Restaurant & Hospitality Agent."
  }
};

// Keeps the mobile browser bar dark instead of white, matching the space background.
export const viewport: Viewport = {
  themeColor: "#0a0624"
};

export default function RootLayout({
  children,
  modal
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    // The inline colour is a safety net: even before the stylesheet applies, the page is dark.
    <html lang="en" style={{ backgroundColor: "#0a0624" }}>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-yellow-300 focus:px-4 focus:py-2 focus:font-semibold focus:text-gray-900"
        >
          Skip to content
        </a>

        <MouseTrail />
        <main id="main-content">{children}</main>
        {modal}
        <Header />
        <ChatModal />
        <Footer />
      </body>
    </html>
  );
}
