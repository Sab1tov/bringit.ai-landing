import React, { useState, useEffect } from "react";

export const TypewriterBlock = ({ text }) => {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i += 3;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 12);
    return () => clearInterval(id);
  }, [text]);
  return (
    <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-slate-600">
      {shown}
      {shown.length < text.length && (
        <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-indigo-400 align-middle" />
      )}
    </pre>
  );
};
