import React, { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from "lucide-react";

type ToastType = "success" | "error" | "info" | "loading";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      if (type !== "loading") {
        setTimeout(() => {
          hideToast(id);
        }, 5000);
      }
    },
    [hideToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`
                pointer-events-auto flex items-center gap-3 p-4 border-[3px] border-black shadow-[4px_4px_0px_#000] rounded-[0.5rem]
                ${toast.type === "success" ? "bg-[var(--color-blue-pop)] text-black" : ""}
                ${toast.type === "error" ? "bg-[var(--color-red-pop)] text-black" : ""}
                ${toast.type === "info" ? "bg-white text-black" : ""}
                ${toast.type === "loading" ? "bg-[var(--color-primary)] text-black" : ""}
              `}
            >
              <div className="flex-shrink-0">
                {toast.type === "success" && (
                  <CheckCircle2 className="w-6 h-6 stroke-[3px]" />
                )}
                {toast.type === "error" && <AlertCircle className="w-6 h-6 stroke-[3px]" />}
                {toast.type === "info" && <Info className="w-6 h-6 stroke-[3px]" />}
                {toast.type === "loading" && (
                  <Loader2 className="w-6 h-6 animate-spin stroke-[3px]" />
                )}
              </div>

              <div className="flex-1 text-sm font-black uppercase tracking-tight leading-tight">
                {toast.message}
              </div>

              <button
                onClick={() => hideToast(toast.id)}
                className="flex-shrink-0 p-1 hover:bg-black/10 rounded-md transition-colors border-2 border-transparent hover:border-black active:translate-y-[2px]"
              >
                <X className="w-5 h-5 stroke-[3px]" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
