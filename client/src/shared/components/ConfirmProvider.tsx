import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { Modal } from "./Modal";

export interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: "default" | "danger";
}
type Confirm = (o: ConfirmOptions) => Promise<boolean>;

const Ctx = createContext<Confirm>(async () => false);
/** `const confirm = useConfirm(); if (await confirm({ title: "…" })) { … }` — replaces window.confirm. */
export const useConfirm = () => useContext(Ctx);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ opts: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);
  const confirm = useCallback<Confirm>((opts) => new Promise((resolve) => setState({ opts, resolve })), []);
  const settle = (v: boolean) => { state?.resolve(v); setState(null); };
  const o = state?.opts;

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <Modal
        open={!!state}
        onClose={() => settle(false)}
        title={o?.title ?? ""}
        size="sm"
        footer={<>
          <button className="btn" data-autofocus onClick={() => settle(false)}>{o?.cancelText ?? "Keep it"}</button>
          <button className={`btn ${o?.tone === "danger" ? "danger" : "primary"}`} onClick={() => settle(true)}>{o?.confirmText ?? "Confirm"}</button>
        </>}
      >
        <div className="confirm-body">
          <span className={`confirm-icon flex items-center justify-center ${o?.tone === "danger" ? "danger" : ""}`} aria-hidden>
            {o?.tone === "danger" ? (
              <AlertTriangle className="w-5 h-5 text-[var(--accent)]" />
            ) : (
              <HelpCircle className="w-5 h-5 text-[var(--muted)]" />
            )}
          </span>
          <div>{o?.message}</div>
        </div>
      </Modal>
    </Ctx.Provider>
  );
}
