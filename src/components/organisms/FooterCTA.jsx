import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FocusInput } from "../atoms/FocusInput";
import { SPRING } from "../../constants/motion";
import logoUrl from "../../assets/logo.svg";

const DEMO_CHECKLIST = [
  "Описание услуг или товаров",
  "Частые вопросы клиентов / сотрудников",
  "Готовность футера вашего сайта по требованиям Meta*",
];

export const FooterCTA = () => {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [sent, setSent] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEmail = (val) => val.includes("@");
  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const isValidPhone = (val) => {
    const digits = val.replace(/\D/g, "");
    return digits.length >= 9 && digits.length <= 15;
  };

  const isContactValid = !contact.trim() || (isEmail(contact) ? isValidEmail(contact) : isValidPhone(contact));

  const nameError = triedSubmit && !name.trim();
  const contactError = triedSubmit && (!contact.trim() || !isContactValid);

  const handleSubmit = async () => {
    setTriedSubmit(true);
    if (name.trim() && contact.trim() && isContactValid) {
      setLoading(true);
      const sheetUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL || "";

      let formattedContact = contact.trim();
      if (formattedContact.startsWith("+7")) {
        formattedContact = "8" + formattedContact.slice(2);
      }

      if (sheetUrl) {
        try {
          const formData = new FormData();
          formData.append("name", name.trim());
          formData.append("contact", formattedContact);
          formData.append("date", new Date().toLocaleString("ru-RU"));

          await fetch(sheetUrl, {
            method: "POST",
            mode: "no-cors",
            body: formData,
          });
        } catch (error) {
          console.error("Error submitting to Google Sheets:", error);
        }
      } else {
        console.warn("VITE_GOOGLE_SHEETS_URL is not set. Logged data:", { name, contact: formattedContact });
      }

      setLoading(false);
      setSent(true);
    }
  };

  return (
    <section className="border-t border-slate-100 bg-slate-50/30">
      <div className="mx-auto max-w-6xl px-6 pb-12 pt-24">
        {/* ---- Final demo conversion zone ---- */}
        <div
          id="demo-form"
          className="relative scroll-mt-28 overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-b from-slate-50/80 to-indigo-50/30 p-8 sm:p-12 shadow-xs"
        >
          {/* Decorative glowing blob */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-200/20 blur-3xl" />
          
          <div className="relative z-10 grid grid-cols-1 gap-10 md:grid-cols-2">
            {/* Left: checklist summary */}
            <div className="text-left flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tighter text-black sm:text-4xl">
                  Что нужно для запуска демо?
                </h2>
                <p className="mt-3 text-sm text-slate-500">
                  Предоставьте базовые материалы, и мы настроим рабочую демонстрационную версию на ваших реальных примерах в кратчайшие сроки.
                </p>
                <ul className="mt-8 space-y-4">
                  {DEMO_CHECKLIST.map((item, i) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ ...SPRING, delay: i * 0.08 }}
                      className="flex items-start gap-3.5 text-sm font-medium text-slate-700"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-indigo-100 bg-indigo-50 text-[10px] font-bold text-indigo-600 shadow-xs">
                        ✓
                      </span>
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: action form */}
            <div className="flex flex-col justify-center bg-white/40 backdrop-blur-xs rounded-2xl border border-slate-100/50 p-6 shadow-xs">
              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={SPRING}
                    className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-6 text-center"
                  >
                    <div className="text-sm font-bold text-indigo-700">
                      Заявка отправлена успешно
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-indigo-600 font-medium">
                      Наш специалист свяжется с вами через WhatsApp или Email в течение рабочего дня.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    exit={{ opacity: 0, y: -6 }}
                    transition={SPRING}
                  >
                    <FocusInput
                      label="Имя / Название компании"
                      placeholder="Алексей · ТОО «Пример»"
                      value={name}
                      onChange={setName}
                      error={nameError}
                    />
                    <div className="mt-4">
                      <FocusInput
                        label="WhatsApp / Email для связи"
                        placeholder="+7 700 000 00 00"
                        value={contact}
                        onChange={setContact}
                        error={contactError}
                      />
                    </div>
                    {triedSubmit && nameError && (
                      <div className="mt-3 text-left text-xs font-semibold text-red-500">
                        Пожалуйста, укажите ваше имя или название компании.
                      </div>
                    )}
                    {triedSubmit && !nameError && contactError && (
                      <div className="mt-3 text-left text-xs font-semibold text-red-500">
                        {!contact.trim()
                          ? "Пожалуйста, укажите контактные данные."
                          : "Пожалуйста, введите корректный email или номер телефона (например, +7 700 000 00 00)."}
                      </div>
                    )}
                    <motion.button
                      whileHover={loading ? {} : { scale: 1.01, translateY: -1 }}
                      whileTap={loading ? {} : { scale: 0.99, translateY: 0 }}
                      transition={SPRING}
                      onClick={handleSubmit}
                      disabled={loading}
                      className={`mt-6 w-full rounded-xl px-5 py-4 text-[15px] font-semibold text-white shadow-md transition-colors cursor-pointer ${
                        loading
                          ? "bg-slate-400 cursor-not-allowed shadow-none"
                          : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                      }`}
                    >
                      {loading ? "Отправка..." : "Запустить демо на ваших примерах"}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ---- Corporate site footer structure ---- */}
        <div className="mt-20 grid grid-cols-1 gap-10 border-t border-slate-100 pt-16 sm:grid-cols-2 md:grid-cols-3 text-left">
          {/* Column 1: Brand & Logo */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <img src={logoUrl} alt="bringAI Logo" className="h-8 w-auto" />
              <span className="font-bold tracking-tight text-black text-lg">bringAI</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400 max-w-xs">
              bringAI — современные B2B SaaS инструменты для автоматизации коммуникаций, мгновенных ответов в WhatsApp и удобной работы с базами знаний.
            </p>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Навигация</h3>
            <ul className="space-y-2.5 text-xs text-slate-500 font-medium">
              <li>
                <a href="#products" className="transition-colors hover:text-black">Продукты</a>
              </li>
              <li>
                <a href="#scenarios" className="transition-colors hover:text-black">Сценарии</a>
              </li>
              <li>
                <a href="#implementation" className="transition-colors hover:text-black">Внедрение</a>
              </li>
              <li>
                <a href="#demo-form" className="transition-colors hover:text-black">Запросить демо</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Address */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Реквизиты и контакты</h3>
            <div className="flex flex-col gap-2.5 text-xs text-slate-500 leading-relaxed font-medium">
              <p>
                <span className="text-slate-400">Компания:</span> ИП "NAE"
              </p>
              <p>
                <span className="text-slate-400">Адрес:</span> Казахстан, Алматинская область, город Алматы, микрорайон Нуркент, дом 71, офис/кв 70
              </p>
            </div>
          </div>
        </div>

        {/* ---- Final bottom row (Copyright & Privacy Policy link) ---- */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row text-xs text-slate-400 font-medium">
          <span>© 2026 bringAI. Все права защищены.</span>
          <a
            href="/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-transparent decoration-1 underline-offset-4 transition-colors hover:text-black hover:decoration-slate-900"
          >
            Политика конфиденциальности
          </a>
        </div>
      </div>
    </section>
  );
};
