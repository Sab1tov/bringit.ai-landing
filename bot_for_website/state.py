"""
state.py — единый стейт-стор для моста на SQLite.

Заменяет data/bot_state.json и решает два бага:
  2.1 Идемпотентность: is_seen()/mark_seen() по message_id — не отвечаем дважды.
  2.2 Пауза без гонки: pause_chat()/is_paused() атомарно, переживает рестарт,
      сама истекает по времени (как TTL), без read-modify-write целого файла.

SQLite в режиме WAL безопасен при конкурентном доступе из нескольких корутин/потоков.
Когда проект разрастётся до нескольких процессов и очереди — этот же интерфейс
(pause_chat/is_paused/is_seen/mark_seen) переключается на Redis без правок вызывающего кода.
"""
from __future__ import annotations

import os
import sqlite3
import threading
import time
from pathlib import Path
from typing import Optional

STATE_DB = Path(os.getenv("BOT_STATE_DB", "data/bot_state.db"))
SEEN_TTL_SECONDS = int(os.getenv("SEEN_TTL_SECONDS", str(24 * 60 * 60)))  # сколько помнить обработанные message_id

_lock = threading.Lock()
_conn: Optional[sqlite3.Connection] = None


def _connect() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        STATE_DB.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(STATE_DB), check_same_thread=False)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        conn.execute(
            "CREATE TABLE IF NOT EXISTS pauses ("
            "  chat_id TEXT PRIMARY KEY,"
            "  until   INTEGER NOT NULL,"
            "  reason  TEXT"
            ")"
        )
        conn.execute(
            "CREATE TABLE IF NOT EXISTS seen ("
            "  message_id TEXT PRIMARY KEY,"
            "  ts         INTEGER NOT NULL"
            ")"
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_seen_ts ON seen(ts)")
        conn.execute(
            "CREATE TABLE IF NOT EXISTS counters ("
            "  name TEXT NOT NULL,"
            "  day  TEXT NOT NULL,"
            "  cnt  INTEGER NOT NULL,"
            "  PRIMARY KEY (name, day)"
            ")"
        )
        conn.commit()
        _conn = conn
    return _conn


def _now() -> int:
    return int(time.time())


# ---------- Пауза бота по чату (2.2) ----------

def pause_chat(chat_id: str, seconds: int, reason: str = "manager") -> int:
    """Ставит паузу на чат до now+seconds. Возвращает время окончания (unix)."""
    until = _now() + int(seconds)
    with _lock:
        conn = _connect()
        conn.execute(
            "INSERT INTO pauses(chat_id, until, reason) VALUES(?,?,?) "
            "ON CONFLICT(chat_id) DO UPDATE SET until=excluded.until, reason=excluded.reason",
            (chat_id, until, reason),
        )
        conn.commit()
    return until


def pause_until(chat_id: str) -> int:
    """Возвращает unix-время окончания паузы (0 если паузы нет). На чтении ничего не пишет."""
    with _lock:
        conn = _connect()
        row = conn.execute("SELECT until FROM pauses WHERE chat_id=?", (chat_id,)).fetchone()
    return int(row[0]) if row else 0


def is_paused(chat_id: str) -> bool:
    return pause_until(chat_id) > _now()


def clear_pause(chat_id: str) -> None:
    with _lock:
        conn = _connect()
        conn.execute("DELETE FROM pauses WHERE chat_id=?", (chat_id,))
        conn.commit()


# ---------- Идемпотентность по message_id (2.1) ----------

def is_seen(message_id: str) -> bool:
    """True, если этот message_id уже обрабатывался (значит, отвечать повторно не надо)."""
    if not message_id:
        return False
    with _lock:
        conn = _connect()
        row = conn.execute("SELECT 1 FROM seen WHERE message_id=?", (message_id,)).fetchone()
    return row is not None


def mark_seen(message_id: str) -> None:
    """Помечает message_id как обработанный и подчищает старые записи."""
    if not message_id:
        return
    now = _now()
    with _lock:
        conn = _connect()
        conn.execute("INSERT OR IGNORE INTO seen(message_id, ts) VALUES(?,?)", (message_id, now))
        conn.execute("DELETE FROM seen WHERE ts < ?", (now - SEEN_TTL_SECONDS,))
        conn.commit()


# ---------- Дневной лимит вызовов OpenAI (защита от финансового DoS) ----------

def try_consume_openai(max_per_day: int) -> bool:
    """Атомарно: если сегодня сделано < max_per_day вызовов — увеличивает счётчик и
    возвращает True; иначе False (вызывающий должен отдать ответ менеджеру).

    Счётчик общий для всех процессов (одна SQLite-БД), переживает рестарт.
    max_per_day <= 0 означает «без лимита».
    """
    if max_per_day <= 0:
        return True
    day = time.strftime("%Y-%m-%d", time.gmtime())
    with _lock:
        conn = _connect()
        row = conn.execute(
            "SELECT cnt FROM counters WHERE name='openai' AND day=?", (day,)
        ).fetchone()
        cur = int(row[0]) if row else 0
        if cur >= max_per_day:
            return False
        conn.execute(
            "INSERT INTO counters(name, day, cnt) VALUES('openai', ?, 1) "
            "ON CONFLICT(name, day) DO UPDATE SET cnt = cnt + 1",
            (day,),
        )
        conn.commit()
    return True


def claim_message(message_id: str) -> bool:
    """Атомарно занимает message_id. True — впервые (обрабатываем), False — дубль.
    Закрывает гонку is_seen()+mark_seen(): проверка и пометка в одной транзакции."""
    if not message_id:
        return True
    now = _now()
    with _lock:
        conn = _connect()
        cur = conn.execute("INSERT OR IGNORE INTO seen(message_id, ts) VALUES(?,?)", (message_id, now))
        inserted = cur.rowcount == 1
        conn.execute("DELETE FROM seen WHERE ts < ?", (now - SEEN_TTL_SECONDS,))
        conn.commit()
    return inserted