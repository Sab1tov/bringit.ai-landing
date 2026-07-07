from __future__ import annotations

import os
import re
import json
import logging
import sys
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, Text, List

from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.forms import ValidationAction
from rasa_sdk.events import SlotSet, AllSlotsReset
from rapidfuzz import process, fuzz

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

log = logging.getLogger(__name__)

# actions/actions.py лежит в actions/, значит корень проекта на один уровень выше.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

LEADS_PATH = PROJECT_ROOT / "data" / "leads.jsonl"

try:
    from rag_engine import answer_question_with_rag
except Exception as e:
    answer_question_with_rag = None  # type: ignore
    log.warning("[RAG] модуль не загрузился: %s", e)

# Безопасность: маскируем телефоны/ПДн в логах сервера действий.
try:
    import security
    security.install_log_redaction()
except Exception as _e:  # pragma: no cover
    log.warning("[security] редактор логов не подключился: %s", _e)



def get_recent_chat_history(tracker: Tracker, max_messages: int = 10) -> List[Dict[str, str]]:
    """Берём последние реплики клиента и бота из tracker, чтобы GPT отвечал с контекстом.

    Это нужно, чтобы RAG-ответ не начинался каждый раз с «Привет»
    и мог понимать короткие уточнения клиента.
    """
    history: List[Dict[str, str]] = []
    try:
        for event in tracker.events:
            event_type = event.get("event")
            text = ""
            role = "user"

            if event_type == "user":
                role = "user"
                text = event.get("text") or event.get("parse_data", {}).get("text") or ""
            elif event_type == "bot":
                role = "assistant"
                text = event.get("text") or ""
            else:
                continue

            text = re.sub(r"\s+", " ", str(text)).strip()
            if text:
                history.append({"role": role, "text": text})
    except Exception:
        log.exception("Не удалось собрать историю диалога для RAG")

    return history[-max_messages:]

def notify_manager(text: str) -> None:
    """Демо-версия для сайта: внешних интеграций (WhatsApp/Green API/CRM) здесь нет.

    Заявка уже сохранена в data/leads.jsonl (см. save_lead). Тут просто пишем в лог,
    что менеджер получил бы уведомление — чтобы было видно срабатывание в демо.
    В боевой версии сюда возвращается отправка в CRM/мессенджер.
    """
    log.info("[notify_manager] (демо) менеджер получил бы уведомление:\n%s", text)


def save_lead(lead: Dict[str, Any]) -> None:
    """Сохраняет заявку в data/leads.jsonl."""
    try:
        LEADS_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(LEADS_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(lead, ensure_ascii=False) + "\n")
    except Exception as e:
        log.warning("[save_lead] ошибка: %s", e)


CHANNEL_LABELS = {"whatsapp": "WhatsApp", "instagram": "Instagram", "telegram": "Telegram", "other": "чата"}


def parse_sender(sender_id: str) -> tuple[str, str, str | None]:
    """Определяет канал и контакт клиента по Rasa sender_id.

    sender_id задаётся мостом канала, поэтому по нему однозначно виден источник:
      * WhatsApp (green_bridge):   '77001234567@c.us' -> ('whatsapp',  '77001234567', '+77001234567')
      * Instagram (wazzup_bridge): 'ig:<chatId>'       -> ('instagram', '<chatId>',    None)
      * прочее (Telegram/REST):    '<id>'              -> ('other',     '<id>',        None)

    Возвращает (channel, contact, phone_from_transport). phone_from_transport — это НЕ
    телефон из формы, а адрес клиента в транспорте (для WhatsApp он же и есть номер).
    """
    sid = (sender_id or "").strip()
    if sid.startswith("ig:"):
        return "instagram", sid[3:], None
    if sid.endswith("@c.us") or sid.endswith("@g.us"):
        number = sid.split("@", 1)[0]
        return "whatsapp", number, (("+" + number) if number else None)
    return "other", sid, None


def _format_contact_line(channel: str, contact: str, phone: str | None) -> str:
    """Строка «как связаться с клиентом» для уведомления менеджеру — под конкретный канал."""
    if channel == "whatsapp":
        return f"💬 WhatsApp клиента: {phone or ('+' + contact)}"
    if channel == "instagram":
        return f"💬 Instagram клиента: @{contact}"
    return f"💬 Контакт клиента: {contact}"


def normalize_phone(value: Any) -> str | None:
    text = re.sub(r"[\s\-()]+", "", str(value))
    if re.match(r"^(\+?7|8)\d{10}$", text):
        if text.startswith("8"):
            text = "+7" + text[1:]
        elif text.startswith("7"):
            text = "+" + text
        return text
    return None


class ValidateEnrollmentForm(ValidationAction):
    def name(self) -> Text:
        return "validate_enrollment_form"

    def validate_grade(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> Dict[Text, Any]:
        text = str(slot_value).strip()

        # 2.3: формат имеет приоритет. Принимаем ТОЛЬКО если ввод похож на класс
        # (короткий, без '?', с числом 1–11). Иначе ввод никогда не попадает в слот.
        if "?" not in text and len(text) <= 20:
            m = re.search(r"\b(1[01]|[1-9])\b", text)
            if m:
                return {"grade": f"{int(m.group(1))} класс"}

        # Не похоже на класс: если это вопрос — ответим и переспросим, иначе просто переспросим.
        if looks_like_question_during_form(text):
            answer_question_during_form(
                dispatcher,
                tracker,
                text,
                "А теперь подскажите, пожалуйста, в каком классе учится ребёнок? Например: 3 класс.",
            )
        else:
            dispatcher.utter_message(
                text="Ой, класс должен быть от 1 до 11 🙂 Напишите, пожалуйста, например: 3 класс."
            )
        return {"grade": None}

    def validate_district(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> Dict[Text, Any]:
        text = str(slot_value).strip()

        # 2.3: район — это короткое название места, а не вопрос/предложение.
        # Жёсткий формат: нет '?', не эвристический вопрос, не начинается с вопросительного
        # слова, длина 2..40, без длинных чисел. Раньше принимался ЛЮБОЙ текст длиной >= 2.
        generic_question = bool(
            re.match(
                r"^(а\s+)?(есть|нет|можно|нужно|сколько|какой|кака[яе]|каки[ме]|где|когда|почему|зачем|что|как|ли)\b",
                text.lower(),
            )
        ) or bool(re.search(r"\bли\b", text.lower()))
        looks_question = ("?" in text) or looks_like_question_during_form(text) or generic_question
        if not looks_question and 2 <= len(text) <= 40 and not re.search(r"\d{3,}", text):
            return {"district": text}

        if looks_question:
            answer_question_during_form(
                dispatcher,
                tracker,
                text,
                "А теперь напишите, пожалуйста, район или берег, где вам удобнее заниматься.",
            )
        else:
            dispatcher.utter_message(text="Напишите район или берег чуть подробнее. Например: Левый берег, центр, Самал.")
        return {"district": None}

    def validate_child_name(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> Dict[Text, Any]:
        text = re.sub(r"\s+", " ", str(slot_value).strip())

        # 2.3: имя — без цифр, без '?', не вопрос, 2..50 символов, не больше 3 слов.
        # Раньше «нет цифр + 2..50» пропускало вопросы вроде «а цена какая».
        is_question = ("?" in text) or looks_like_question_during_form(text)
        if (
            not is_question
            and 2 <= len(text) <= 50
            and not re.search(r"\d", text)
            and len(text.split()) <= 3
        ):
            return {"child_name": text.title()}

        if is_question:
            answer_question_during_form(
                dispatcher,
                tracker,
                text,
                "А теперь напишите, пожалуйста, имя ребёнка.",
            )
        else:
            dispatcher.utter_message(text="Напишите, пожалуйста, имя ребёнка без цифр. Например: Арман 🙂")
        return {"child_name": None}

    def validate_phone(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> Dict[Text, Any]:
        # 2.3: формат имеет приоритет. normalize_phone принимает только валидный
        # номер, поэтому вопрос/мусор в слот не пройдёт.
        phone = normalize_phone(slot_value)
        if phone:
            return {"phone": phone}

        if looks_like_question_during_form(str(slot_value)):
            answer_question_during_form(
                dispatcher,
                tracker,
                str(slot_value),
                "А теперь оставьте, пожалуйста, номер телефона для подтверждения записи.",
            )
        else:
            dispatcher.utter_message(text="Пришлите, пожалуйста, телефон в формате 87001234567 или +77001234567.")
        return {"phone": None}


class ActionAfterEnroll(Action):
    def name(self) -> Text:
        return "action_after_enroll"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]):
        child_name = tracker.get_slot("child_name")
        grade = tracker.get_slot("grade")
        district = tracker.get_slot("district")
        phone = tracker.get_slot("phone")
        channel, contact, transport_phone = parse_sender(tracker.sender_id)

        lead = {
            "ts": datetime.now().isoformat(timespec="seconds"),
            "child_name": child_name,
            "grade": grade,
            "district": district,
            "phone": phone,
            "channel": channel,       # whatsapp | instagram | other
            "contact": contact,       # адрес клиента в транспорте (номер / IG username / id)
            "source": channel,        # раньше было жёстко "whatsapp" — портило IG-лиды
            "status": "new_trial_request",
        }
        save_lead(lead)

        notify_manager(
            f"🔥 Новый тёплый лид из {CHANNEL_LABELS.get(channel, 'чата')}-бота\n\n"
            "Клиент сам прошёл форму записи — это не холодный контакт.\n\n"
            f"👦 Ребёнок: {child_name}\n"
            f"🎓 Класс: {grade}\n"
            f"📍 Район/берег: {district}\n"
            f"📞 Телефон: {phone}\n"
            f"{_format_contact_line(channel, contact, transport_phone)}\n"
            f"🕒 Время: {lead['ts']}\n\n"
            "Что сделать менеджеру:\n"
            "1) написать/позвонить в ближайшие 5–10 минут;\n"
            "2) предложить 2 удобных времени пробного;\n"
            "3) подтвердить адрес и возрастную группу.\n\n"
            "Важно: бот не пересылал весь диалог, только готовую заявку."
        )

        dispatcher.utter_message(response="utter_enroll_summary")
        dispatcher.utter_message(
            text="Пока менеджер проверяет места, могу ещё подсказать про программу, преподавателей или пробное занятие 🙂"
        )

        return [AllSlotsReset(), SlotSet("enroll_done", True)]


def normalize_query(text: str) -> str:
    text = (text or "").lower().replace("ё", "е")
    text = re.sub(r"[^a-zа-я0-9+\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def has_any(text: str, words: list[str]) -> bool:
    return any(w in text for w in words)


def is_enrollment_done(tracker: Tracker) -> bool:
    return bool(tracker.get_slot("enroll_done"))


def _append_contextual_cta(base: str, *, enrollment_done: bool = False, during_form: bool = False, cta: str = "trial") -> str:
    """Добавляет следующий шаг, но не зовёт на пробное повторно после оформленной заявки."""
    base = base.strip()

    if during_form:
        return base

    if enrollment_done:
        if cta in {"trial", "schedule", "course", "price"}:
            return base + "\n\nМенеджер уже получил заявку и напишет вам с ближайшими вариантами 🙂"
        return base

    ctas = {
        "course": "Лучше всего начать с пробного занятия: по нему будет понятно, какая группа подойдёт ребёнку. Хотите, оформлю заявку? 🙂",
        "price": "Хотите, подберём пробное по возрасту ребёнка?",
        "trial": "Хотите, оформлю заявку? 🙂",
        "schedule": "Хотите, запишу на пробное, чтобы менеджер предложил ближайшие варианты?",
    }
    tail = ctas.get(cta, "")
    return base + ("\n\n" + tail if tail else "")


def is_direct_rag_question(user_text: str) -> bool:
    q = normalize_query(user_text)
    return has_any(q, RAG_STRONG_KEYWORDS)


def looks_like_question_during_form(text: str) -> bool:
    """Понимаем, что клиент во время формы задал вопрос, а не ответил на поле формы."""
    q = normalize_query(text)
    if not q:
        return False
    markers = [
        "сколько", "цена", "стоим", "прайс", "тариф", "оплат",
        "курс", "курсы", "программ", "направлен", "робототехник",
        "пробн", "первое занят", "первый урок", "распис", "когда", "во сколько",
        "безопас", "препод", "преподав", "учител", "педагог", "наставник",
        "мисси", "ценност", "kpi", "кпи", "устав", "скид", "адрес",
        "что будет", "расскаж", "подроб", "объясн", "можно узнать",
    ]
    return has_any(q, markers) or "?" in str(text)


def answer_question_during_form(
    dispatcher: CollectingDispatcher,
    tracker: Tracker,
    question: str,
    repeat_prompt: str,
) -> None:
    """Отвечает на вопрос внутри формы и повторяет нужный вопрос формы.

    Это защищает форму от ситуации, когда фраза «А сколько стоит курс?»
    случайно записывается в слот «класс».
    """
    if handle_guardrail_if_needed(dispatcher, tracker, question):
        dispatcher.utter_message(text=repeat_prompt)
        return

    local = local_answer_for_basic_question(question, enrollment_done=is_enrollment_done(tracker), during_form=True)
    if local:
        dispatcher.utter_message(text=local)
    elif answer_question_with_rag is not None:
        answer = answer_question_with_rag(
            question,
            chat_history=get_recent_chat_history(tracker),
            enrollment_done=is_enrollment_done(tracker),
        )
        dispatcher.utter_message(text=answer)
    else:
        dispatcher.utter_message(response="utter_faq_not_found")

    dispatcher.utter_message(text=repeat_prompt)


LOCAL_COURSE_ANSWER_BASE = (
    "У нас офлайн-школа робототехники и инженерного мышления для детей 5–16 лет. "
    "Ребята не просто собирают модели по инструкции, а проходят полный цикл: придумали задачу, собрали механизм, написали программу, протестировали и исправили ошибки.\n\n"
    "Есть направления по возрасту: RoboStart для 5–7 лет, RoboJunior для 7–9, RoboEngineer для 9–12, Arduino & IoT для 11–16 и соревновательная команда для мотивированных ребят."
)

LOCAL_PRICE_ANSWER_BASE = (
    "По стоимости у нас несколько программ:\n\n"
    "• RoboStart 5–7 лет — 24 900 ₸/мес.\n"
    "• RoboJunior 7–9 лет — 34 900 ₸/мес.\n"
    "• RoboEngineer 9–12 лет — 39 900 ₸/мес.\n"
    "• Arduino & IoT 11–16 лет — 44 900 ₸/мес.\n"
    "• Competition Team — 54 900 ₸/мес.\n\n"
    "Пробное занятие стоит 2 500 ₸ и засчитывается в оплату, если купить абонемент в день пробного."
)

LOCAL_TRIAL_ANSWER_BASE = (
    "На пробном ребёнок знакомится с преподавателем и делает небольшой практический проект: собирает механизм, запускает его и пробует простую логику программирования.\n\n"
    "Занятие длится 60 минут. После него преподаватель подскажет, какая группа больше подходит по возрасту и уровню.\n\n"
    "Пробное стоит 2 500 ₸, и эта сумма засчитывается в абонемент при оплате в день пробного."
)

LOCAL_SCHEDULE_ANSWER_BASE = (
    "Занятия обычно проходят 2 раза в неделю. У младших групп формат 60 минут, у основных групп — 90 минут, у Arduino и соревновательной команды — 120 минут.\n\n"
    "Есть группы после школы и вечерние слоты. Точное время лучше подбирать по возрасту ребёнка и удобным дням."
)

LOCAL_ADDRESS_ANSWER = (
    "Демо-филиал: пр-т Абая 10, 2 этаж, вход со двора 📍\n\n"
    "Если вам удобен конкретный район или берег, менеджер подскажет ближайший вариант группы."
)

LOCAL_SAFETY_ANSWER = (
    "По безопасности всё строго: дети работают только с учебным оборудованием и под контролем наставника.\n\n"
    "Используются низковольтные цепи, инструменты выдаются после инструктажа, мелкие детали контролируются по возрасту, а младших детей передают только родителю или заранее указанному взрослому.\n\n"
    "Если есть особенности по здоровью или аллергии — это лучше сразу указать при записи, чтобы преподаватель всё учёл."
)

LOCAL_DISCOUNTS_ANSWER = (
    "По скидкам есть несколько вариантов: семейная скидка 10% на второго ребёнка и 15% на третьего.\n\n"
    "Также есть скидка при оплате на несколько месяцев вперёд: 7% за 3 месяца и 10% за 6 месяцев. Обычно скидки не суммируются между собой."
)

LOCAL_AGE_ANSWER = (
    "Берём детей примерно с 5 до 16 лет. Группу подбираем не только по возрасту, но и по уровню ребёнка.\n\n"
    "Для младших — больше игрового конструирования, для школьников постарше — механика, датчики, алгоритмы, Arduino и проекты."
)


LOCAL_MANAGER_TIME_ANSWER = (
    "Менеджер проверит расписание и напишет вам ближайшие варианты для пробного занятия.\n\n"
    "Чтобы не терять время, напишите «давайте» — я оформлю короткую заявку."
)


def is_specific_time_or_availability_question(q: str) -> bool:
    """Вопросы про конкретное свободное время нельзя закрывать общим текстом.

    Пример: «А когда пробный будет в этой неделе?» — у бота нет живого календаря,
    поэтому он должен честно передать менеджеру, а не отвечать общим описанием пробного.
    """
    if not q:
        return False

    time_markers = [
        "сегодня", "завтра", "послезавтра", "этой неделе", "на этой неделе",
        "на неделе", "в эту неделю", "ближайш", "свободн", "слот", "окно",
        "места", "место", "понедельник", "вторник", "сред", "четверг", "пятниц",
        "суббот", "воскрес", "выходн", "дата", "какое время", "во сколько",
    ]
    action_markers = [
        "пробн", "прийти", "запис", "занят", "урок", "группа", "попасть",
        "можно к вам", "можно прийти", "можно запис",
    ]

    if has_any(q, time_markers) and has_any(q, action_markers):
        return True

    direct_phrases = [
        "когда пробн", "когда будет пробн", "когда можно на проб",
        "когда можно прийти", "когда можно запис", "есть ли место",
        "есть места", "какие свободные", "ближайшее пробное",
    ]
    return has_any(q, direct_phrases)


def should_notify_manager_for_handoff(answer: str) -> bool:
    a = (answer or "").lower()
    return "менеджер" in a and any(w in a for w in ["ответ", "напиш", "провер", "уточн", "свяж"])


def notify_manager_unanswered_question(tracker: Tracker, question: str, reason: str = "manual_answer_needed") -> None:
    """Логирует, что вопрос требует ручного ответа менеджера.

    В демо для сайта внешних уведомлений нет — просто пишем в лог (notify_manager).
    """
    chat_id = tracker.sender_id or ""
    if not question:
        return

    channel, contact, transport_phone = parse_sender(chat_id)
    notify_manager(
        "❓ Вопрос клиента требует ручного ответа\n\n"
        f"Причина: {reason}\n"
        f"Вопрос: {question}\n"
        f"{_format_contact_line(channel, contact, transport_phone)}\n\n"
        "Бот не стал придумывать ответ и сообщил клиенту, что менеджер ответит."
    )


RAG_STRONG_KEYWORDS = [
    "kpi", "кпи", "мисси", "миссию", "видени", "ценност", "core value", "устав", "возврат", "замороз",
    "финансов", "экономик", "инвестици", "помещени", "оборудован", "основател", "команда",
    "наставник", "наставники", "препод", "преподав", "учител", "педагог", "юрид", "лиценз",
    "90 дней", "план запуска", "воронк", "маркетинг", "nps", "структура", "руководитель",
]

OFF_TOPIC_RESPONSE = "Я подсказываю только по школе, курсам, пробному занятию и записи 🙂"

MANAGER_UNKNOWN_ANSWER = (
    "Сейчас менеджер проверит и ответит вам точную информацию.\n\n"
    "Я передам вопрос человеку, чтобы не сказать неточно."
)

SCHOOL_SCOPE_KEYWORDS = [
    "qadam", "кадам", "роботик", "robotics", "bring ai", "bringai", "ne manager",
    "школ", "курс", "курсы", "кружок", "занят", "урок", "пробн", "ребен", "ребён", "дет", "родител",
    "робот", "робототех", "lego", "лего", "scratch", "python", "arduino", "iot", "электрон", "программ",
    "robo", "robostart", "robojunior", "roboengineer", "competition", "team",
    "цена", "стоим", "прайс", "оплат", "скид", "абонем", "тариф",
    "распис", "слот", "мест", "группа", "запис", "заявк", "набор", "адрес", "филиал", "район", "локац", "местонахожд", "берег",
    "препод", "преподав", "учител", "педагог", "наставник", "команда", "основател",
    "мисси", "видени", "цель", "ценност", "kpi", "кпи", "устав", "правил", "безопас",
    "зачисл", "критери", "пропуск", "отработ", "возврат", "замороз", "сертифик", "олимпиад", "соревн",
    "помещ", "оборуд", "инвестици", "финанс", "маркетинг", "воронк", "лиценз", "основан", "открылись", "открыли", "год основания",
]

OFF_TOPIC_KEYWORDS = [
    "эйнштейн", "einstein", "погода", "курс доллара", "биткоин", "анекдот", "стих", "песня",
    "переведи", "перевод", "домашку", "домашнее задание", "реферат", "сочини", "код напиши",
    "президент", "футбол", "новости", "политик", "кино", "фильм", "игра", "майнкрафт",
]

MANUAL_UNKNOWN_KEYWORDS = [
    "в каком году", "год основания", "когда основали", "когда основана", "когда основан",
    "когда открылись", "когда открыли", "дата открытия", "сколько лет школе", "сколько лет работает",
]


def is_simple_math_or_calculator(text: str) -> bool:
    raw = (text or "").strip()
    raw = re.sub(r"[?？]+$", "", raw).strip()
    # Например: 1+1, 25*4, 100 / 5. Такие вещи не относятся к продаже курса.
    return bool(re.fullmatch(r"[0-9\s+\-*/×÷=().,]+", raw)) and any(op in raw for op in ["+", "-", "*", "/", "×", "÷", "="])


def is_manual_unknown_question(user_text: str) -> bool:
    q = normalize_query(user_text)
    return has_any(q, MANUAL_UNKNOWN_KEYWORDS)


def is_school_related_question(user_text: str) -> bool:
    q = normalize_query(user_text)
    if not q:
        return False
    return has_any(q, SCHOOL_SCOPE_KEYWORDS)


def is_off_topic_question(user_text: str) -> bool:
    q = normalize_query(user_text)
    if not q:
        return False

    if is_simple_math_or_calculator(user_text):
        return True

    if has_any(q, OFF_TOPIC_KEYWORDS) and not is_school_related_question(user_text):
        return True

    # Общие справочные вопросы "кто такой / что такое" не должны уходить в GPT,
    # если внутри нет признаков школы, курса или робототехники.
    if q.startswith(("кто такой", "кто такая", "кто такие", "что такое", "расскажи кто", "расскажите кто")):
        return not is_school_related_question(user_text)

    # Просьбы решить/посчитать/написать что-то вне контекста школы.
    if has_any(q, ["реши", "посчитай", "сколько будет", "напиши сочин", "напиши код", "сделай перевод"]):
        return not is_school_related_question(user_text)

    return False


def handle_guardrail_if_needed(dispatcher: CollectingDispatcher, tracker: Tracker, user_text: str) -> bool:
    """Жёсткая защита: не отвечать вне темы и не угадывать неизвестные факты."""
    if is_manual_unknown_question(user_text):
        dispatcher.utter_message(text=MANAGER_UNKNOWN_ANSWER)
        notify_manager_unanswered_question(tracker, user_text, reason="вопрос требует точной ручной проверки")
        return True

    if is_off_topic_question(user_text):
        dispatcher.utter_message(text=OFF_TOPIC_RESPONSE)
        return True

    return False


def local_answer_for_basic_question(user_text: str, *, enrollment_done: bool = False, during_form: bool = False) -> str | None:
    """Быстрые ответы без OpenAI. Сначала экономим токены, потом уже RAG.

    enrollment_done=True нужен, чтобы после заявки не звать клиента на пробное повторно.
    during_form=True нужен, чтобы внутри формы отвечать на вопрос без лишних CTA.
    """
    q = normalize_query(user_text)
    if not q:
        return None

    # Внутренние/редкие вопросы лучше сразу отдавать в RAG, даже если Rasa ошибся с intent.
    if has_any(q, RAG_STRONG_KEYWORDS):
        return None

    # Конкретные слоты/наличие мест бот не должен придумывать.
    # Тут нужен менеджер или живой календарь.
    if is_specific_time_or_availability_question(q):
        return LOCAL_MANAGER_TIME_ANSWER

    if has_any(q, ["пробн", "первое занят", "первый урок", "что будет на", "как проходит проб"]):
        return _append_contextual_cta(LOCAL_TRIAL_ANSWER_BASE, enrollment_done=enrollment_done, during_form=during_form, cta="trial")

    if has_any(q, ["сколько стоит", "цена", "стоимост", "прайс", "тариф", "оплат", "в месяц", "дорого"]):
        return _append_contextual_cta(LOCAL_PRICE_ANSWER_BASE, enrollment_done=enrollment_done, during_form=during_form, cta="price")

    if has_any(q, ["расписан", "когда занят", "какие дни", "по каким дня", "во сколько", "вечер", "после школы", "сколько раз", "сколько длится", "длится урок"]):
        return _append_contextual_cta(LOCAL_SCHEDULE_ANSWER_BASE, enrollment_done=enrollment_done, during_form=during_form, cta="schedule")

    if has_any(q, ["адрес", "где находит", "где вы", "находитесь", "куда приход", "как доехать", "локац", "филиал", "в каком районе"]):
        return LOCAL_ADDRESS_ANSWER

    if has_any(q, ["безопас", "травм", "инцидент", "электрич", "инструмент", "забрать ребенка", "забирает ребенка"]):
        return LOCAL_SAFETY_ANSWER

    if has_any(q, ["скид", "акци", "семейн", "реферал", "бонус"]):
        return LOCAL_DISCOUNTS_ANSWER

    if has_any(q, ["возраст", "сколько лет", "5 лет", "6 лет", "7 лет", "8 лет", "9 лет", "10 лет", "11 лет", "12 лет", "13 лет", "14 лет", "15 лет", "16 лет"]):
        return LOCAL_AGE_ANSWER

    course_words = ["про курс", "про курсы", "расскажите про курс", "расскажи про курс", "что за курс", "какие курсы", "какие программы", "чему обуч", "направлен", "робототехник"]
    if has_any(q, course_words):
        return _append_contextual_cta(LOCAL_COURSE_ANSWER_BASE, enrollment_done=enrollment_done, during_form=during_form, cta="course")

    return None


def find_faq_answer(entries: list[dict], user_text: str, threshold: int = 82) -> tuple[str | None, int]:
    """Консервативный FAQ: не должен угадывать слишком смело и мешать RAG."""
    if not entries:
        return None, 0
    if is_manual_unknown_question(user_text) or is_off_topic_question(user_text):
        return None, 0
    questions = [str(e.get("q", "")) for e in entries]
    result = process.extractOne(query=normalize_query(user_text), choices=questions, scorer=fuzz.WRatio)
    if not result:
        return None, 0
    _match, score, idx = result
    if score < threshold:
        return None, int(score)

    answer = entries[idx].get("a", "")
    return (answer or None), int(score)


class ActionFaqSearch(Action):
    def name(self) -> Text:
        return "action_faq_search"

    def __init__(self) -> None:
        self.faq_path = PROJECT_ROOT / "data" / "faq.json"
        self.entries: list[dict] = []
        self._load_faq()

    def _load_faq(self) -> None:
        try:
            with open(self.faq_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.entries = data if isinstance(data, list) else []
            log.info("[FAQ] loaded %s entries from %s", len(self.entries), self.faq_path)
        except Exception as e:
            log.warning("[FAQ] Load error: %s", e)
            self.entries = []

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]):
        user_text = (tracker.latest_message.get("text") or "").strip()
        if not user_text:
            dispatcher.utter_message(response="utter_faq_not_found")
            return []

        if handle_guardrail_if_needed(dispatcher, tracker, user_text):
            return []

        local = local_answer_for_basic_question(user_text, enrollment_done=is_enrollment_done(tracker))
        if local:
            log.info("[LOCAL] answered basic question: %s", user_text)
            if should_notify_manager_for_handoff(local):
                notify_manager_unanswered_question(tracker, user_text, reason="точное время/наличие мест")
            dispatcher.utter_message(text=local)
            return []

        # Для миссии, KPI, преподавателей, устава и внутренних тем не даём FAQ угадывать.
        # Иначе «расскажите про миссию» может случайно совпасть с общим ответом про курс.
        direct_rag = is_direct_rag_question(user_text)

        if not direct_rag:
            # В демо удобно менять faq.json без перезапуска action server.
            self._load_faq()
            faq_answer, score = find_faq_answer(self.entries, user_text, threshold=82)
            if faq_answer:
                log.info("[FAQ] score=%s question=%s", score, user_text)
                dispatcher.utter_message(text=faq_answer)
                return []

        # Если FAQ не нашёл точный ответ, пробуем RAG по документу школы.
        if answer_question_with_rag is not None:
            log.info("[RAG] fallback for question: %s", user_text)
            answer = answer_question_with_rag(user_text, chat_history=get_recent_chat_history(tracker), enrollment_done=is_enrollment_done(tracker))
            if answer:
                if should_notify_manager_for_handoff(answer):
                    notify_manager_unanswered_question(tracker, user_text, reason="RAG не нашёл точный ответ")
                dispatcher.utter_message(text=answer)
                return []

        dispatcher.utter_message(response="utter_faq_not_found")
        return []


class ActionRagAnswer(Action):
    """Fallback action: редкие вопросы — RAG, базовые вопросы — локально без токенов."""

    def name(self) -> Text:
        return "action_rag_answer"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]):
        user_text = (tracker.latest_message.get("text") or "").strip()

        if handle_guardrail_if_needed(dispatcher, tracker, user_text):
            return []

        local = local_answer_for_basic_question(user_text, enrollment_done=is_enrollment_done(tracker))
        if local:
            log.info("[LOCAL] answered before RAG: %s", user_text)
            if should_notify_manager_for_handoff(local):
                notify_manager_unanswered_question(tracker, user_text, reason="точное время/наличие мест")
            dispatcher.utter_message(text=local)
            return []

        if answer_question_with_rag is None:
            dispatcher.utter_message(response="utter_faq_not_found")
            return []

        log.info("[RAG] using OpenAI for question: %s", user_text)
        answer = answer_question_with_rag(user_text, chat_history=get_recent_chat_history(tracker), enrollment_done=is_enrollment_done(tracker))
        if answer:
            if should_notify_manager_for_handoff(answer):
                notify_manager_unanswered_question(tracker, user_text, reason="RAG не нашёл точный ответ")
            dispatcher.utter_message(text=answer)
        else:
            dispatcher.utter_message(response="utter_faq_not_found")
        return []


class ActionSmartAnswer(Action):
    """Главный роутер ответов: сначала локально/FAQ, только потом RAG."""

    def name(self) -> Text:
        return "action_smart_answer"

    def __init__(self) -> None:
        self.faq_path = PROJECT_ROOT / "data" / "faq.json"
        self.entries: list[dict] = []
        self._load_faq()

    def _load_faq(self) -> None:
        try:
            with open(self.faq_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.entries = data if isinstance(data, list) else []
        except Exception as e:
            log.warning("[FAQ] Load error in smart answer: %s", e)
            self.entries = []

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]):
        user_text = (tracker.latest_message.get("text") or "").strip()
        if not user_text:
            dispatcher.utter_message(response="utter_faq_not_found")
            return []

        if handle_guardrail_if_needed(dispatcher, tracker, user_text):
            return []

        local = local_answer_for_basic_question(user_text, enrollment_done=is_enrollment_done(tracker))
        if local:
            log.info("[LOCAL] smart answer: %s", user_text)
            if should_notify_manager_for_handoff(local):
                notify_manager_unanswered_question(tracker, user_text, reason="точное время/наличие мест")
            dispatcher.utter_message(text=local)
            return []

        direct_rag = is_direct_rag_question(user_text)

        if not direct_rag:
            self._load_faq()
            faq_answer, score = find_faq_answer(self.entries, user_text, threshold=82)
            if faq_answer:
                log.info("[FAQ] smart answer score=%s question=%s", score, user_text)
                dispatcher.utter_message(text=faq_answer)
                return []

        if answer_question_with_rag is not None:
            log.info("[RAG] smart answer fallback: %s", user_text)
            answer = answer_question_with_rag(user_text, chat_history=get_recent_chat_history(tracker), enrollment_done=is_enrollment_done(tracker))
            if answer:
                if should_notify_manager_for_handoff(answer):
                    notify_manager_unanswered_question(tracker, user_text, reason="RAG не нашёл точный ответ")
                dispatcher.utter_message(text=answer)
                return []

        dispatcher.utter_message(response="utter_faq_not_found")
        return []
