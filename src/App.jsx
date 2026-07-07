import { Analytics } from "@vercel/analytics/react"
import { Home } from "./pages/Home"

export default function BringAILanding() {
  return (
    <div className="relative min-h-screen bg-white font-sans text-black antialiased">
      {/* ultra-faint structural background grid */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,23,42,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.03) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      <Analytics />
      <div className="relative z-10">
        <Home />
      </div>
    </div>
  );
}
