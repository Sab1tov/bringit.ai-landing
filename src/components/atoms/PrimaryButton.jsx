import React from "react";
import { motion } from "framer-motion";
import { SPRING } from "../../constants/motion";

export const PrimaryButton = ({ children, className = "", ...props }) => (
  <motion.button
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    transition={SPRING}
    className={`rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white cursor-pointer ${className}`}
    {...props}
  >
    {children}
  </motion.button>
);
