import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity, Bell, Bot, Cpu, HeartPulse, LogOut, MapPin, Menu, Pill, Settings, ShieldCheck, Users, X, Baby,
} from "lucide-react";
import { clearSession, useSessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

const nav = [
  { group: "Dashboards", items: [
    { to: "/app/kid", label: "School Kid", icon: Baby },
    { to: "/app/elderly", label: "Elderly", icon: HeartPulse },
    { to: "/app/guardian", label: "Guardian", icon: Users },
  ]},
  { group: "Monitoring", items: [
    { to: "/app/tracking", label: "GPS Tracking", icon: MapPin },
    { to: "/app/health", label: "Health & Activity", icon: Activity },
    { to: "/app/medicines", label: "Medicines", icon: Pill },
    { to: "/app/alerts", label: "SOS & Alerts", icon: Bell },
    { to: "/app/assistant", label: "AI Assistant", icon: Bot },
  ]},
  { group: "Manage", items: [
    { to: "/app/devices", label: "Devices", icon: Cpu },
    { to: "/app/settings", label: "Settings & Profile", icon: Settings },
  ]},
] as const;

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-display text-lg font-bold text-foreground", className)}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><ShieldCheck className="h-4 w-4" /></span>
      SmartBand
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const user = useSessionUser();
  const navigate = useNavigate();

  const sidebar = (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <Link to="/" className="px-2"><Logo /></Link>
      {nav.map((g) => (
        <div key={g.group}>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.group}</p>
          <ul className="space-y-1">
            {g.items.map((i) => {
              const active = path === i.to;
              return (
                <li key={i.to}>
                  <Link to={i.to} onClick={() => setOpen(false)}
                    className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-accent")}>
                    <i.icon className="h-4 w-4" />{i.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <button onClick={() => { clearSession(); navigate({ to: "/login" }); }}
        className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-sidebar lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar shadow-xl">
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-md p-1 hover:bg-accent"><X className="h-5 w-5" /></button>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-md p-2 hover:bg-accent lg:hidden"><Menu className="h-5 w-5" /></button>
          <div className="lg:hidden"><Logo /></div>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/app/alerts" aria-label="Alerts" className="rounded-full p-2 hover:bg-accent"><Bell className="h-5 w-5 text-foreground" /></Link>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-foreground">{user?.name ?? "Guest"}</p>
              <p className="text-xs capitalize text-muted-foreground">{user?.role ?? "Not signed in"}</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-accent font-semibold text-primary">{(user?.name ?? "G")[0]}</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
