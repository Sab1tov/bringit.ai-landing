import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SolutionCard } from "./SolutionCard";
import { FallbackSwitch } from "../molecules/FallbackSwitch";
import { SPRING } from "../../constants/motion";

const ManagerView = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
    <SolutionCard
      title="WhatsApp-бот"
      accent="border-blue-100 bg-blue-50 text-blue-600"
      desc="Отвечает клиентам мгновенно, в любое время — первый контакт никогда не теряется."
    >
      <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
        <div className="ml-auto w-4/5 rounded-lg bg-blue-500/90 px-2.5 py-1.5">
          <div className="h-1.5 rounded-full bg-white/70" />
        </div>
        <div className="w-3/5 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-100">
          <div className="h-1.5 rounded-full bg-slate-200" />
        </div>
      </div>
    </SolutionCard>

    <SolutionCard
      title="База знаний"
      accent="border-blue-100 bg-blue-50 text-blue-600"
      desc="Ответы строятся на ваших материалах: услуги, цены, условия — без выдумок."
    >
      <div className="space-y-1.5">
        {["Каталог услуг", "Условия доставки", "Частые вопросы"].map((s) => (
          <div
            key={s}
            className="flex items-center gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5 text-left"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span className="text-[11px] text-slate-600">{s}</span>
            <span className="ml-auto text-[10px] text-slate-400">→ ответ</span>
          </div>
        ))}
      </div>
    </SolutionCard>

    <SolutionCard
      title="Human fallback"
      accent="border-blue-100 bg-blue-50 text-blue-600"
      desc="Если вопрос нестандартный — диалог мгновенно передаётся живому сотруднику."
    >
      <FallbackSwitch />
    </SolutionCard>
  </div>
);

const AssistantView = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
    <SolutionCard
      title="Генерация текста"
      accent="border-indigo-100 bg-indigo-50 text-indigo-600"
      desc="Черновики писем, ответов и описаний — в нужном тоне за секунды."
    >
      <div className="rounded-lg border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-3">
        <div className="h-1.5 w-full rounded-full bg-indigo-100" />
        <div className="mt-1.5 h-1.5 w-5/6 rounded-full bg-indigo-100" />
        <div className="mt-1.5 h-1.5 w-1/2 rounded-full bg-indigo-100" />
        <div className="mt-2.5 text-[10px] font-medium text-indigo-500">
          Черновик готов · 2.1 c
        </div>
      </div>
    </SolutionCard>

    <SolutionCard
      title="Обработка регламентов"
      accent="border-indigo-100 bg-indigo-50 text-indigo-600"
      desc="Загрузите инструкции и SOP — ассистент превратит их в понятные ответы."
    >
      <div className="space-y-1.5">
        {["SOP_продажи.txt", "Инструкция_склад.pdf"].map((f) => (
          <div
            key={f}
            className="flex items-center gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5 text-left"
          >
            <span className="h-4 w-4 rounded border border-indigo-100 bg-indigo-50" />
            <span className="text-[11px] text-slate-600">{f}</span>
            <span className="ml-auto text-[10px] text-indigo-500">✓</span>
          </div>
        ))}
      </div>
    </SolutionCard>

    <SolutionCard
      title="Мгновенный FAQ"
      accent="border-indigo-100 bg-indigo-50 text-indigo-600"
      desc="Сотрудник спрашивает — получает точный ответ по внутренним правилам."
    >
      <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-left">
        <div className="text-[11px] font-medium text-slate-700">
          «Как оформить возврат?»
        </div>
        <div className="rounded-lg border border-indigo-100 bg-white p-2">
          <div className="h-1.5 w-full rounded-full bg-indigo-100" />
          <div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-indigo-100" />
        </div>
      </div>
    </SolutionCard>
  </div>
);

export const ProductSwitch = () => {
  const [tab, setTab] = useState("manager");
  const tabs = [
    { id: "manager", short: "NEМенеджер", full: "Внешняя коммуникация (NEМенеджер)" },
    { id: "assistant", short: "NEАссистент", full: "Внутренняя эффективность (NEАссистент)" },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-20" id="products">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tighter text-black sm:text-4xl">
          Два продукта — две стороны бизнеса
        </h2>
        <p className="mt-3 text-neutral-500">
          Выбираем решение по тому, где сейчас главная нагрузка.
        </p>
      </div>

      {/* segmented toggle */}
      <div className="mb-10 flex justify-center">
        <div className="flex rounded-xl border border-slate-100 bg-slate-50/80 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative rounded-lg px-4 py-2 text-xs font-semibold transition-colors sm:text-sm cursor-pointer ${
                tab === t.id ? "text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="activePill"
                  transition={SPRING}
                  className="absolute inset-0 rounded-lg bg-black"
                />
              )}
              <span className="relative z-10 hidden sm:inline">{t.full}</span>
              <span className="relative z-10 inline sm:hidden">{t.short}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={SPRING}
        >
          {tab === "manager" ? <ManagerView /> : <AssistantView />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};
