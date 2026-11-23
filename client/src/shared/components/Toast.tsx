import { toast as sonnerToast } from "sonner";

/**
 * Toast notification dispatcher powered by Sonner.
 * Compatible with existing toast("ok" | "err" | "info", message) calls.
 */
export const toast = (kind: "ok" | "err" | "info", message: string) => {
  if (kind === "ok") {
    sonnerToast.success(message);
  } else if (kind === "err") {
    sonnerToast.error(message);
  } else {
    sonnerToast.info(message);
  }
};

export const useToast = () => toast;
