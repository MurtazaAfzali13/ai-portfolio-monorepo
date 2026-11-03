
import asyncio
import logging
import os
import re
import time
from functools import lru_cache
from typing import Any, AsyncGenerator, Dict, List, Tuple

from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore

load_dotenv()

logger = logging.getLogger(__name__)

MAX_HISTORY = 6      # previous messages sent to the model
FETCH_K = 8          # passages pulled from Pinecone
FINAL_K = 4          # passages kept after ranking / de-duplication
MODEL_NAME = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")


# --------------------------------------------------------------------------- #
# Setup
# --------------------------------------------------------------------------- #
def _build_openrouter_headers() -> dict:
    app_url = os.getenv("OPENROUTER_SITE_URL") or os.getenv("APP_URL") or "https://railway.app"
    app_name = os.getenv("OPENROUTER_APP_NAME") or "LangChain RAG API"
    return {"HTTP-Referer": app_url, "X-Title": app_name}


def _validate_required_env() -> Tuple[str, str]:
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    index_name = os.getenv("INDEX_NAME")
    if not openrouter_key:
        logger.error("Missing required environment variable: OPENROUTER_API_KEY")
    if not index_name:
        logger.error("Missing required environment variable: INDEX_NAME")
    if not openrouter_key or not index_name:
        raise RuntimeError(
            "RAG configuration is incomplete. Please set OPENROUTER_API_KEY and INDEX_NAME."
        )
    return openrouter_key, index_name


@lru_cache(maxsize=1)
def get_components() -> Tuple[PineconeVectorStore, ChatOpenAI]:
    """Create the vector store + LLM once and reuse them for every request."""
    openrouter_key, index_name = _validate_required_env()
    headers = _build_openrouter_headers()
    logger.info("Initializing RAG components (index=%s, model=%s)", index_name, MODEL_NAME)

    # NOTE: the embedding model must match the one used in ingestion.py.
    embeddings = OpenAIEmbeddings(
        openai_api_key=openrouter_key,
        openai_api_base="https://openrouter.ai/api/v1",
        default_headers=headers,
    )
    llm = ChatOpenAI(
        openai_api_key=openrouter_key,
        base_url="https://openrouter.ai/api/v1",
        model=MODEL_NAME,
        default_headers=headers,
        temperature=0.2,
        streaming=True,
    )
    vectorstore = PineconeVectorStore(index_name=index_name, embedding=embeddings)
    return vectorstore, llm


# --------------------------------------------------------------------------- #
# Prompts
# --------------------------------------------------------------------------- #
REWRITE_PROMPT = (
    "Rewrite the user's latest message as a standalone search question, resolving "
    "pronouns and references using the conversation. Keep the original language. "
    "Do not answer it. Output only the rewritten question."
)

SYSTEM_PROMPT = """You are the AI assistant on Murtaza Afzali's portfolio website. \
Recruiters, clients and engineers talk to you to understand what Murtaza builds and how well he builds it.

Ground rules
- Use ONLY the context below. Never invent projects, employers, metrics, dates or technologies.
- If the context does not contain the answer, say so plainly and suggest what you CAN speak about.
- Reply in the same language as the user's latest message (Persian -> Persian, English -> English).
  Keep technical terms (LangGraph, RAG, FastAPI, Pinecone...) in English.

How to answer
- Lead with the direct answer in the first sentence.
- Then give concrete evidence: the project name, the stack, what he actually built, and the result.
- Connect every skill to a real project from the context whenever one exists.
- Be specific and personal; skip generic filler and marketing language.
- Format with light Markdown: **bold** for project names and key technologies,
  short bullet lists (max 5 bullets), no headings, no long paragraphs.
- Keep it tight: usually 80-180 words unless the user asks for depth.

Context
{context}
"""


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _ms(start: float) -> int:
    return int((time.perf_counter() - start) * 1000)


def _title_of(text: str) -> str:
    for line in text.splitlines():
        clean = line.strip().strip("=#-*_ ").strip()
        if clean:
            return clean[:70]
    return "Portfolio note"


def _snippet_of(text: str, limit: int = 220) -> str:
    return re.sub(r"\s+", " ", text).strip()[:limit]


def _fingerprint(text: str) -> str:
    return re.sub(r"\W+", "", text.lower())[:140]


def _to_lc_messages(history: List[Dict[str, str]]) -> List[Any]:
    out: List[Any] = []
    for m in history:
        if m["role"] == "user":
            out.append(HumanMessage(content=m["content"]))
        else:
            out.append(AIMessage(content=m["content"]))
    return out


def _stage(stage_id: str, status: str, detail: str = "", ms: int = 0) -> Dict[str, Any]:
    return {"type": "stage", "id": stage_id, "status": status, "detail": detail, "ms": ms}


async def _rewrite_question(llm: ChatOpenAI, history: List[Dict[str, str]], question: str) -> str:
    try:
        result = await llm.ainvoke(
            [SystemMessage(content=REWRITE_PROMPT), *_to_lc_messages(history), HumanMessage(content=question)]
        )
        rewritten = str(result.content).strip().strip('"')
        return rewritten or question
    except Exception as exc:  # never block the answer on the rewrite step
        logger.warning("Question rewrite failed, using original: %s", exc)
        return question


# --------------------------------------------------------------------------- #
# Pipeline
# --------------------------------------------------------------------------- #
async def run_pipeline(messages: List[Dict[str, str]]) -> AsyncGenerator[Dict[str, Any], None]:
    t_total = time.perf_counter()
    try:
        vectorstore, llm = get_components()
        question = messages[-1]["content"].strip()
        history = messages[:-1][-MAX_HISTORY:]

        # 1) Understand -------------------------------------------------------
        t = time.perf_counter()
        yield _stage("understand", "start", "Reading your question")
        search_query = question
        if history:
            search_query = await _rewrite_question(llm, history, question)
            if search_query.strip().lower() != question.strip().lower():
                detail = f"Resolved context: “{search_query[:90]}”"
            else:
                detail = "Question is already self-contained"
        else:
            detail = "First message, no earlier context to resolve"
        yield _stage("understand", "done", detail, _ms(t))

        # 2) Retrieve ---------------------------------------------------------
        t = time.perf_counter()
        yield _stage("retrieve", "start", "Embedding the query and searching Pinecone")
        results = await asyncio.to_thread(
            vectorstore.similarity_search_with_score, search_query, k=FETCH_K
        )
        if results:
            best = max(score for _, score in results)
            detail = f"Found {len(results)} passages, best match {best:.0%}"
        else:
            detail = "No passages found"
        yield _stage("retrieve", "done", detail, _ms(t))

        # 3) Rank -------------------------------------------------------------
        t = time.perf_counter()
        yield _stage("rank", "start", "Removing duplicates and ranking passages")
        seen, kept = set(), []
        for doc, score in sorted(results, key=lambda r: r[1], reverse=True):
            fp = _fingerprint(doc.page_content)
            if fp in seen:
                continue
            seen.add(fp)
            kept.append((doc, score))
            if len(kept) == FINAL_K:
                break
        sources = [
            {"title": _title_of(d.page_content), "score": round(float(s), 4), "snippet": _snippet_of(d.page_content)}
            for d, s in kept
        ]
        yield _stage("rank", "done", f"Kept the {len(kept)} most relevant of {len(results)}", _ms(t))
        if sources:
            yield {"type": "sources", "sources": sources}

        # 4) Generate ---------------------------------------------------------
        t = time.perf_counter()
        yield _stage("generate", "start", f"Writing the answer with {MODEL_NAME}")
        context = (
            "\n\n".join(f"[{i}] {d.page_content.strip()}" for i, (d, _) in enumerate(kept, 1))
            if kept
            else "(no relevant context was found in the knowledge base)"
        )
        prompt = [
            SystemMessage(content=SYSTEM_PROMPT.format(context=context)),
            *_to_lc_messages(history),
            HumanMessage(content=question),
        ]
        chars = 0
        async for chunk in llm.astream(prompt):
            text = chunk.content if isinstance(chunk.content, str) else ""
            if text:
                chars += len(text)
                yield {"type": "token", "content": text}
        yield _stage("generate", "done", f"Wrote {chars} characters", _ms(t))

        yield {"type": "done", "total_ms": _ms(t_total)}

    except asyncio.CancelledError:
        raise
    except Exception as exc:
        logger.error("Pipeline error: %s", exc, exc_info=True)
        yield {"type": "error", "message": "The agent hit an error while processing this request."}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    async def _demo():
        async for event in run_pipeline(
            [{"role": "user", "content": "What is Murtaza's expertise in AI and RAG?"}]
        ):
            print(event)

    asyncio.run(_demo())
