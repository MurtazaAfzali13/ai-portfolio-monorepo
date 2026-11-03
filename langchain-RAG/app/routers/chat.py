import json
import logging
from typing import Any, AsyncGenerator, Dict, List, Optional

from fastapi import APIRouter, Request
from fastapi.responses import PlainTextResponse, StreamingResponse
from pydantic import BaseModel

from app.graph.rag import run_pipeline

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)

class Message(BaseModel):
    role: str
    content: str = ""

class ChatRequest(BaseModel):
    messages: Optional[List[Message]] = None
    question: Optional[str] = None

def _clean_messages(data: ChatRequest) -> List[Dict[str, str]]:
    raw = list(data.messages or [])
    if not raw and data.question:
        raw = [Message(role="user", content=data.question)]
    return [
        {"role": "assistant" if m.role == "assistant" else "user", "content": m.content.strip()}
        for m in raw
        if m.content and m.content.strip()
    ]

def _line(event: Dict[str, Any]) -> str:
    return json.dumps(event, ensure_ascii=False) + "\n"

@router.post("/events")
async def chat_events(data: ChatRequest, request: Request):
    """NDJSON stream of real pipeline events: stages, sources, tokens, done."""
    messages = _clean_messages(data)
    # خواندن وضعیت سیستم RAG از state اپلیکیشن
    rag_ready = getattr(request.app.state, "rag_ready", False)

    async def generate() -> AsyncGenerator[str, None]:
        if not rag_ready:
            yield _line({"type": "error", "message": "The agent is offline. Please try again shortly."})
            return
        if not messages or messages[-1]["role"] != "user":
            yield _line({"type": "error", "message": "Send a question to start."})
            return
        async for event in run_pipeline(messages):
            yield _line(event)

    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson; charset=utf-8",
        headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"},
    )

@router.post("/stream")
async def chat_stream(data: ChatRequest, request: Request):
    """Plain-text token stream (compat)."""
    messages = _clean_messages(data)
    rag_ready = getattr(request.app.state, "rag_ready", False)

    async def generate() -> AsyncGenerator[str, None]:
        if not rag_ready or not messages:
            yield "RAG chain not available"
            return
        async for event in run_pipeline(messages):
            if event["type"] == "token":
                yield event["content"]
            elif event["type"] == "error":
                yield event["message"]

    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")

@router.post("/")
async def chat(data: ChatRequest, request: Request):
    """Non-streaming answer (compat)."""
    messages = _clean_messages(data)
    rag_ready = getattr(request.app.state, "rag_ready", False)
    
    if not rag_ready:
        return PlainTextResponse("RAG chain not available", status_code=503)
    if not messages:
        return PlainTextResponse("No messages provided", status_code=400)

    parts: List[str] = []
    async for event in run_pipeline(messages):
        if event["type"] == "token":
            parts.append(event["content"])
        elif event["type"] == "error":
            return PlainTextResponse(event["message"], status_code=500)
    return PlainTextResponse("".join(parts))