import { requireRole, useSessionUser } from "@/lib/session";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History, MapPin } from "lucide-react";
import { gpsService, guardianService } from "@/lib/api/services";
import { useBand } from "@/hooks/use-band";
import { PageHeader, Panel, Waiting, fmtTime } from "@/components/states";
import { MapView } from "@/components/map-view";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/app/tracking")({
  beforeLoad: requireRole(["kid", "elderly", "guardian"]),
  head: () => seo("GPS Tracking", "Live GPS location and route history from the SmartBand NEO-6M module."),
  component: Tracking,
});

function Tracking() {
  const me = useSessionUser();
  const isGuardian = me?.role === "guardian";
  const linked = useQuery({ queryKey: ["linked"], queryFn: guardianService.linkedUsers, enabled: isGuardian, retry: false });
  const [sel, setSel] = useState("");
  const target = isGuardian ? (sel || linked.data?.[0]?.id || "none") : undefined;
  const b = useBand(target);
  const [date, setDate] = useState("");
  const h = useQuery({ queryKey: ["gpsHistory", b.userId, date], queryFn: () => gpsService.history(b.userId!, date || undefined), enabled: !!b.userId && b.userId !== "none", retry: false });
  const points = h.data?.length ? h.data : b.location ? [b.location] : [];
  return (
    <>
      <PageHeader title="GPS Tracking" subtitle="Live position and travel history"
        action={<div className="flex flex-wrap gap-2">{isGuardian && (
          <select aria-label="Linked user" value={sel} onChange={(e) => setSel(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm">
            {!linked.data?.length && <option value="">No linked users</option>}
            {linked.data?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>)}<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm" /></div>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Map" icon={MapPin} className="lg:col-span-2"><MapView points={points} offline={b.offline} className="h-[28rem]" /></Panel>
        <Panel title="Location history" icon={History}>
          {h.isLoading ? <Waiting label="Loading history…" /> : !h.data?.length ? <Waiting label="No GPS history from device yet" /> : (
            <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
              {[...h.data].reverse().map((p, i) => (
                <li key={i} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium text-foreground">{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</p>
                  <p className="text-xs text-muted-foreground">{fmtTime(p.timestamp)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
