

const PROJECT_COPY_OVERRIDES: { match: RegExp; desc: string }[] = [
  {
    match: /video|q\s*&\s*a|intelligent video/i,
    desc:
      "Full-stack video platform: Next.js (App Router, TypeScript, Tailwind) plus FastAPI for upload, streaming, and user workflows. An autonomous LangChain/LangGraph agent layer processes content, answers questions, and runs reflection loops before responding—decision-making grounded in processed media context, not generic chat.",
  },
  {
   match: /hospital|multilingual|health/i,
  desc:
    "AI-assisted clinical platform (Doctor Copilot) built across Agile sprints — a LangGraph multi-agent pipeline turns a doctor's free-text encounter note into structured prescription data, cross-checks it against a Pinecone drug-interaction index, and blocks printing on high-severity interactions until the physician provides a justified override. A separate ReAct tool-calling agent lets doctors look up a patient's full history and refer patients to colleagues, gated by a treatment-relationship access model enforced at both the Postgres RLS layer and in application code.",
},
];

export function enrichProjectDescription(title: string, desc: string): string {
  for (const { match, desc: override } of PROJECT_COPY_OVERRIDES) {
    if (match.test(title)) return override;
  }
  return desc;
}
