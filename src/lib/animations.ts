import { Variants } from "framer-motion";

const EASE_OUT_EXPO: number[] = [0.16, 1, 0.3, 1];
const EASE_IN_OUT_CUBIC: number[] = [0.65, 0, 0.35, 1];

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12, filter: "blur(4px)" },
  animate: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.5, ease: EASE_OUT_EXPO, staggerChildren: 0.06 },
  },
  exit: { opacity: 0, y: -8, filter: "blur(2px)", transition: { duration: 0.3, ease: EASE_IN_OUT_CUBIC } },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export const staggerContainerFast: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: EASE_OUT_EXPO } },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT_EXPO } },
};

export const cardVariant: Variants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE_OUT_EXPO } },
};

export const cardHover = {
  scale: 1.015, y: -2,
  transition: { type: "spring", stiffness: 300, damping: 30 },
};

export const cardTap = { scale: 0.985, transition: { duration: 0.1 } };

export const tableRowVariant: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE_OUT_EXPO } },
};

export const sidebarItemVariant: Variants = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE_OUT_EXPO } },
};

export const sidebarSubMenuVariant: Variants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto", transition: { duration: 0.3, ease: EASE_IN_OUT_CUBIC } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2, ease: EASE_IN_OUT_CUBIC } },
};

export const counterVariant: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO, delay: 0.2 } },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
};
