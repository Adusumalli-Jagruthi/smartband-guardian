import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/session";

// Session lives in the browser, so the protected area renders client-side only.
export const Route = createFileRoute("/app")({
  ssr: false,
  beforeLoad: () => {
    if (!getSessionUser()) throw redirect({ to: "/login" });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
