import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, KeyRound, Loader2, RefreshCw, ShieldCheck, UserMinus, UserPlus, X } from "lucide-react";
import { guardianService, linkService } from "@/lib/api/services";
import { apiErrorMessage } from "@/lib/api/client";
import type { LinkCode } from "@/lib/api/types";
import { Panel, Waiting } from "./states";
import { cn } from "@/lib/utils";

function Notice({ kind, text }: { kind: "ok" | "err"; text: string }) {
  return <p role="status" className={cn("rounded-lg px-3 py-2 text-sm", kind === "ok" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>{text}</p>;
}

function useCountdown(expiresAt?: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (!expiresAt) return null;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
}

/** Kid/elderly: generate one-time code, approve/reject guardian requests, unlink guardians. */
export function LinkGuardianPanel() {
  const qc = useQueryClient();
  const [fresh, setFresh] = useState<LinkCode | null>(null);
  const [note, setNote] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const status = useQuery({ queryKey: ["link-code"], queryFn: linkService.codeStatus, retry: false, refetchInterval: 15000 });
  const overview = useQuery({ queryKey: ["link-overview"], queryFn: linkService.overview, retry: false, refetchInterval: 15000 });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["link-code"] }); qc.invalidateQueries({ queryKey: ["link-overview"] }); };
  const fail = (e: unknown) => setNote({ kind: "err", text: apiErrorMessage(e) });

  const gen = useMutation({ mutationFn: linkService.generateCode, onSuccess: (c) => { setFresh(c); setNote(null); refresh(); }, onError: fail });
  const approve = useMutation({ mutationFn: linkService.approve, onSuccess: (r) => { setNote({ kind: "ok", text: `${r.guardian?.name ?? "Guardian"} can now see your dashboard.` }); refresh(); }, onError: fail });
  const reject = useMutation({ mutationFn: linkService.reject, onSuccess: (r) => { setNote({ kind: "ok", text: `Request from ${r.guardian?.name ?? "guardian"} rejected.` }); refresh(); }, onError: fail });
  const remove = useMutation({ mutationFn: linkService.removeGuardian, onSuccess: () => { setNote({ kind: "ok", text: "Guardian unlinked." }); refresh(); }, onError: fail });

  const st = status.data;
  const used = st?.state === "used";
  const showCode = fresh && !used && st?.state === "active";
  const left = useCountdown(showCode ? fresh.expiresAt : st?.expiresAt);
  const expired = st?.state === "expired" || (left === 0 && (showCode || st?.state === "active"));
  const pending = overview.data?.pending ?? [];
  const guardians = overview.data?.guardians ?? [];

  return (
    <Panel title="Link Guardian" icon={ShieldCheck}>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Share a one-time code with your guardian. It works once and expires after 15 minutes.</p>
          {status.isLoading ? <Waiting label="Checking code…" /> : status.isError ? <Notice kind="err" text={apiErrorMessage(status.error)} /> : (
            <div className="rounded-xl border bg-accent/40 p-4 text-center">
              {showCode && !expired ? (
                <>
                  <p className="font-mono text-2xl font-bold tracking-[0.3em] text-foreground">{fresh.code}</p>
                  <p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />Expires in {Math.floor((left ?? 0) / 60)}:{String((left ?? 0) % 60).padStart(2, "0")}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {used ? "Your last code was used. Approve the request below, or create a new code."
                    : expired ? "Your code has expired."
                    : st?.state === "active" ? "A code is active but hidden for safety. Create a new one to see it."
                    : "No code yet."}
                </p>
              )}
            </div>
          )}
          <button onClick={() => gen.mutate()} disabled={gen.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {gen.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : st?.state === "none" ? <KeyRound className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
            {st?.state === "none" ? "Generate code" : "Generate new code"}
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Pending requests</h3>
          {overview.isLoading ? <Waiting label="Loading…" /> : overview.isError ? <Notice kind="err" text={apiErrorMessage(overview.error)} />
            : pending.length === 0 ? <p className="text-sm text-muted-foreground">No pending requests.</p>
            : pending.map((r) => (
              <div key={r.id} className="rounded-xl border p-3">
                <p className="font-semibold text-foreground">{r.guardian?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{r.guardian?.email}</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => approve.mutate(r.id)} disabled={approve.isPending || reject.isPending} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-success px-3 py-1.5 text-sm font-semibold text-success-foreground disabled:opacity-50"><Check className="h-4 w-4" />Approve</button>
                  <button onClick={() => reject.mutate(r.id)} disabled={approve.isPending || reject.isPending} className="flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-semibold text-destructive disabled:opacity-50"><X className="h-4 w-4" />Reject</button>
                </div>
              </div>
            ))}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Linked guardians</h3>
          {overview.isLoading ? null : guardians.length === 0 ? <p className="text-sm text-muted-foreground">No guardians linked yet.</p>
            : guardians.map((g) => (
              <div key={g.id} className="flex items-center justify-between gap-2 rounded-xl border p-3">
                <div className="min-w-0"><p className="font-semibold text-foreground">{g.name}</p><p className="truncate text-xs text-muted-foreground">{g.email}</p></div>
                <button onClick={() => { if (confirm(`Unlink ${g.name}? They will lose access to your data.`)) remove.mutate(g.id); }} disabled={remove.isPending}
                  className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold text-destructive"><UserMinus className="h-3 w-3" />Unlink</button>
              </div>
            ))}
        </div>
      </div>
      {note && <div className="mt-4"><Notice {...note} /></div>}
    </Panel>
  );
}

/** Guardian: submit a member's code, see pending/rejected requests. */
export function GuardianLinkForm() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [note, setNote] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const reqs = useQuery({ queryKey: ["guardian-requests"], queryFn: guardianService.requests, retry: false, refetchInterval: 15000 });
  const link = useMutation({
    mutationFn: guardianService.link,
    onSuccess: (r) => { setCode(""); setNote({ kind: "ok", text: `Request sent to ${r.member?.name ?? "member"}. They need to approve it on their dashboard.` }); qc.invalidateQueries({ queryKey: ["guardian-requests"] }); },
    onError: (e) => setNote({ kind: "err", text: apiErrorMessage(e) }),
  });
  const list = reqs.data ?? [];
  return (
    <div className="mb-4 space-y-3">
      <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) link.mutate(code.trim()); }} className="flex flex-col gap-2 sm:flex-row">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter linking code" aria-label="Linking code" maxLength={16}
          className="flex-1 rounded-lg border bg-background px-3 py-2 font-mono text-sm tracking-widest" />
        <button disabled={link.isPending || !code.trim()} className="flex items-center justify-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {link.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}Send request
        </button>
      </form>
      {note && <Notice {...note} />}
      {list.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {list.map((r) => (
            <span key={r.id} className={cn("rounded-full px-3 py-1 text-xs font-semibold", r.status === "pending" ? "bg-warning/15 text-warning" : "bg-destructive/10 text-destructive")}>
              {r.member?.name}: {r.status === "pending" ? "awaiting approval" : "rejected"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
