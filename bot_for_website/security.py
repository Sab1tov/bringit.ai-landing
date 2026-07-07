"""
security.py — переиспользуемые средства безопасности для NE Manager.

Содержит:
  * mask_pii / RedactingFilter / install_log_redaction — маскирование телефонов в логах (ПДн).
  * RateLimiter — per-chat ограничение частоты (защита от флуда и финансового DoS на OpenAI).
  * sanitize_incoming — обрезка длины и control-символов во входящем тексте.
  * neutralize_prompt_injection — нейтрализация попыток подменить инструкции в RAG-промпте.
  * verify_meta_signature / constant_time_eq — проверка подписи вебхуков Meta (для Instagram).
"""
from __future__ import annotations

import hashlib
import hmac
import logging
import os
import re
import time
from typing import Dict, Tuple


# ---------- Маскирование ПДн и секретов в логах ----------
# Телефоны (слитные и с разделителями) и известные секреты (токены) не должны
# попадать в логи в открытом виде.
_DIGIT_RUN = re.compile(r"\d{7,}")
_PHONE_SEP = re.compile(r"\+?\d[\d\s().\-]{8,14}\d")
_SECRETS: set = set()


def register_secret(value: str) -> None:
    """Зарегистрировать секрет (токен/ключ), который надо вырезать из логов."""
    if value and len(str(value)) >= 6:
        _SECRETS.add(str(value))


def _mask_digit_block(digits: str) -> str:
    if len(digits) <= 4:
        return digits
    return digits[:2] + "*" * (len(digits) - 4) + digits[-2:]


def mask_pii(text: str) -> str:
    t = str(text)

    # 1) Известные секреты — целиком в ***
    for secret in _SECRETS:
        if secret and secret in t:
            t = t.replace(secret, "***")

    # 2) Телефоны с разделителями (+7 775 603-43-83) — маскируем, если это 10–12 цифр,
    #    начинающихся с 7/8 (форма KZ/RU). Прайс-листы и таймстемпы не трогаем.
    def _repl_sep(m: "re.Match[str]") -> str:
        s = m.group(0)
        digits = re.sub(r"\D", "", s)
        if 10 <= len(digits) <= 12 and digits[0] in "78":
            return _mask_digit_block(digits)
        return s

    t = _PHONE_SEP.sub(_repl_sep, t)

    # 3) Любые оставшиеся длинные слитные последовательности цифр
    t = _DIGIT_RUN.sub(lambda m: _mask_digit_block(m.group(0)), t)
    return t


class RedactingFilter(logging.Filter):
    """Фильтр логирования: прогоняет финальное сообщение через mask_pii."""

    def filter(self, record: logging.LogRecord) -> bool:
        try:
            msg = record.getMessage()
        except Exception:
            return True
        record.msg = mask_pii(msg)
        record.args = ()
        return True


def install_log_redaction() -> None:
    """Вешает маскирование на root-логгер и его хендлеры. Идемпотентно."""
    f = RedactingFilter()
    root = logging.getLogger()
    if not any(isinstance(x, RedactingFilter) for x in root.filters):
        root.addFilter(f)
    for h in root.handlers:
        if not any(isinstance(x, RedactingFilter) for x in h.filters):
            h.addFilter(RedactingFilter())


# ---------- Ограничение частоты (rate limiting) ----------

class RateLimiter:
    """Простое окно фиксированной длины на ключ (chat_id). In-memory, на один процесс."""

    def __init__(self, max_per_window: int, window_seconds: int) -> None:
        self.max = max_per_window
        self.win = window_seconds
        self._data: Dict[str, Tuple[float, int]] = {}

    def allow(self, key: str) -> bool:
        now = time.time()
        window_start, count = self._data.get(key, (now, 0))
        if now - window_start >= self.win:
            window_start, count = now, 0
        count += 1
        self._data[key] = (window_start, count)
        return count <= self.max


# ---------- Санитизация входящего текста ----------
_CTRL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def sanitize_incoming(text: str, max_len: int = 1000) -> Tuple[str, bool]:
    """Убирает control-символы (кроме \\n \\t \\r) и обрезает по длине.

    Возвращает (очищенный_текст, был_ли_обрезан).
    Защищает от: гигантских сообщений (стоимость/память), log-injection через
    переводы строк/escape-последовательности.
    """
    t = _CTRL_CHARS.sub(" ", str(text or ""))
    truncated = len(t) > max_len
    if truncated:
        t = t[:max_len]
    return t.strip(), truncated


# ---------- Нейтрализация prompt-injection для RAG ----------
_INJECTION_DELIMS = ("<<<", ">>>", "```")


def neutralize_prompt_injection(text: str) -> str:
    """Снимает разделители, которыми пользователь мог бы вырваться из блока «данные»."""
    cleaned = str(text or "")
    for d in _INJECTION_DELIMS:
        cleaned = cleaned.replace(d, " ")
    return cleaned.strip()


# ---------- Проверка подписи вебхуков Meta (Instagram, фаза каналов) ----------

def constant_time_eq(a: str, b: str) -> bool:
    return hmac.compare_digest(a, b)


def verify_meta_signature(app_secret: str, raw_body: bytes, header_sig: str) -> bool:
    """Проверяет X-Hub-Signature-256 = sha256=HMAC(app_secret, raw_body).

    Применять на КАЖДЫЙ POST публичного вебхука Instagram, иначе кто угодно сможет
    слать боту поддельные сообщения и сливать бюджет OpenAI.
    """
    if not app_secret or not header_sig or not header_sig.startswith("sha256="):
        return False
    expected = hmac.new(app_secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header_sig.split("=", 1)[1])
