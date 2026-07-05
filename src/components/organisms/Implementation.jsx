import React from "react";
import { motion } from "framer-motion";
import { SPRING } from "../../constants/motion";

const STEPS = [
  { n: "01", t: "Знакомство", d: "Смотрим ваши процессы и точки нагрузки." },
  { n: "02", t: "Сбор материалов", d: "Услуги, вопросы, правильные ответы." },
  { n: "03", t: "Настройка", d: "Собираем базу знаний и сценарии." },
  { n: "04", t: "Тестирование", d: "Проверяем ответы на реальных кейсах." },
  { n: "05", t: "Запуск", d: "Подключаем каналы и команду." },
  { n: "06", t: "Улучшение", d: "Дополняем базу по живым диалогам." },
];

const getGridItemBorderClass = (index) => {
  const classes = ["border-slate-100", "p-5", "text-left"];

  // Mobile borders (2 columns)
  const isMobileRight = index % 2 === 0;
  const isMobileBottom = index < 4;

  // Tablet borders (3 columns)
  const isTabletRight = index % 3 !== 2;
  const isTabletBottom = index < 3;

  // Desktop borders (6 columns)
  const isDesktopRight = index % 6 !== 5;

  classes.push(isMobileRight ? "border-r" : "border-r-0");
  classes.push(isMobileBottom ? "border-b" : "border-b-0");

  classes.push(isTabletRight ? "sm:border-r" : "sm:border-r-0");
  classes.push(isTabletBottom ? "sm:border-b" : "sm:border-b-0");

  classes.push(isDesktopRight ? "lg:border-r" : "lg:border-r-0");
  classes.push("lg:border-b-0");

  return classes.join(" ");
};

export const Implementation = () => (
  <section className="mx-auto max-w-6xl px-6 py-20" id="implementation">
    <div className="mb-10 text-center">
      <h2 className="text-3xl font-bold tracking-tighter text-black sm:text-4xl">
        Как проходит внедрение
      </h2>
      <p className="mt-3 text-neutral-500">
        Стартуем с простого сценария и постепенно улучшаем продукт.
      </p>
    </div>

    <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-100 sm:grid-cols-3 lg:grid-cols-6">
      {STEPS.map((s, i) => (
        <motion.div
          key={s.n}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ ...SPRING, delay: i * 0.06 }}
          className={getGridItemBorderClass(i)}
        >
          <div className="text-[11px] font-semibold tracking-wide text-slate-400">
            {s.n}
          </div>
          <div className="mt-2 text-sm font-semibold tracking-tight text-black">
            {s.t}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{s.d}</p>
        </motion.div>
      ))}
    </div>

    <div className="mt-5 flex justify-center px-4">
      <span className="inline-flex flex-wrap justify-center items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-600 text-center max-w-full">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
        Рекомендуемый старт: 10–20 частых вопросов
      </span>
    </div>
  </section>
);
