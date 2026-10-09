import { AlertTriangle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { friendlyError, posColor } from "@/lib/api";

export function Loading({ label = "Loading data" }: { label?: string }) {
  return (
    <div className="panel flex items-center gap-3 p-6 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-primary" /> {label}…
    </div>
  );
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="panel flex items-start gap-3 border-destructive/40 p-5 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div className="flex-1">
        <p className="text-foreground">{friendlyError(error)}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-xs text-primary hover:underline">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function Section({ title, eyebrow, children, right }: { title: string; eyebrow?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
          <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Metric({ value, label, accent }: { value: ReactNode; label: string; accent?: boolean }) {
  return (
    <div className="panel p-4">
      <div className={`num text-2xl font-semibold ${accent ? "text-primary" : ""}`}>{value}</div>
      <div className="eyebrow mt-1">{label}</div>
    </div>
  );
}

export function PosBadge({ pos }: { pos: string }) {
  return (
    <span className="num inline-flex items-center gap-1.5 text-xs">
      <span className="h-2 w-2 rounded-full" style={{ background: posColor(pos) }} />
      {pos}
    </span>
  );
}

export const tooltipStyle = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12 },
  labelStyle: { color: "var(--foreground)" },
  itemStyle: { color: "var(--foreground)" },
};
