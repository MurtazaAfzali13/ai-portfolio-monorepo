import re
import edge_tts

def _clean_text_for_speech(text: str) -> str:
    """حذف کاراکترهای مارک‌داون که TTS نباید بخواند"""
    text = re.sub(r'[*#_`~>\[\]]', '', text)
    text = re.sub(r'http\S+', 'link', text) 
    return text.strip()

async def generate_speech_file(text: str, output_path: str, lang: str = "en"):
    """تولید فایل صوتی MP3 از متن"""
    clean_text = _clean_text_for_speech(text)
    if not clean_text:
        clean_text = "I didn't catch that, could you repeat?"

    voice = "fa-IR-DilaraNeural" if any("\u0600" <= c <= "\u06FF" for c in clean_text) else "en-US-AriaNeural"
    
    communicate = edge_tts.Communicate(clean_text, voice)
    await communicate.save(output_path)