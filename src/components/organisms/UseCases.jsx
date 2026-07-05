import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TypewriterBlock } from "../molecules/TypewriterBlock";
import { SPRING } from "../../constants/motion";

const USE_CASES = [
  {
    prompt: "Подготовь сообщение клиенту",
    heading: "Аккуратный текст в нужном стиле",
    body:
      "Здравствуйте, Алексей!\n\nСпасибо за обращение. Подтверждаем вашу заявку №482 — специалист свяжется с вами сегодня до 17:00.\n\nЕсли удобнее другое время, просто ответьте на это сообщение.\n\nС уважением,\nкоманда bringAI",
  },
  {
    prompt: "Объясни порядок работы с заявкой",
    heading: "Процесс по шагам простым языком",
    body:
      "1. Заявка попадает в общий список и получает номер.\n2. Ответственный менеджер берёт её в работу в течение 15 минут.\n3. Клиенту уходит подтверждение с ожидаемым сроком.\n4. После выполнения статус меняется на «Закрыта».\n5. Через день клиент получает вопрос об оценке.",
  },
  {
    prompt: "Найди информацию по услуге",
    heading: "Точная выжимка из базы знаний",
    body:
      "Услуга: расширенная поддержка.\n\n• Включает: приоритетные ответы, выделенного специалиста, отчёт раз в месяц.\n• Срок подключения: 1 рабочий день.\n• Ограничение: не распространяется на доработки интеграций.\n\nИсточник: «Каталог услуг», раздел 4.2.",
  },
];

export const UseCases = () => {
  const [active, setActive] = useState(0);
  const current = USE_CASES[active];

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tighter text-black sm:text-4xl">
          Примеры задач для NEАссистента
        </h2>
        <p className="mt-3 text-neutral-500">
          Сотрудник пишет запрос — ассистент быстро даёт основу результата.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-100 p-4 md:grid-cols-[280px_1fr]">
        {/* left: prompts */}
        <div className="flex flex-col gap-2">
          {USE_CASES.map((c, i) => (
            <button
              key={c.prompt}
              onClick={() => setActive(i)}
              className={`relative rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors cursor-pointer ${
                i === active
                  ? "border-slate-200 text-black"
                  : "border-slate-100 text-slate-500 hover:border-slate-200 hover:text-slate-800"
              }`}
            >
              {i === active && (
                <motion.span
                  layoutId="promptGlow"
                  transition={SPRING}
                  className="absolute inset-0 rounded-xl bg-slate-50"
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    i === active ? "bg-indigo-500" : "bg-slate-300"
                  }`}
                />
                {c.prompt}
              </span>
            </button>
          ))}
        </div>

        {/* right: editor-style outcome */}
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-200" />
              <span className="h-2 w-2 rounded-full bg-slate-200" />
              <span className="h-2 w-2 rounded-full bg-slate-200" />
            </div>
            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
              NEАссистент · результат
            </span>
          </div>
          <div className="p-5 text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRING}
              >
                <div className="mb-3 text-xs font-semibold tracking-tight text-black">
                  {current.heading}
                </div>
                <TypewriterBlock text={current.body} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
