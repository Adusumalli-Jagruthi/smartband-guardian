import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Battery, Bell, Check, Cpu, Loader2, Pill, Siren } from "lucide-react";
import { alertService, medicineService, sensorService } from "@/lib/api/services";
import { apiErrorMessage } from "@/lib/api/client";
import type { Device } from "@/lib/api/types";
import { DataState, NotConnected, Panel, Waiting, fmtTime } from "./states";
import { cn } from "@/lib/utils";

export function DeviceStatus({ device, offline, loading }: { device: Device | null; offline: boolean; loading?: boolean }) {
  return (
    <Panel title="Band status" icon={Cpu}>
      {loading ? <Waiting label="Checking device…" /> : offline || !device ? <NotConnected /> : (
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2 font-semibold text-foreground"><span className="h-2 w-2 rounded-full bg-success" /> {device.name} online</p>
          <p className="flex items-center gap-2 text-muted-foreground"><Battery className="h-4 w-4" /> {device.battery != null ? `${device.battery}%` : "Waiting for device data"}</p>
          <p className="text-muted-foreground">Last seen: {fmtTime(device.lastSeen)}</p>
        </div>
      )}
    </Panel>
  );
}

export function SosButton({ userId }: { userId?: string }) {
  const [msg, setMsg] = useState("");
  const m = useMutation({
    mutationFn: () => alertService.triggerSos(userId!),
    onSuccess: () => setMsg("SOS sent to all guardians."),
    onError: (e) => setMsg(apiErrorMessage(e)),
  });
  return (
    <Panel title="Emergency SOS" icon={Siren}>
      <button disabled={!userId || m.isPending} onClick={() => m.mutate()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive py-4 font-display text-lg font-bold text-destructive-foreground shadow-lg hover:opacity-90 disabled:opacity-50">
        {m.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Siren className="h-5 w-5" />} Send SOS
      </button>
      <p className="mt-3 text-xs text-muted-foreground">{msg || (userId ? "The physical SOS button on the band also triggers this." : "Sign in to enable SOS.")}</p>
    </Panel>
  );
}

export function HeartChart({ userId, range = "day", offline }: { userId?: string; range?: "day" | "week"; offline?: boolean }) {
  const q = useQuery({ queryKey: ["history", userId, range], queryFn: () => sensorService.history(userId!, range), enabled: !!userId, retry: false });
  const data = (q.data ?? []).filter((r) => r.heartRate != null).map((r) => ({ t: new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), bpm: r.heartRate }));
  return (
    <DataState loading={q.isLoading && !!userId} offline={offline && data.length === 0} data={data} empty={(d) => d.length === 0}>
      {(d) => (
        <div className="h-64">
          <ResponsiveContainer>
            <AreaChart data={d}>
              <defs><linearGradient id="hr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="t" fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis fontSize={12} stroke="var(--muted-foreground)" domain={["auto", "auto"]} />
              <Tooltip />
              <Area dataKey="bpm" stroke="var(--primary)" fill="url(#hr)" strokeWidth={2} name="BPM" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </DataState>
  );
}

export function StepsChart({ userId, offline }: { userId?: string; offline?: boolean }) {
  const q = useQuery({ queryKey: ["history", userId, "week"], queryFn: () => sensorService.history(userId!, "week"), enabled: !!userId, retry: false });
  const byDay = new Map<string, number>();
  (q.data ?? []).forEach((r) => {
    if (r.steps == null) return;
    const k = new Date(r.timestamp).toLocaleDateString([], { weekday: "short" });
    byDay.set(k, Math.max(byDay.get(k) ?? 0, r.steps));
  });
  const data = [...byDay].map(([day, steps]) => ({ day, steps }));
  return (
    <DataState loading={q.isLoading && !!userId} offline={offline && data.length === 0} data={data} empty={(d) => d.length === 0}>
      {(d) => (
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={d}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis fontSize={12} stroke="var(--muted-foreground)" />
              <Tooltip />
              <Bar dataKey="steps" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DataState>
  );
}

export function MedicineList({ userId, canConfirm = true }: { userId?: string; canConfirm?: boolean }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["meds", userId], queryFn: () => medicineService.list(userId!), enabled: !!userId, retry: false });
  const confirm = useMutation({ mutationFn: medicineService.confirm, onSuccess: () => qc.invalidateQueries({ queryKey: ["meds", userId] }) });
  if (!userId) return <p className="text-sm text-muted-foreground">Sign in to see medicine schedules.</p>;
  if (q.isLoading) return <Waiting label="Loading schedule…" />;
  if (q.isError) return <p className="text-sm text-muted-foreground">{apiErrorMessage(q.error)}</p>;
  if (!q.data?.length) return <p className="text-sm text-muted-foreground">No medicines scheduled.</p>;
  return (
    <ul className="divide-y">
      {q.data.map((m) => (
        <li key={m.id} className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-accent p-2"><Pill className="h-4 w-4 text-primary" /></span>
            <div><p className="text-sm font-semibold text-foreground">{m.name} · {m.dosage}</p><p className="text-xs text-muted-foreground">{m.time}</p></div>
          </div>
          {m.status === "taken" ? <span className="flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success"><Check className="h-3 w-3" /> Taken</span>
            : m.status === "missed" ? <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">Missed</span>
            : canConfirm ? <button onClick={() => confirm.mutate(m.id)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Confirm taken</button>
            : <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Pending</span>}
        </li>
      ))}
    </ul>
  );
}

export function AlertList({ userId, limit }: { userId?: string; limit?: number }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["alerts", userId], queryFn: () => alertService.list(userId), retry: false, refetchInterval: 15000 });
  const ack = useMutation({ mutationFn: alertService.acknowledge, onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }) });
  if (q.isLoading) return <Waiting label="Loading alerts…" />;
  if (q.isError) return <p className="text-sm text-muted-foreground">{apiErrorMessage(q.error)}</p>;
  const items = (q.data ?? []).slice(0, limit);
  if (!items.length) return <p className="flex items-center gap-2 text-sm text-muted-foreground"><Bell className="h-4 w-4" /> No alerts. All clear.</p>;
  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <li key={a.id} className={cn("flex items-start justify-between gap-3 rounded-xl border p-3", !a.acknowledged && a.type === "sos" && "border-destructive/40 bg-destructive/5")}>
          <div className="flex gap-3">
            <AlertTriangle className={cn("mt-0.5 h-4 w-4", a.type === "sos" || a.type === "fall" ? "text-destructive" : "text-warning")} />
            <div>
              <p className="text-sm font-semibold text-foreground">{a.userName ? `${a.userName}: ` : ""}{a.message}</p>
              <p className="text-xs text-muted-foreground">{a.type.replace("_", " ").toUpperCase()} · {fmtTime(a.timestamp)}</p>
            </div>
          </div>
          {!a.acknowledged && <button onClick={() => ack.mutate(a.id)} className="shrink-0 rounded-lg border px-3 py-1 text-xs font-semibold text-foreground hover:bg-accent">Acknowledge</button>}
        </li>
      ))}
    </ul>
  );
}
