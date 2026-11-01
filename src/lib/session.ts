import { redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Role, User } from "./api/types";

const KEY = "smartband_user";

export function saveSession(token: string, user: User) {
  localStorage.setItem("smartband_token", token);
  localStorage.setItem(KEY, JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem("smartband_token");
  localStorage.removeItem(KEY);
}

/** Reads the signed-in user after hydration. Null when signed out. */
export function useSessionUser() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem(KEY) ?? "null")); } catch { setUser(null); }
  }, []);
  return user;
}

export const roleHome: Record<Role, "/app/kid" | "/app/elderly" | "/app/guardian"> = {
  kid: "/app/kid", elderly: "/app/elderly", guardian: "/app/guardian",
};

export function getSessionUser(): User | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; }
}

/** Route guard: signed-out → /login, wrong role → that role's home. Runs client-side (/app is ssr:false). */
export function requireRole(roles: Role[]) {
  return () => {
    const u = getSessionUser();
    if (!u) throw redirect({ to: "/login" });
    if (!roles.includes(u.role)) throw redirect({ to: roleHome[u.role] });
  };
}
