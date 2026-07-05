import React from "react";
import { motion } from "framer-motion";
import { SPRING } from "../../constants/motion";

export const SolutionCard = ({ title, desc, accent, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={SPRING}
    className="flex flex-col rounded-xl border border-slate-100 bg-white p-5 text-left"
  >
    <div
      className={`mb-3 inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${accent}`}
    >
      {title}
    </div>
    <p className="mb-4 text-sm leading-relaxed text-neutral-500">{desc}</p>
    <div className="mt-auto">{children}</div>
  </motion.div>
);
