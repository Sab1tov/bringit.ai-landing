# Общий образ для всех трёх сервисов демо (rasa-core, rasa-actions, web-connector).
FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# 1) Rasa + Rasa SDK (3.x — совместимость с numpy 1.24 / pydantic 1.x)
# 2) Остальные зависимости демо
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir "rasa>=3.6.0,<4.0.0" "rasa-sdk>=3.6.0,<4.0.0" && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

# Только порт 8000 (web-connector) должен быть доступен снаружи
EXPOSE 8000

CMD ["python", "start.py"]
