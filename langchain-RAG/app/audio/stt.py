import logging
from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)


stt_model = WhisperModel("small", device="cpu", compute_type="int8")

def transcribe_audio(file_path: str) -> str:
    """تبدیل فایل صوتی دریافتی به متن"""
    try:
        segments, info = stt_model.transcribe(file_path, beam_size=5)
        text = " ".join([segment.text for segment in segments]).strip()
        logger.info(f"Transcribed ({info.language}): {text}")
        return text
    except Exception as e:
        logger.error(f"STT Error: {e}", exc_info=True)
        return ""