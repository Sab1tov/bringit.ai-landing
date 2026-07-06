import React from "react";
import { motion } from "framer-motion";
import { MessageRow } from "../molecules/MessageRow";
import { SPRING } from "../../constants/motion";

export const HeroMockup = () => (
  <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
    {/* window chrome */}
    <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
      <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
      <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
      <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
      <div className="mx-auto flex h-6 w-64 items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-[10px] text-slate-400">
        app.bringai.it.com
      </div>
    </div>

    <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
      {/* Left: WhatsApp automation threads */}
      <div className="p-5 text-left">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-bold text-white">
              W
            </span>
            <span className="text-xs font-semibold tracking-tight text-slate-800">
              NEМенеджер · WhatsApp
            </span>
          </div>
          <span className="flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
            онлайн
          </span>
        </div>
        <div className="space-y-2.5">
          <MessageRow align="left" w="w-3/5" tint="bg-slate-100" delay={0.8} />
          <MessageRow align="right" w="w-4/5" tint="bg-blue-500/90" delay={1.0} />
          <MessageRow align="left" w="w-1/2" tint="bg-slate-100" delay={1.2} />
          <MessageRow align="right" w="w-2/3" tint="bg-blue-500/90" delay={1.4} />
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-medium text-slate-500">
            Ответ отправлен за 3 секунды
          </span>
        </div>
      </div>

      {/* Right: internal documentation synthesis */}
      <div className="p-5 text-left">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-[10px] font-bold text-white">
              A
            </span>
            <span className="text-xs font-semibold tracking-tight text-slate-800">
              NEАссистент · База знаний
            </span>
          </div>
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
            синтез
          </span>
        </div>
        <div className="space-y-2">
          {["Регламент заявок.pdf", "Прайс услуг.xlsx", "FAQ клиентов.docx"].map(
            (doc, i) => (
              <motion.div
                key={doc}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...SPRING, delay: 0.9 + i * 0.15 }}
                className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2"
              >
                <span className="h-5 w-5 rounded-md border border-indigo-100 bg-indigo-50" />
                <span className="text-[11px] text-slate-600">{doc}</span>
                <span className="ml-auto text-[10px] text-indigo-500">✓ индекс</span>
              </motion.div>
            )
          )}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 1.5 }}
          className="mt-3 rounded-lg border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-3"
        >
          <div className="mb-1.5 text-[10px] font-semibold text-indigo-600">
            Готовый ответ
          </div>
          <div className="h-1.5 w-full rounded-full bg-indigo-100" />
          <div className="mt-1.5 h-1.5 w-5/6 rounded-full bg-indigo-100" />
          <div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-indigo-100" />
        </motion.div>
      </div>
    </div>
  </div>
);
