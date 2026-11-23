import { Flame, Zap } from "lucide-react";

export const StatusBadge = ({ status }: { status: string }) => (
  <span className={`badge ${status}`}>{status}</span>
);

export function PlacesPill({ remaining, capacity }: { remaining: number; capacity: number }) {
  if (remaining === 0) {
    return <span className="pill full">Sold out</span>;
  }

  // 1 spot remaining: critical urgency
  if (remaining === 1) {
    return (
      <span className="pill urgent flex items-center gap-1" title="1 of {capacity} remaining">
        <Flame className="w-3.5 h-3.5" />
        <span>1 spot left</span>
      </span>
    );
  }

  // Few spots remaining: <= 15% capacity or <= 3 spots
  if (remaining <= Math.max(3, Math.round(capacity * 0.15))) {
    return (
      <span className="pill low flex items-center gap-1" title={`${remaining} of ${capacity} places remaining`}>
        <Zap className="w-3.5 h-3.5" />
        <span>{remaining} / {capacity} left</span>
      </span>
    );
  }

  return (
    <span className="pill" title={`${remaining} of ${capacity} places remaining`}>
      {remaining} / {capacity} available
    </span>
  );
}

export function CapacityBar({ used, capacity }: { used: number; capacity: number }) {
  const pct = Math.min(100, Math.round((used / capacity) * 100));
  return (
    <div className="capbar" title={`${used} of ${capacity} (${pct}%)`}>
      <div
        className={`capbar-fill ${pct >= 100 ? "full" : pct >= 80 ? "high" : ""}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
