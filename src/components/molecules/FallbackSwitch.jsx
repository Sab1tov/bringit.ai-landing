import React, { useState } from "react";
import { motion } from "framer-motion";
import { SPRING } from "../../constants/motion";

export const FallbackSwitch = () => {
  const [human, setHuman] = useState(true);
  return (
    <button
      onClick={() => setHuman((v) => !v)}
      className="flex w-full items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-left cursor-pointer"
    >
      <div>
        <div className="text-[11px] font-semibold text-slate-700">
          Передать человеку
        </div>
        <div className="text-[10px] text-slate-400">
          Сложный вопрос → живой менеджер
        </div>
      </div>
      <div
        className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
          human ? "bg-blue-500 justify-end" : "bg-slate-200 justify-start"
        }`}
      >
        <motion.span
          layout
          transition={SPRING}
          className="h-4 w-4 rounded-full bg-white shadow-sm"
        />
      </div>
    </button>
  );
};
