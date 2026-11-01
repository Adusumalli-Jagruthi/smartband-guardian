import type { ReactNode } from "react";
import { Loader2, WifiOff, Radio } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Panel({ title, icon: Icon, action, children, className }: {
  title?: string | undefined; icon?: LucideIcon | undefined; action?: ReactNode | undefined; children: ReactNode; className?: string | undefined;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]", className)}>
      {title && (
        <header className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
            {Icon && <Icon className="h-4 w-4 text-primary" />}{title}
          </h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Waiting({ label = "Waiting for device data" }: { label?: string | undefined }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Radio className="h-4 w-4 animate-pulse text-primary" /> {label}
    </div>
  );
}

export function NotConnected() {
  return (
    <div className="flex items-center gap-2 text-sm text-destructive">
      <WifiOff className="h-4 w-4" /> Device not connected
    </div>
  );
}

export function Loading() {
  return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
}

/** Decides which state to show. Never invents values. */
export function DataState<T>({ loading, offline, data, empty, children }: {
  loading?: boolean | undefined; offline?: boolean | undefined; data: T | null | undefined; empty?: ((d: T) => boolean) | undefined; children: (d: T) => ReactNode;
}) {
  if (loading) return <Loading />;
  if (offline) return <NotConnected />;
  if (data == null || (empty && empty(data))) return <Waiting />;
  return <>{children(data)}</>;
}

export function Metric({ icon: Icon, label, value, unit, loading, offline }: {
  icon: LucideIcon; label: string; value: number | string | null | undefined; unit?: string | undefined; loading?: boolean | undefined; offline?: boolean | undefined;
}) {
  return (
    <Panel>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="rounded-lg bg-accent p-2"><Icon className="h-4 w-4 text-primary" /></span>
      </div>
      <div className="mt-3 min-h-9">
        <DataState loading={loading} offline={offline} data={value}>
          {(v) => <p className="font-display text-3xl font-bold text-foreground">{v}<span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span></p>}
        </DataState>
      </div>
    </Panel>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode | undefined }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function fmtTime(ts?: string | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}
