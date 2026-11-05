import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, AlertTriangle, HeartPulse, MapPin, Move, Siren, Thermometer, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { thingspeakService } from "@/lib/api/services";
import { apiErrorMessage } from "@/lib/api/client";
import type { ThingSpeakEntry } from "@/lib/api/types";
import { MapView } from "./map-view";
import { Panel, fmtTime } from "./states";
import { cn } from "@/lib/utils";

/** No new entry within this window → device shown offline. */
const OFFLINE_MS = 2 * 60 * 1000;
const show = (v: number | null | undefined, digits = 0) => (v == null ? "--" : v.toFixed(digits));

export function useThingSpeak(userId?: string) {
  const valid = !!userId && userId !== "none";
  const q = useQuery({
    queryKey: ["thingspeak", userId], enabled: valid, retry: false,
    queryFn: () => thingspeakService.feeds(userId!, 100), refetchInterval: 20000,
  });
  const feeds = q.data?.feeds ?? [];
  const last = feeds.at(-1) ?? null;
  const lastAt = last ? new Date(last.timestamp).getTime() : null;
  const online = lastAt != null && Date.now() - lastAt < OFFLINE_MS;
  const lastGps = [...feeds].reverse().find((f) => f.lat != null && f.lng != null) ?? null;
  return { q, feeds, last, online, lastGps, configured: q.data?.configured ?? false };
}

function Card({ icon: Icon, label, value, unit, note, danger }: { icon: LucideIcon; label: string; value: string; unit?: string; note?: string; danger?: boolean }) {
  return (
    <Panel className={cn(danger && "border-destructive bg-destructive/5")}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("rounded-lg p-2", danger ? "bg-destructive/10" : "bg-accent")}><Icon className={cn("h-4 w-4", danger ? "text-destructive" : "text-primary")} /></span>
      </div>
      <p className={cn("mt-3 font-display text-3xl font-bold", danger ? "text-destructive" : "text-foreground")}>
        {value}{value !== "--" && unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
      </p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </Panel>
  );
}

function Chart({ data, keys }: { data: ThingSpeakEntry[]; keys: { k: keyof ThingSpeakEntry; name: string; color: string }[] }) {
  const rows = data.map((f) => ({ ...f, t: new Date(f.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }));
  const hasAny = data.some((f) => keys.some(({ k }) => f[k] != null));
  if (!hasAny) return <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">No readings yet</p>;
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="t" fontSize={11} stroke="var(--color-muted-foreground)" minTickGap={24} />
          <YAxis fontSize={11} stroke="var(--color-muted-foreground)" width={36} />
          <Tooltip />
          {keys.map(({ k, name, color }) => <Line key={String(k)} dataKey={String(k)} name={name} stroke={color} dot={false} strokeWidth={2} connectNulls={false} isAnimationActive={false} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** All 8 ThingSpeak fields for one user. `sections` chooses which blocks each dashboard shows. */
export function ThingSpeakPanel({ userId, sections = ["vitals", "motion", "gps", "sos", "charts"] }: {
  userId?: string | undefined; sections?: ("vitals" | "motion" | "gps" | "sos" | "charts")[];
}) {
  const { q, feeds, last, online, lastGps, configured } = useThingSpeak(userId);
  const has = (s: (typeof sections)[number]) => sections.includes(s);

  if (q.isLoading) return <Panel><p className="text-sm text-muted-foreground">Loading ThingSpeak data…</p></Panel>;
  const problem = q.isError ? apiErrorMessage(q.error) : !configured ? "ThingSpeak is not configured. A guardian can add the Channel ID and Read API Key under Integrations." : q.data?.error;

  const panic = last?.panic === true;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3 text-sm">
        <span className="flex items-center gap-2 font-semibold">
          <span className={cn("h-2.5 w-2.5 rounded-full", online ? "bg-success animate-pulse" : "bg-destructive")} />
          {online ? "Device online" : "Device offline"}
        </span>
        <span className="text-muted-foreground">Last update: {fmtTime(last?.timestamp)} · refreshes every 20 s</span>
      </div>
      {problem && <p className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />{problem}</p>}

      {has("sos") && panic && (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive bg-destructive/10 p-4 text-destructive">
          <Siren className="h-6 w-6 animate-pulse" />
          <div><p className="font-bold">EMERGENCY — panic button pressed</p><p className="text-sm">At {fmtTime(last?.timestamp)}</p></div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {has("vitals") && <>
          <Card icon={HeartPulse} label="Heart rate" value={show(last?.heartRate)} unit="BPM" />
          <Card icon={Thermometer} label="Temperature" value={show(last?.temperatureF, 1)} unit="°F" />
          <Card icon={Wind} label="SpO₂ (experimental)" value={show(last?.spo2)} unit="%" note="Unverified sensor — not for medical use" />
        </>}
        {has("motion") && <>
          <Card icon={Move} label="MPU6050 X-axis" value={show(last?.accelX, 2)} />
          <Card icon={Activity} label="MPU6050 Y-axis" value={show(last?.accelY, 2)} />
        </>}
        {has("sos") && <Card icon={Siren} label="Panic button" value={last?.panic == null ? "--" : panic ? "Emergency" : "Normal"} danger={panic} />}
        {has("gps") && <>
          <Card icon={MapPin} label="GPS latitude" value={show(last?.lat, 6)} />
          <Card icon={MapPin} label="GPS longitude" value={show(last?.lng, 6)} />
        </>}
      </div>

      {has("gps") && (
        <Panel title="GPS location" icon={MapPin} action={lastGps && <span className="text-xs text-muted-foreground">Fix at {fmtTime(lastGps.timestamp)}</span>}>
          <MapView points={lastGps ? [{ lat: lastGps.lat!, lng: lastGps.lng!, timestamp: lastGps.timestamp }] : []} offline={!online} />
        </Panel>
      )}

      {has("charts") && (
        <div className="grid gap-4 lg:grid-cols-2">
          {has("vitals") && <Panel title="Heart rate (BPM)" icon={HeartPulse}><Chart data={feeds} keys={[{ k: "heartRate", name: "BPM", color: "var(--color-primary)" }]} /></Panel>}
          {has("vitals") && <Panel title="Temperature (°F) & SpO₂ (%, experimental)" icon={Thermometer}><Chart data={feeds} keys={[{ k: "temperatureF", name: "°F", color: "var(--color-warning)" }, { k: "spo2", name: "SpO₂ % (exp.)", color: "var(--color-primary)" }]} /></Panel>}
          {has("motion") && <Panel title="Movement (MPU6050)" icon={Move}><Chart data={feeds} keys={[{ k: "accelX", name: "X", color: "var(--color-primary)" }, { k: "accelY", name: "Y", color: "var(--color-destructive)" }]} /></Panel>}
        </div>
      )}
    </div>
  );
}
