"use client";

import { AnimatePresence, motion } from "motion/react";

export function FormMessage({ message, tone = "error" }: { message?: string; tone?: "error" | "info" }) {
  return (
    <AnimatePresence initial={false}>
      {message ? (
        <motion.p
          key={message}
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={tone === "error" ? "rounded-xl bg-almagra/10 px-3.5 py-3 text-sm text-almagra" : "rounded-xl bg-muted px-3.5 py-3 text-sm"}
        >
          {message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}
