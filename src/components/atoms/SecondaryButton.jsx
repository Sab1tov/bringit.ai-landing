import React from "react";
import { motion } from "framer-motion";
import { SPRING } from "../../constants/motion";

export const SecondaryButton = ({ children, className = "", ...props }) => (
  <motion.button
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    transition={SPRING}
    className={`rounded-xl border border-slate-200 bg-transparent px-5 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-300 cursor-pointer ${className}`}
    {...props}
  >
    {children}
  </motion.button>
);
