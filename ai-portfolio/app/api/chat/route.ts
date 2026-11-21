// app/api/chat/route.ts
import { auth } from "@clerk/nextjs/server";

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
  // ۱. بررسی لاگین بودن کاربر و استخراج توکن JWT از Clerk
  const { userId, getToken } = await auth();
  if (!userId) {
    return errorStream("Unauthorized. Please sign in to use the assistant.", 401);
  }

  const token = await getToken();
  if (!token) {
    return errorStream("Could not verify session token. Please refresh and sign in again.", 401);
  }

  const backend =
    process.env.BACKEND_URL ?? (process.env.NODE_ENV !== "production" ? "http://127.0.0.1:8000" : undefined);
  if (!backend) return errorStream("BACKEND_URL is not configured on the server.", 500);

  try {
    const upstream = await fetch(`${backend.replace(/\/$/, "")}/chat/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // ۲. ارسال توکن به FastAPI
        Authorization: `Bearer ${token}`,
      },
      body: await req.text(),
      signal: req.signal,
    });

    if (!upstream.ok || !upstream.body) {
      // اگر FastAPI پیام خطای JSON برگردانده بود (مثل خطای 429 سقف سهمیه) آن را بخوان
      let detail = `The agent backend responded with ${upstream.status}.`;
      try {
        const errData = await upstream.json();
        if (errData?.detail) detail = errData.detail;
      } catch {
        /* ignore non-json error */
      }
      return errorStream(detail, upstream.status);
    }

    return new Response(upstream.body, { headers: HEADERS });
  } catch (err) {
    console.error("[api/chat] upstream failure:", err);
    return errorStream("Could not reach the agent backend.");
  }
}