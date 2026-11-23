import type { ReactNode } from "react";

export const Loading = ({ label = "Loading…" }: { label?: string }) => (
  <div className="state" role="status"><span className="spinner" /> {label}</div>
);

export const ErrorState = ({ error, retry }: { error: Error; retry?: () => void }) => (
  <div className="state error" role="alert">
    <strong>Something went wrong.</strong>
    <p>{error.message}</p>
    {retry && <button className="btn" onClick={retry}>Try again</button>}
  </div>
);

export const Empty = ({ title, children }: { title: string; children?: ReactNode }) => (
  <div className="state"><strong>{title}</strong>{children && <p>{children}</p>}</div>
);
