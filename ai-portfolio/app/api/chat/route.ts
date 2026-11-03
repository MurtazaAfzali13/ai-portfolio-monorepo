// app/api/chat/route.ts
// Streams the FastAPI NDJSON events straight through to the browser (no buffering).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Content-Type": "application/x-ndjson; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  "X-Accel-Buffering": "no",
};

const errorStream = (message: string, status = 502) =>
  new Response(JSON.stringify({ type: "error", message }) + "\n", { status, headers: HEADERS });

export async function POST(req: Request) {
  // Falls back to the local FastAPI server in development.
  const backend =
    process.env.BACKEND_URL ?? (process.env.NODE_ENV !== "production" ? "http://127.0.0.1:8000" : undefined);
  if (!backend) return errorStream("BACKEND_URL is not configured on the server.", 500);

  try {
    const upstream = await fetch(`${backend.replace(/\/$/, "")}/chat/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await req.text(),
      signal: req.signal,
    });

    if (!upstream.ok || !upstream.body) {
      return errorStream(`The agent backend responded with ${upstream.status}.`);
    }
    return new Response(upstream.body, { headers: HEADERS });
  } catch (err) {
    console.error("[api/chat] upstream failure:", err);
    return errorStream("Could not reach the agent backend.");
  }
}
