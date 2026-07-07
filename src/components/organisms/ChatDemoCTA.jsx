import React from "react";
import { motion } from "framer-motion";
import { SectionLabel } from "../atoms/SectionLabel";
import { PrimaryButton } from "../atoms/PrimaryButton";
import { SPRING } from "../../constants/motion";

export const ChatDemoCTA = () => (
  <section className="border-t border-slate-100 bg-[#F6F4EF]/20 py-20">
    <div className="mx-auto max-w-6xl px-6 grid grid-cols-1 md:grid-cols-12 gap-12 items-center text-left">
      
      {/* Left Text details */}
      <div className="md:col-span-7 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={SPRING}
        >
          <SectionLabel>
            <span className="h-1.5 w-1.5 rounded-full bg-[#4B58C1]" />
            Интерактивный тест-драйв
          </SectionLabel>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...SPRING, delay: 0.1 }}
          className="text-3xl font-bold tracking-tighter text-black sm:text-4xl"
        >
          Оцените работу нашего ИИ в реальном времени
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...SPRING, delay: 0.2 }}
          className="text-base text-neutral-500 sm:text-lg leading-relaxed"
        >
          Запустили демонстрационную версию умного ассистента прямо на сайте. Задайте ему любые вопросы о продуктах bringAI, тарифах, сроках внедрения или попросите записать вас на встречу. Посмотрите, как работает RAG-база знаний и автоответчик.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...SPRING, delay: 0.3 }}
          className="pt-2"
        >
          <a href="/chat.html" className="inline-block w-full sm:w-auto">
            <PrimaryButton className="w-full sm:w-auto justify-center">
              Открыть чат с ассистентом →
            </PrimaryButton>
          </a>
        </motion.div>
      </div>

      {/* Right Mock Dialog Visualization */}
      <div className="md:col-span-5 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={SPRING}
          className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-md flex flex-col gap-4 relative"
        >
          {/* Chat header */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-800">bringAI Demo Bot</span>
            <span className="text-[10px] text-slate-400 ml-auto">тест-драйв</span>
          </div>

          {/* Chat flow bubbles */}
          <div className="space-y-3.5 text-xs">
            {/* User message */}
            <div className="flex justify-end">
              <div className="bg-black text-white px-3 py-2.5 rounded-2xl rounded-tr-none max-w-[85%] font-medium">
                Как быстро вы подключаете WhatsApp?
              </div>
            </div>

            {/* Bot message */}
            <div className="flex justify-start items-start gap-2">
              <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center bg-[#4B58C1]/10 text-[#4B58C1] border border-[#4B58C1]/20 font-bold text-[9px]">
                🤖
              </div>
              <div className="bg-[#F6F4EF] text-slate-800 border border-[#ECEAE3] px-3 py-2.5 rounded-2xl rounded-tl-none max-w-[85%] leading-relaxed font-medium">
                Мы запускаем <strong>NEМенеджер</strong> всего за <strong>1 день</strong>. За это время собираем вашу базу ответов и подключаем WhatsApp.
              </div>
            </div>

            {/* User message 2 */}
            <div className="flex justify-end">
              <div className="bg-black text-white px-3 py-2.5 rounded-2xl rounded-tr-none max-w-[85%] font-medium">
                А какая стоимость?
              </div>
            </div>

            {/* Bot message 2 */}
            <div className="flex justify-start items-start gap-2">
              <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center bg-[#4B58C1]/10 text-[#4B58C1] border border-[#4B58C1]/20 font-bold text-[9px]">
                🤖
              </div>
              <div className="bg-[#F6F4EF] text-slate-800 border border-[#ECEAE3] px-3 py-2.5 rounded-2xl rounded-tl-none max-w-[85%] leading-relaxed font-medium">
                У нас есть три тарифа в зависимости от объема обращений. Напишите мне <em>«тарифы»</em> в чате, чтобы получить подробный прайс-лист.
              </div>
            </div>
          </div>
        </motion.div>

        {/* Decorative subtle circles in background */}
        <div className="absolute -z-10 -bottom-6 -left-6 w-20 h-20 rounded-full bg-indigo-50/50 border border-indigo-100/30" />
        <div className="absolute -z-10 -top-6 -right-6 w-16 h-16 rounded-full bg-brand-cream border border-brand-cream-dark/50" />
      </div>

    </div>
  </section>
);
