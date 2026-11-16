FROM python:3.11-slim

WORKDIR /app_root

COPY requirements.txt .

# افزایش زمان انتظار دانلود به 1000 ثانیه و تعداد تلاش مجدد به 5 بار
RUN pip install --default-timeout=1000 --retries 5 -r requirements.txt

COPY . .

EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]