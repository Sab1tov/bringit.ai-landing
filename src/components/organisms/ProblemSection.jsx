import React from "react";
import { motion } from "framer-motion";
import { GlowCard } from "./GlowCard";
import { SPRING } from "../../constants/motion";

export const ProblemSection = () => (
  <section className="mx-auto max-w-6xl px-6 py-20" id="scenarios">
    <div className="mb-10 text-center">
      <h2 className="text-3xl font-bold tracking-tighter text-black sm:text-4xl">
        Где бизнес теряет скорость
      </h2>
      <p className="mt-3 text-neutral-500">
        Типичные узкие места, которые повторяются почти в каждой компании.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Card 1 — unread notification */}
      <GlowCard>
        {({ hovered }) => (
          <>
            <h3 className="text-sm font-semibold tracking-tight text-black">
              01 · Клиенты ждут ответа
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              Когда менеджер занят, первое сообщение может остаться без реакции
              — и интерес остывает.
            </p>
            <motion.div
              animate={{ scale: hovered ? 1.02 : 1 }}
              transition={SPRING}
              className="mt-5 flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-left"
            >
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600">
                  ЧК
                </div>
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.6 }}
                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white"
                >
                  3
                </motion.span>
              </div>
              <div className="flex-1">
                <div className="h-1.5 w-3/4 rounded-full bg-slate-200" />
                <div className="mt-1.5 h-1.5 w-1/2 rounded-full bg-slate-200" />
              </div>
              <span className="text-[10px] font-medium text-slate-400">14:02</span>
            </motion.div>
          </>
        )}
      </GlowCard>

      {/* Card 2 — lead database list */}
      <GlowCard>
        {({ hovered }) => (
          <>
            <h3 className="text-sm font-semibold tracking-tight text-black">
              02 · Заявки теряются
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              Часть вопросов повторяется, но не всегда фиксируется и доводится
              до продажи.
            </p>
            <motion.div
              animate={{ scale: hovered ? 1.02 : 1 }}
              transition={SPRING}
              className="mt-5 overflow-hidden rounded-lg border border-slate-100"
            >
              {[
                { s: "bg-emerald-400", label: "Заявка #482", tag: "в работе" },
                { s: "bg-amber-400", label: "Заявка #479", tag: "ожидает" },
                { s: "bg-slate-300", label: "Заявка #471", tag: "потеряна" },
              ].map((row, i) => (
                <div
                  key={row.label}
                  className={`flex items-center gap-2 px-3 py-2 ${
                    i !== 2 ? "border-b border-slate-100" : ""
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${row.s}`} />
                  <span className="text-[11px] font-medium text-slate-600">
                    {row.label}
                  </span>
                  <span className="ml-auto rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5 text-[9px] text-slate-400">
                    {row.tag}
                  </span>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </GlowCard>

      {/* Card 3 — routine eats time */}
      <GlowCard>
        {({ hovered }) => (
          <>
            <h3 className="text-sm font-semibold tracking-tight text-black">
              03 · Рутина съедает время
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              Сотрудники снова и снова ищут информацию, пишут шаблоны и уточняют
              правила.
            </p>
            <motion.div
              animate={{ scale: hovered ? 1.02 : 1 }}
              transition={SPRING}
              className="mt-5 space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-left"
            >
              {["Поиск регламента…", "Шаблон письма…", "Уточнение правил…"].map(
                (t, i) => (
                  <div key={t} className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 3 + i,
                        ease: "linear",
                      }}
                      className="h-3 w-3 rounded-full border border-slate-300 border-t-slate-500"
                    />
                    <span className="text-[11px] text-slate-500">{t}</span>
                  </div>
                )
              )}
            </motion.div>
          </>
        )}
      </GlowCard>
    </div>
  </section>
);
