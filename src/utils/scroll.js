import { animate } from "framer-motion";

export const handleScrollToDemo = () => {
  const element = document.getElementById("demo-form");
  if (!element) return;
  const targetY =
    element.getBoundingClientRect().top + window.scrollY - 96;
  animate(window.scrollY, targetY, {
    type: "spring",
    stiffness: 60,
    damping: 20,
    mass: 0.8,
    onUpdate: (latest) => window.scrollTo(0, latest),
  });
};

export const handleScrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId);
  if (!element) return;
  const targetY =
    element.getBoundingClientRect().top + window.scrollY - 96; // offset for the navbar
  animate(window.scrollY, targetY, {
    type: "spring",
    stiffness: 60,
    damping: 20,
    mass: 0.8,
    onUpdate: (latest) => window.scrollTo(0, latest),
  });
};
