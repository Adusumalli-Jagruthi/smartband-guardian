import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity, Bell, Bot, Cpu, HeartPulse, LayoutDashboard, LogOut, MapPin, Menu, Pill, Plug, ShieldCheck, UserCircle, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/lib/api/types";
import { clearSession, useSessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: LucideIcon };

/** Each role sees only its own pages. */
export const roleNav: Record<Role, Item[]> = {
  kid: [
    { to: "/app/kid", label: "My Dashboard", icon: LayoutDashboard },
    { to: "/app/health", label: "Health & Activity", icon: HeartPulse },
    { to: "/app/tracking", label: "GPS Tracking", icon: MapPin },
    { to: "/app/alerts", label: "SOS & Alerts", icon: Bell },
    { to: "/app/settings", label: "Profile", icon: UserCircle },
  ],
  elderly: [
    { to: "/app/elderly", label: "My Dashboard", icon: LayoutDashboard },
    { to: "/app/assistant", label: "AI Assistant", icon: Bot },
    { to: "/app/medicines", label: "Medicines", icon: Pill },
    { to: "/app/health", label: "Health & Activity", icon: Activity },
    { to: "/app/tracking", label: "GPS Location", icon: MapPin },
    { to: "/app/alerts", label: "SOS & Alerts", icon: Bell },
    { to: "/app/settings", label: "Profile", icon: UserCircle },
  ],
  guardian: [
    { to: "/app/guardian", label: "Linked Users", icon: LayoutDashboard },
    { to: "/app/tracking", label: "GPS Tracking", icon: MapPin },
    { to: "/app/alerts", label: "Emergency Alerts", icon: Bell },
    { to: "/app/devices", label: "Device Status", icon: Cpu },
    { to: "/app/integrations", label: "Integrations", icon: Plug },
    { to: "/app/settings", label: "Profile", icon: UserCircle },
  ],
};

const roleLabel: Record<Role, string> = { kid: "School Kid", elderly: "Elderly", guardian: "Guardian" };

export function Logo({ className }: { className?: string | undefined }) {
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
  const qc = useQueryClient();
  const items = user ? roleNav[user.role] : [];

  async function signOut() {
    await qc.cancelQueries(); qc.clear(); clearSession();
    navigate({ to: "/login", replace: true });
  }

  const sidebar = (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto p-4" aria-label="Main">
      <Link to="/" className="px-2"><Logo /></Link>
      {user && (
        <div className="rounded-xl bg-accent px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{roleLabel[user.role]}</p>
          <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
        </div>
      )}
      <ul className="space-y-1">
        {items.map((i) => {
          const active = path === i.to;
          return (
            <li key={i.to}>
              <Link to={i.to} onClick={() => setOpen(false)}
                className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/80 hover:bg-accent")}>
                <i.icon className="h-4 w-4" />{i.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <button onClick={signOut}
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
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8 lg:hidden">
          <button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-md p-2 hover:bg-accent"><Menu className="h-5 w-5" /></button>
          <Logo />
          <Link to="/app/alerts" aria-label="Alerts" className="ml-auto rounded-full p-2 hover:bg-accent"><Bell className="h-5 w-5 text-foreground" /></Link>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
