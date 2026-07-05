import logoUrl from "../../assets/logo.svg"
import { handleScrollToDemo, handleScrollToSection } from "../../utils/scroll"
import { PrimaryButton } from "../atoms/PrimaryButton"

const NAV_ITEMS = [
  { id: "products", label: "Продукты" },
  { id: "scenarios", label: "Сценарии" },
  { id: "implementation", label: "Внедрение" },
];

export const Nav = () => (
  <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
    <div className="mx-auto flex h-16 md:h-24 max-w-6xl items-center justify-between px-6">
      <a href="#" className="flex items-center">
        <img src={logoUrl} alt="bringAI Logo" className="h-10 md:h-16 w-auto" />
      </a>
      <nav className="hidden items-center gap-10 md:flex">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              handleScrollToSection(item.id);
            }}
            className="text-[17px] font-semibold text-slate-600 transition-colors hover:text-black"
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <PrimaryButton onClick={handleScrollToDemo} className="px-4 py-2.5 text-xs sm:text-sm md:px-6 md:py-3 md:text-[15px]">
          Запросить Демо
        </PrimaryButton>
      </div>
    </div>
  </header>
);
