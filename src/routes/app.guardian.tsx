import { requireRole } from "@/lib/session";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, HeartPulse, MapPin, Pill, UserPlus, Users } from "lucide-react";
import { guardianService } from "@/lib/api/services";
import { apiErrorMessage } from "@/lib/api/client";
import { NotConnected, PageHeader, Panel, Waiting } from "@/components/states";
import { MapView } from "@/components/map-view";
import { AlertList, MedicineList } from "@/components/widgets";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/guardian")({
  beforeLoad: requireRole(["guardian"]),
  head: () => seo("Guardian Dashboard", "Monitor linked users' health, GPS location, medicine confirmations and alerts."),
  component: GuardianDashboard,
});

function GuardianDashboard() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["linked"], queryFn: guardianService.linkedUsers, retry: false, refetchInterval: 15000 });
  const [sel, setSel] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const link = useMutation({ mutationFn: guardianService.link, onSuccess: () => { setCode(""); qc.invalidateQueries({ queryKey: ["linked"] }); } });
  const users = q.data ?? [];
  const current = users.find((u) => u.id === sel) ?? users[0];
  const online = current?.device?.status === "online";

  return (
    <>
      <PageHeader title="Guardian Dashboard" subtitle="Everyone you look after, at a glance" />
      <Panel title="Linked users" icon={Users} action={
        <form onSubmit={(e) => { e.preventDefault(); if (code) link.mutate(code); }} className="flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Link code" className="w-28 rounded-lg border bg-background px-3 py-1.5 text-sm sm:w-40" />
          <button className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"><UserPlus className="h-4 w-4" /><span className="hidden sm:inline">Link</span></button>
        </form>}>
        {link.isError && <p className="mb-3 text-sm text-destructive">{apiErrorMessage(link.error)}</p>}
        {q.isLoading ? <Waiting label="Loading linked users…" /> : q.isError ? <p className="text-sm text-muted-foreground">{apiErrorMessage(q.error)}</p>
          : users.length === 0 ? <p className="text-sm text-muted-foreground">No linked users yet. Enter the link code shown on the kid's or elder's account.</p> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((u) => {
              const on = u.device?.status === "online";
              return (
                <button key={u.id} onClick={() => setSel(u.id)} className={cn("rounded-xl border p-4 text-left transition", current?.id === u.id ? "border-primary bg-accent" : "hover:bg-muted")}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">{u.name}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", on ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive")}>{on ? "Online" : "Offline"}</span>
                  </div>
                  <p className="text-xs capitalize text-muted-foreground">{u.role === "kid" ? "School kid" : "Elderly"}</p>
                  <div className="mt-3 text-sm">
                    {!on ? <NotConnected /> : u.latest?.heartRate != null
                      ? <p className="flex items-center gap-2 text-foreground"><HeartPulse className="h-4 w-4 text-primary" />{u.latest.heartRate} BPM · {u.latest.activity ?? "—"}</p>
                      : <Waiting />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Panel>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title={current ? `${current.name}'s location` : "Location"} icon={MapPin} className="lg:col-span-2">
          <MapView points={current?.location ? [current.location] : []} offline={!!current && !online} />
        </Panel>
        <Panel title="Medicine confirmations" icon={Pill}>
          {current ? <MedicineList userId={current.id} canConfirm={false} /> : <p className="text-sm text-muted-foreground">Select a linked user.</p>}
        </Panel>
        <Panel title="Recent alerts" icon={Bell} className="lg:col-span-3"><AlertList limit={6} /></Panel>
      </div>
    </>
  );
}
