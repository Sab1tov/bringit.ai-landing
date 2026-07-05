import React, { useState } from "react";
import { motion } from "framer-motion";
import { SPRING } from "../../constants/motion";

export const FocusInput = ({ label, placeholder, value, onChange, error }) => {
  const [focused, setFocused] = useState(false);
  return (
    <label className="block text-left">
      <span className={`text-xs font-medium transition-colors ${error ? "text-red-500" : "text-slate-500"}`}>
        {label}
      </span>
      <motion.div
        animate={{ scale: focused ? 1.01 : 1 }}
        transition={SPRING}
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-300 ${
            error
              ? "border-red-400 focus:border-red-500"
              : focused
              ? "border-slate-400"
              : "border-slate-200"
          }`}
        />
      </motion.div>
    </label>
  );
};
