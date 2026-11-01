import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSessionUser, roleHome } from "@/lib/session";

export const Route = createFileRoute("/app/")({
  beforeLoad: () => {
    const u = getSessionUser();
    throw redirect({ to: u ? roleHome[u.role] : "/login" });
  },
});
