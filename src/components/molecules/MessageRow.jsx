import React from "react";
import { motion } from "framer-motion";
import { SPRING } from "../../constants/motion";

export const MessageRow = ({ align = "left", w = "w-3/4", tint = "bg-slate-100", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...SPRING, delay }}
    className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}
  >
    <div className={`${w} rounded-lg ${tint} px-3 py-2`}>
      <div className="h-1.5 w-full rounded-full bg-white/70" />
      <div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-white/70" />
    </div>
  </motion.div>
);
