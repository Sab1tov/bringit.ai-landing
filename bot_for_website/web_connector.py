"""
web_connector.py — тонкий веб-адаптер между сайтом и мозгом Rasa (демо для сайта).

Это единственный публичный вход демо. Он играет ту же роль, что раньше играли мосты
WhatsApp/Instagram: принимает сообщение клиента, передаёт его в Rasa REST и возвращает
ответы. Сам Rasa (порт 5005) и сервер действий (5055) остаются в приватной сети и НЕ
торчат в интернет — так же, как требует SECURITY.md исходного проекта.

Контракт для фронтенда
----------------------
POST /api/chat
    Тело:    {"message": "текст от пользователя", "session_id": "<опционально>"}
    Ответ:   {"session_id": "<строка>", "replies": ["ответ1", "ответ2", ...]}

    session_id держит контекст диалога (форма записи, история для RAG). Фронтенд должен
    один раз получить session_id из первого ответа и слать его во всех следующих запросах
    этого пользователя. Если не прислать — сервер сгенерирует новый на каждый запрос
    (тогда бот будет «забывать» предыдущие реплики).

GET /health — проверка живости (для мониторинга/деплоя).
GET /       — маленькая тестовая страница чата (только для локальной проверки).

Запуск (рядом с `rasa run --enable-api` и `rasa run actions`):
    uvicorn web_connector:app --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import os
import uuid
import logging
from pathlib import Path
from typing import List, Optional

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# Переиспользуем маскирование ПДн в логах из общего модуля безопасности.
try:
    import security
    security.install_log_redaction()
except Exception:  # pragma: no cover
    security = None  # type: ignore

RASA_REST_URL = os.getenv("RASA_REST_URL", "http://127.0.0.1:5005/webhooks/rest/webhook")
# Origin'ы сайта, которым разрешён доступ. Для демо по умолчанию "*"; в проде укажи
# конкретный домен, например: WEB_CONNECTOR_CORS_ORIGINS=https://qadam.kz
CORS_ORIGINS = [o.strip() for o in os.getenv("WEB_CONNECTOR_CORS_ORIGINS", "*").split(",") if o.strip()]
MAX_MESSAGE_LEN = int(os.getenv("MAX_MESSAGE_LEN", "1000"))
REQUEST_TIMEOUT = float(os.getenv("WEB_CONNECTOR_TIMEOUT", "30"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("web-connector")

STATIC_DIR = Path(__file__).resolve().parent / "static"

app = FastAPI(title="QADAM Robotics — демо-чатбот", docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

# Один переиспользуемый HTTP-клиент на всё приложение (пул соединений к Rasa).
_client = httpx.AsyncClient(timeout=REQUEST_TIMEOUT)


class ChatIn(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatOut(BaseModel):
    session_id: str
    replies: List[str]


@app.on_event("shutdown")
async def _shutdown() -> None:
    await _client.aclose()


async def _ask_rasa(sender_id: str, text: str) -> List[str]:
    """Шлёт сообщение в Rasa REST и возвращает список текстовых ответов."""
    try:
        r = await _client.post(RASA_REST_URL, json={"sender": sender_id, "message": text})
        r.raise_for_status()
        data = r.json()
    except Exception:
        log.exception("Запрос к Rasa не удался")
        return ["Секунду, что-то пошло не так на нашей стороне. Попробуйте, пожалуйста, ещё раз."]

    if not isinstance(data, list):
        return []
    replies: List[str] = []
    for item in data:
        if isinstance(item, dict) and item.get("text"):
            replies.append(str(item["text"]))
    return replies


@app.post("/api/chat", response_model=ChatOut)
async def chat(payload: ChatIn) -> ChatOut:
    session_id = (payload.session_id or "").strip() or f"web:{uuid.uuid4().hex}"

    text = (payload.message or "").strip()
    if security is not None:
        text, _ = security.sanitize_incoming(text, MAX_MESSAGE_LEN)
    else:
        text = text[:MAX_MESSAGE_LEN]

    if not text:
        return ChatOut(session_id=session_id, replies=[])

    replies = await _ask_rasa(session_id, text)
    return ChatOut(session_id=session_id, replies=replies)


@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse({"status": "ok", "rasa_url": RASA_REST_URL})


@app.get("/", response_model=None)
async def index():
    """Локальная тестовая страница чата. На проде фронтенд обслуживается вашим сайтом."""
    page = STATIC_DIR / "index.html"
    if page.exists():
        return FileResponse(str(page))
    return JSONResponse({"status": "ok", "hint": "POST /api/chat with {message, session_id}"})
