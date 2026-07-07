import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import logoUrl from "./assets/logo.svg"
import "./index.css"

const SPRING = { type: "spring", stiffness: 300, damping: 30 };

function ChatApp() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      text: "Здравствуйте! Я виртуальный ассистент bringAI. 🤖\n\nЯ могу рассказать вам о возможностях наших B2B SaaS продуктов:\n• **NEМенеджер** — автоответчик в WhatsApp для мгновенных ответов клиентам.\n• **NEАссистент** — умный помощник для удобной работы с базами знаний.\n\nЗадайте мне любой вопрос об интеграции, возможностях или стоимости автоматизации вашего бизнеса!",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [botUrl, setBotUrl] = useState(() => {
    return localStorage.getItem("bringai_bot_url") || "https://energetic-adaptation-production-05cd.up.railway.app/api/chat";
  });
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem("bringai_session_id") || `web_${Math.random().toString(36).substring(2, 11)}`;
  });
  const [isOnline, setIsOnline] = useState(true);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Keep track of session id and bot url in localstorage
  useEffect(() => {
    localStorage.setItem("bringai_session_id", sessionId);
  }, [sessionId]);

  useEffect(() => {
    localStorage.setItem("bringai_bot_url", botUrl);
    checkBotStatus();
  }, [botUrl]);

  const checkBotStatus = async () => {
    const targetUrl = botUrl.trim() || `${window.location.origin}/api/chat`;
    const healthUrl = targetUrl.replace("/api/chat", "/health");
    try {
      const res = await fetch(healthUrl, { method: "GET" });
      if (res.ok) {
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }
    } catch {
      setIsOnline(false);
    }
  };

  const resetSession = () => {
    const newSessionId = `web_${Math.random().toString(36).substring(2, 11)}`;
    setSessionId(newSessionId);
    setMessages([
      {
        id: "welcome_" + newSessionId,
        text: "Сессия обновлена. Здравствуйте! Я виртуальный ассистент bringAI. О чём вам рассказать сегодня?",
        isBot: true,
        timestamp: new Date(),
      },
    ]);
  };

  const handleSendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      id: `msg_${Date.now()}`,
      text: text,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    const targetApiUrl = botUrl.trim() || `${window.location.origin}/api/chat`;

    try {
      const response = await fetch(targetApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }

      const data = await response.json();
      
      if (data.session_id && data.session_id !== sessionId) {
        setSessionId(data.session_id);
      }

      const replies = data.replies && data.replies.length 
        ? data.replies 
        : ["Сервер не вернул текстового ответа."];

      setMessages((prev) => [
        ...prev,
        ...replies.map((replyText, idx) => ({
          id: `reply_${Date.now()}_${idx}`,
          text: replyText,
          isBot: true,
          timestamp: new Date(),
        })),
      ]);
      setIsOnline(true);
    } catch (error) {
      console.error("Chat API error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          text: `⚠️ Ошибка соединения с чат-ботом.\n\nУбедитесь, что ваш бэкенд на Railway запущен и адрес указан верно в панели настроек.\n\nТекущий адрес запроса: \`${targetApiUrl}\``,
          isBot: true,
          timestamp: new Date(),
          isError: true,
        },
      ]);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    "Каковы цены на продукты?",
    "Что такое NEМенеджер?",
    "Что умеет NEАссистент?",
    "Как интегрировать WhatsApp?",
  ];

  return (
    <div className="relative h-screen max-h-screen bg-white font-sans text-slate-800 flex flex-col overflow-hidden">
      {/* Structural background grid from main page */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,23,42,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.02) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Header matching main Nav */}
      <header className="relative z-10 border-b border-slate-100 bg-white/80 backdrop-blur-md px-6 py-4 md:py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="/"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-500 hover:text-black font-semibold"
            title="На главную"
          >
            ←
          </motion.a>
          <a href="/" className="flex items-center">
            <img src={logoUrl} alt="bringAI Logo" className="h-8 md:h-12 w-auto" />
          </a>
          <div className="h-6 w-[1px] bg-slate-200 hidden sm:block" />
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Тест-драйв ИИ
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              <span className="text-[11px] text-slate-500 font-medium">
                {isOnline ? "Бот в сети" : "Бот не отвечает"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row relative z-10 overflow-hidden">
        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-slate-50/20 relative">


          {/* Chat log */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${
                      msg.isBot ? "flex-row" : "flex-row-reverse"
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold border ${
                      msg.isBot
                        ? "bg-[#4B58C1]/10 border-[#4B58C1]/20 text-[#4B58C1]"
                        : "bg-black border-slate-800 text-white"
                    }`}>
                      {msg.isBot ? "🤖" : "👤"}
                    </div>

                    {/* Message Bubble - Bot matches the warm cream color --color-brand-cream (#F6F4EF) */}
                    <div
                      className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
                        msg.isBot
                          ? msg.isError
                            ? "bg-rose-50 border border-rose-100 text-rose-800"
                            : "bg-[#F6F4EF] text-slate-900 border border-[#ECEAE3]"
                          : "bg-black text-white rounded-tr-none"
                      }`}
                    >
                      {msg.text.split("\n").map((line, lIdx) => {
                        // Very simple markdown bold helper
                        const parts = line.split("**");
                        return (
                          <p key={lIdx} className={lIdx > 0 ? "mt-2" : ""}>
                            {parts.map((part, pIdx) =>
                              pIdx % 2 === 1 ? <strong key={pIdx} className="font-bold text-black">{part}</strong> : part
                            )}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-[#4B58C1]/10 border-[#4B58C1]/20 flex items-center justify-center text-xs text-[#4B58C1]">
                      🤖
                    </div>
                    <div className="bg-[#F6F4EF] border border-[#ECEAE3] rounded-2xl px-4 py-3.5 flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-[#4B58C1] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-[#4B58C1] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-[#4B58C1] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Prompts Container */}
          {messages.length === 1 && !isLoading && (
            <div className="px-4 py-2 border-t border-slate-100 max-w-3xl mx-auto w-full">
              <p className="text-xs text-slate-400 mb-2 font-medium">Частые вопросы:</p>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((prompt, idx) => (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-xs bg-transparent hover:bg-slate-50 text-slate-600 hover:text-black border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-all text-left cursor-pointer font-semibold"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <div className="p-4 md:p-6 border-t border-slate-100 bg-white/80 backdrop-blur-md">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="max-w-3xl mx-auto flex gap-3"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Спросите о продуктах bringAI..."
                className="flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl px-4 py-3.5 text-sm text-slate-800 outline-none transition-all shadow-sm"
                disabled={isLoading}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="bg-black hover:bg-slate-800 disabled:bg-slate-350 disabled:opacity-50 text-white font-semibold px-5 py-3.5 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer text-sm"
              >
                Отправить
              </motion.button>
            </form>
            <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
              Демо-версия ассистента bringAI на базе искусственного интеллекта.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("chat-root");
if (rootElement) {
  createRoot(rootElement).render(<ChatApp />);
}
