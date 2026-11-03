import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.graph.rag import get_components 
from app.routers.chat import router as chat_router 

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.rag_ready = False
    try:
        get_components()
        app.state.rag_ready = True
        logger.info("RAG components loaded successfully")
    except Exception as e:
        logger.error("RAG startup failed: %s", e, exc_info=True)
        logger.error("Verify OPENROUTER_API_KEY, INDEX_NAME, PINECONE_API_KEY and connectivity.")
    
    yield  
    
    logger.info("Shutting down application...")

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://ai-portfolio-chat.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)

@app.get("/health")
async def health_check(request: Request):
    rag_ready = getattr(request.app.state, "rag_ready", False)
    return {
        "status": "healthy" if rag_ready else "degraded",
        "rag_available": rag_ready,
        "env": {
            "OPENROUTER_API_KEY_set": bool(os.getenv("OPENROUTER_API_KEY")),
            "INDEX_NAME_set": bool(os.getenv("INDEX_NAME")),
            "PINECONE_API_KEY_set": bool(os.getenv("PINECONE_API_KEY")),
        },
    }