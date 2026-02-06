"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import React from "react";

// ─── Variants ────────────────────────────────────────────────────────────────

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, y: 12, transition: { duration: 0.15 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

// ─── Page transition wrapper ────────────────────────────────────────────────

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated list ──────────────────────────────────────────────────────────

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedListItemProps {
  children: React.ReactNode;
  className?: string;
  layoutId?: string;
}

export function AnimatedListItem({
  children,
  className,
  layoutId,
}: AnimatedListItemProps) {
  return (
    <motion.div variants={staggerItem} layout layoutId={layoutId} className={className}>
      {children}
    </motion.div>
  );
}

// ─── AnimatePresence list (for add/remove) ──────────────────────────────────

interface AnimatedPresenceListProps {
  children: React.ReactNode;
}

export function AnimatedPresenceList({ children }: AnimatedPresenceListProps) {
  return <AnimatePresence mode="popLayout">{children}</AnimatePresence>;
}

interface AnimatedPresenceItemProps {
  children: React.ReactNode;
  itemKey: string;
  className?: string;
}

export function AnimatedPresenceItem({
  children,
  itemKey,
  className,
}: AnimatedPresenceItemProps) {
  return (
    <motion.div
      key={itemKey}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Fade wrapper (generic) ─────────────────────────────────────────────────

interface FadeProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Fade({ show, children, className }: FadeProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={fadeIn}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Scale in/out (for dialogs, cards) ──────────────────────────────────────

interface ScaleInProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ScaleIn({ show, children, className }: ScaleInProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={scaleIn}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Re-export for convenience
export { AnimatePresence, motion };
