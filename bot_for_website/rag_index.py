from __future__ import annotations

from dotenv import load_dotenv

load_dotenv()

from rag_engine import build_index, KNOWLEDGE_PATH, INDEX_PATH  # noqa: E402


if __name__ == "__main__":
    payload = build_index()
    print("RAG index готов ✅")
    print(f"База знаний: {KNOWLEDGE_PATH}")
    print(f"Индекс: {INDEX_PATH}")
    print(f"Фрагментов: {payload.get('chunk_count')}")
    print("Теперь можно запускать: rasa run actions")
