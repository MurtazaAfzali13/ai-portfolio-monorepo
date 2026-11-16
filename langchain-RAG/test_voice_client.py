import requests
import sounddevice as sd
from scipy.io.wavfile import write
import numpy as np
import pygame
import os

API_URL = "http://127.0.0.1:8000/voice/talk"

def record_and_send():
    fs = 16000
    input("\n🎙️ برای پرسیدن سوال از پورتفولیو Enter بزنید...")
    print("🔴 در حال ضبط... (برای پایان دوباره Enter بزنید)")
    
    recording = []
    def callback(indata, frames, time, status):
        recording.append(indata.copy())
        
    with sd.InputStream(samplerate=fs, channels=1, dtype='int16', callback=callback):
        input()
        
    print("⏳ در حال ارسال به سرور و جستجو در Pinecone...")
    audio_data = np.concatenate(recording, axis=0)
    write("mic_test.wav", fs, audio_data)
    
    with open("mic_test.wav", "rb") as f:
        response = requests.post(API_URL, files={"audio": ("mic_test.wav", f, "audio/wav")})
        
    os.remove("mic_test.wav")
    
    if response.status_code == 200:
        with open("server_reply.mp3", "wb") as f:
            f.write(response.content)
            
        print("🔊 در حال پخش پاسخ دستیار:")
        pygame.mixer.init()
        pygame.mixer.music.load("server_reply.mp3")
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
        pygame.mixer.quit()
        os.remove("server_reply.mp3")
    else:
        print(f"❌ خطا ({response.status_code}): {response.text}")

if __name__ == "__main__":
    while True:
        record_and_send()