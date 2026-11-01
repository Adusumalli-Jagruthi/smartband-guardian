import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Baby, HeartPulse, Loader2, Users } from "lucide-react";
import { Logo } from "./app-shell";
import { authService } from "@/lib/api/services";
import { apiErrorMessage } from "@/lib/api/client";
import type { Role } from "@/lib/api/types";
import { roleHome, saveSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const roles: { id: Role; label: string; icon: typeof Baby }[] = [
  { id: "kid", label: "School Kid", icon: Baby },
  { id: "elderly", label: "Elderly", icon: HeartPulse },
  { id: "guardian", label: "Guardian", icon: Users },
];

const input = "w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [role, setRole] = useState<Role>("guardian");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const res = mode === "login"
        ? await authService.login({ email: form.email, password: form.password, role })
        : await authService.register({ ...form, role });
      saveSession(res.token, res.user);
      navigate({ to: roleHome[res.user.role ?? role] });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally { setBusy(false); }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <Link to="/"><span className="font-display text-xl font-bold">SmartBand</span></Link>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight">Safety that stays connected.</h2>
          <p className="mt-4 max-w-md opacity-80">Live GPS, heart-rate, fall detection and SOS for the people you care about most.</p>
        </div>
        <p className="text-sm opacity-60">AI + IoT Safety System</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-md space-y-5">
          <Link to="/" className="lg:hidden"><Logo /></Link>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Choose your role to continue.</p>
          </div>
          <div className="grid grid-cols-3 gap-2" role="radiogroup">
            {roles.map((r) => (
              <button type="button" key={r.id} role="radio" aria-checked={role === r.id} onClick={() => setRole(r.id)}
                className={cn("flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-semibold transition",
                  role === r.id ? "border-primary bg-accent text-primary" : "text-foreground hover:bg-muted")}>
                <r.icon className="h-5 w-5" />{r.label}
              </button>
            ))}
          </div>
          {mode === "register" && <input required placeholder="Full name" className={input} value={form.name} onChange={set("name")} />}
          <input required type="email" placeholder="Email" className={input} value={form.email} onChange={set("email")} />
          {mode === "register" && <input placeholder="Phone (optional)" className={input} value={form.phone} onChange={set("phone")} />}
          <input required type="password" minLength={6} placeholder="Password" className={input} value={form.password} onChange={set("password")} />
          {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}{mode === "login" ? "Sign in" : "Create account"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? <>New here? <Link to="/register" className="font-semibold text-primary">Create an account</Link></>
              : <>Already registered? <Link to="/login" className="font-semibold text-primary">Sign in</Link></>}
          </p>
        </form>
      </div>
    </div>
  );
}
