import React from "react";
import { motion } from "framer-motion";
import { SectionLabel } from "../atoms/SectionLabel";
import { PrimaryButton } from "../atoms/PrimaryButton";
import { SecondaryButton } from "../atoms/SecondaryButton";
import { HeroMockup } from "./HeroMockup";
import { handleScrollToDemo } from "../../utils/scroll";
import { SPRING } from "../../constants/motion";

export const Hero = () => (
  <section className="relative overflow-hidden">
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-20 text-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...SPRING, delay: 0 }}
      >
        <SectionLabel>
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          Новое: NEАссистент 2.0
        </SectionLabel>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.15 }}
        className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tighter text-black sm:text-5xl md:text-6xl"
      >
        AI-инструменты для бизнеса: отвечайте быстрее, работайте легче
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.3 }}
        className="mx-auto mt-5 max-w-xl text-base text-neutral-500 sm:text-lg"
      >
        Автоматизация внешней коммуникации и повышение внутренней эффективности
        вашей команды.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.45 }}
        className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
      >
        <PrimaryButton onClick={handleScrollToDemo} className="w-full sm:w-auto">
          Попробовать NEМенеджер
        </PrimaryButton>
        <SecondaryButton onClick={handleScrollToDemo} className="w-full sm:w-auto">
          Запустить NEАссистент
        </SecondaryButton>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...SPRING, delay: 0.6 }}
        className="mx-auto mt-14 max-w-4xl"
      >
        <HeroMockup />
      </motion.div>
    </div>
  </section>
);
