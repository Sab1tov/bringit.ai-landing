import React from "react";

export const SectionLabel = ({ children }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
    {children}
  </span>
);
