import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: "left" | "right" | "bottom";
}

export function AppDrawer({ isOpen, onClose, title, children, side = "right" }: AppDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const slideFrom = { left: { x: "-100%" }, right: { x: "100%" }, bottom: { y: "100%" } };
  const positionClasses = {
    left: "inset-y-0 left-0 h-full w-full max-w-sm",
    right: "inset-y-0 right-0 h-full w-full max-w-sm",
    bottom: "inset-x-0 bottom-0 w-full max-h-[85vh] rounded-t-2xl",
  }[side];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/50"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={slideFrom[side]}
            animate={{ x: 0, y: 0 }}
            exit={slideFrom[side]}
            transition={{ type: "tween", duration: 0.2 }}
            className={`absolute ${positionClasses} flex flex-col bg-white p-5 shadow-card dark:bg-slate-900`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink dark:text-slate-100">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="rounded-full p-1.5 text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
