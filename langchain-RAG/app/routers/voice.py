import os
import uuid
import logging
from fastapi import APIRouter, UploadFile, File, Request, HTTPException
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from app.graph.rag import run_pipeline
from app.audio.stt import transcribe_audio
from app.audio.tts import generate_speech_file

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/voice",
    tags=["Voice Agent"]
)

TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

def _cleanup_files(*file_paths: str):
    """پاک کردن فایل‌های موقت پس از ارسال پاسخ به کلاینت"""
    for path in file_paths:
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except Exception as e:
                logger.warning(f"Failed to remove temp file {path}: {e}")

@router.post("/talk")
async def voice_talk(request: Request, audio: UploadFile = File(...)):
    """دریافت فایل صوتی کاربر -> جستجو در Pinecone RAG -> بازگرداندن فایل صوتی پاسخ"""
    rag_ready = getattr(request.app.state, "rag_ready", False)
    if not rag_ready:
        raise HTTPException(status_code=503, detail="RAG system is currently offline.")

    session_id = str(uuid.uuid4())
    input_path = os.path.join(TEMP_DIR, f"in_{session_id}_{audio.filename}")
    output_path = os.path.join(TEMP_DIR, f"out_{session_id}.mp3")

    try:
        # ۱. ذخیره فایل صوتی دریافتی از کاربر
        with open(input_path, "wb") as f:
            f.write(await audio.read())

        # ۲. تبدیل صدا به متن (STT)
        user_question = transcribe_audio(input_path)
        if not user_question:
            raise HTTPException(status_code=400, detail="Could not understand audio.")

        # ۳. ارسال سوال به پایپ‌لاین Pinecone RAG شما
        messages = [{"role": "user", "content": user_question}]
        response_parts = []
        
        async for event in run_pipeline(messages):
            if event["type"] == "token":
                response_parts.append(event["content"])
            elif event["type"] == "error":
                raise HTTPException(status_code=500, detail=event["message"])

        full_answer = "".join(response_parts).strip()
        logger.info(f"RAG Answer: {full_answer}")

        # ۴. تبدیل پاسخ متنی به فایل صوتی (TTS)
        await generate_speech_file(full_answer, output_path)

        # ۵. ارسال فایل صوتی به کلاینت و پاکسازی فایل‌های موقت در پس‌زمینه
        return FileResponse(
            path=output_path,
            media_type="audio/mpeg",
            filename="response.mp3",
            headers={
                "X-User-Transcript": user_question.encode("utf-8").decode("latin-1", "ignore"), # ارسال متن تشخیص داده شده در هدر
            },
            background=BackgroundTask(_cleanup_files, input_path, output_path)
        )

    except HTTPException:
        _cleanup_files(input_path, output_path)
        raise
    except Exception as e:
        _cleanup_files(input_path, output_path)
        logger.error(f"Voice pipeline error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal voice processing error.")