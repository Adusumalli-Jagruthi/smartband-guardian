import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Eye, EyeOff, Loader2, Pencil, PlugZap, Save, Trash2, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { integrationConfigService } from "@/lib/api/services";
import { apiErrorMessage } from "@/lib/api/client";
import type { IntegrationName, IntegrationStatus } from "@/lib/api/types";
import { fmtTime } from "./states";
import { cn } from "@/lib/utils";

export type FieldDef = {
  key: string; label: string; help: string; secret?: boolean; placeholder?: string;
  options?: { value: string; label: string }[];
};

const statusStyle: Record<IntegrationStatus, { t: string; c: string; d: string }> = {
  connected: { t: "Connected", c: "bg-success/15 text-success", d: "bg-success" },
  disconnected: { t: "Disconnected", c: "bg-muted text-muted-foreground", d: "bg-muted-foreground" },
  error: { t: "Error", c: "bg-destructive/10 text-destructive", d: "bg-destructive" },
  not_configured: { t: "Not configured", c: "bg-warning/15 text-warning", d: "bg-warning" },
};

function SecretInput({ value, onChange, placeholder, id }: { value: string; onChange: (v: string) => void; placeholder?: string | undefined; id: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={show ? "text" : "password"} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border bg-background px-3 py-2 pr-10 font-mono text-sm outline-none focus:ring-2 focus:ring-ring" />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide value" : "Show value"} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function IntegrationCard({ name, title, description, icon: Icon, fields, enableLabel, lastLabel, testLabel }: {
  name: IntegrationName; title: string; description: string; icon: LucideIcon; fields: FieldDef[];
  enableLabel: string; lastLabel: string; testLabel: string;
}) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["integration", name], queryFn: () => integrationConfigService.get(name), retry: false });
  const cfg = q.data;
  const [editing, setEditing] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Secret inputs always start empty — saved secrets are never shown.
  function reset() {
    setEnabled(cfg?.enabled ?? false);
    setValues(Object.fromEntries(fields.map((f) => [f.key, f.secret ? "" : cfg?.fields[f.key] ?? f.options?.[0]?.value ?? ""])));
  }
  useEffect(reset, [cfg]); // eslint-disable-line react-hooks/exhaustive-deps

  const unavailable = q.isError;
  const configured = !!cfg?.configured;
  const status: IntegrationStatus = unavailable || !configured ? "not_configured" : cfg.status;
  const showForm = editing || (!configured && !unavailable);
  const refresh = () => qc.invalidateQueries({ queryKey: ["integration", name] });

  const save = useMutation({
    mutationFn: () => integrationConfigService.save(name, {
      enabled,
      fields: Object.fromEntries(fields.filter((f) => !f.secret).map((f) => [f.key, values[f.key]?.trim() ?? ""])),
      secrets: Object.fromEntries(fields.filter((f) => f.secret && values[f.key]?.trim()).map((f) => [f.key, values[f.key]!.trim()])),
    }),
    onSuccess: () => { setFlash({ ok: true, text: "Configuration saved securely." }); setEditing(false); refresh(); },
    onError: (e) => setFlash({ ok: false, text: apiErrorMessage(e) }),
  });
  const test = useMutation({
    mutationFn: () => integrationConfigService.test(name),
    onSuccess: (r) => { setFlash({ ok: r.ok, text: r.message }); refresh(); },
    onError: (e) => setFlash({ ok: false, text: `Test failed: ${apiErrorMessage(e)}` }),
  });
  const remove = useMutation({
    mutationFn: () => integrationConfigService.remove(name),
    onSuccess: () => { setFlash({ ok: true, text: "Credentials removed." }); setConfirmDelete(false); refresh(); },
    onError: (e) => { setFlash({ ok: false, text: apiErrorMessage(e) }); setConfirmDelete(false); },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault(); setFlash(null);
    const missing = fields.filter((f) => !values[f.key]?.trim() && !(f.secret && cfg?.maskedSecrets[f.key]));
    if (missing.length) { setFlash({ ok: false, text: `Please fill in: ${missing.map((f) => f.label).join(", ")}` }); return; }
    save.mutate();
  }

  const s = statusStyle[status];
  return (
    <section className="flex flex-col rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-accent p-2.5"><Icon className="h-5 w-5 text-primary" /></span>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold", s.c)}>
          <span className={cn("h-2 w-2 rounded-full", s.d)} />{q.isLoading ? "Checking…" : s.t}
        </span>
      </header>

      <dl className="mt-4 grid gap-2 rounded-xl bg-muted/50 p-3 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-muted-foreground">{lastLabel}</dt><dd className="font-medium text-foreground">{configured ? fmtTime(cfg?.lastSuccessAt) : "—"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Last result</dt><dd className="truncate font-medium text-foreground">{configured ? cfg?.lastMessage ?? "—" : "—"}</dd></div>
      </dl>

      {unavailable && (
        <p className="mt-4 rounded-lg bg-warning/15 px-3 py-2 text-sm text-foreground">
          Integration service unavailable — {apiErrorMessage(q.error)}
        </p>
      )}

      {configured && !editing && (
        <dl className="mt-4 space-y-2 text-sm">
          {fields.map((f) => (
            <div key={f.key} className="flex justify-between gap-3 border-b pb-2 last:border-0">
              <dt className="text-muted-foreground">{f.label}</dt>
              <dd className="font-mono text-foreground">{f.secret ? cfg?.maskedSecrets[f.key] ?? "Not set" : f.options?.find((o) => o.value === cfg?.fields[f.key])?.label ?? cfg?.fields[f.key] ?? "—"}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{enableLabel}</dt><dd className="font-semibold text-foreground">{cfg?.enabled ? "On" : "Off"}</dd></div>
        </dl>
      )}

      {showForm && (
        <form onSubmit={submit} className="mt-4 space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label htmlFor={`${name}-${f.key}`} className="text-sm font-semibold text-foreground">{f.label}</label>
              <p className="mb-1.5 text-xs text-muted-foreground">
                {f.help}{f.secret && cfg?.maskedSecrets[f.key] ? ` Saved: ${cfg.maskedSecrets[f.key]} — leave blank to keep it.` : ""}
              </p>
              {f.options ? (
                <select id={`${name}-${f.key}`} value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                  {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.secret ? (
                <SecretInput id={`${name}-${f.key}`} value={values[f.key] ?? ""} onChange={(v) => setValues({ ...values, [f.key]: v })} placeholder={f.placeholder} />
              ) : (
                <input id={`${name}-${f.key}`} value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} placeholder={f.placeholder}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              )}
            </div>
          ))}
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <span className="text-sm font-semibold text-foreground">{enableLabel}</span>
            <button type="button" role="switch" aria-checked={enabled} aria-label={enableLabel} onClick={() => setEnabled((v) => !v)}
              className={cn("relative h-6 w-11 shrink-0 rounded-full transition", enabled ? "bg-primary" : "bg-muted-foreground/30")}>
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all", enabled ? "left-5" : "left-0.5")} />
            </button>
          </label>
          <div className="flex flex-wrap gap-2">
            <button disabled={save.isPending || unavailable} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save configuration
            </button>
            {editing && <button type="button" onClick={() => { reset(); setEditing(false); setFlash(null); }} className="rounded-lg border px-4 py-2 text-sm font-semibold text-foreground">Cancel</button>}
          </div>
        </form>
      )}

      {flash && (
        <p role="status" className={cn("mt-4 flex items-start gap-2 rounded-lg px-3 py-2 text-sm", flash.ok ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive")}>
          {flash.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}{flash.text}
        </p>
      )}

      {configured && (
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <button onClick={() => { setFlash(null); test.mutate(); }} disabled={test.isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {test.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}{test.isPending ? "Testing…" : testLabel}
          </button>
          {!editing && <button onClick={() => { setEditing(true); setFlash(null); }} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent"><Pencil className="h-4 w-4" /> Edit</button>}
          {confirmDelete ? (
            <span className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-sm">
              <span className="text-foreground">Remove these credentials?</span>
              <button onClick={() => remove.mutate()} disabled={remove.isPending} className="rounded-md bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground">{remove.isPending ? "Removing…" : "Yes, remove"}</button>
              <button onClick={() => setConfirmDelete(false)} className="rounded-md border px-2.5 py-1 text-xs font-semibold text-foreground">Cancel</button>
            </span>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/5"><Trash2 className="h-4 w-4" /> Remove</button>
          )}
        </div>
      )}
    </section>
  );
}
