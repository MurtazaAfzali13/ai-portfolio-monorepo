FROM python:3.11-slim
WORKDIR /app_root

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# کپی کردن کل پوشه پروژه (شامل پوشه app) به داخل داکر
COPY . .

EXPOSE 8000

# اجرای Uvicorn با آدرس‌دهی جدید (app.main:app)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]