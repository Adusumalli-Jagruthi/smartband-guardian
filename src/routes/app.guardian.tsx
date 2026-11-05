import { requireRole } from "@/lib/session";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, HeartPulse, MapPin, Pill, Users } from "lucide-react";
import { guardianService } from "@/lib/api/services";
import { apiErrorMessage } from "@/lib/api/client";
import { NotConnected, PageHeader, Panel, Waiting } from "@/components/states";
import { MapView } from "@/components/map-view";
import { AlertList, MedicineList } from "@/components/widgets";
import { GuardianLinkForm } from "@/components/link-panels";
import { ThingSpeakPanel } from "@/components/thingspeak-panel";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/guardian")({
  beforeLoad: requireRole(["guardian"]),
  head: () => seo("Guardian Dashboard", "Monitor linked users' health, GPS location, medicine confirmations and alerts."),
  component: GuardianDashboard,
});

function GuardianDashboard() {
  const q = useQuery({ queryKey: ["linked"], queryFn: guardianService.linkedUsers, retry: false, refetchInterval: 15000 });
  const [sel, setSel] = useState<string | null>(null);
  const users = q.data ?? [];
  const current = users.find((u) => u.id === sel) ?? users[0];
  const online = current?.device?.status === "online";

  return (
    <>
      <PageHeader title="Guardian Dashboard" subtitle="Everyone you look after, at a glance" />
      <Panel title="Linked members" icon={Users}>
        <GuardianLinkForm />
        {q.isLoading ? <Waiting label="Loading linked users…" /> : q.isError ? <p className="text-sm text-muted-foreground">{apiErrorMessage(q.error)}</p>
          : users.length === 0 ? <p className="text-sm text-muted-foreground">No approved members yet. Enter the code from the member's dashboard, then ask them to approve your request.</p> : (
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
      {current && <div className="mt-6"><h2 className="mb-3 font-display text-lg font-semibold">{current.name}'s live readings (ThingSpeak)</h2><ThingSpeakPanel userId={current.id} /></div>}
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
