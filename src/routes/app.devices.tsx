import { requireRole } from "@/lib/session";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Battery, Cpu, Plus, Trash2, Volume2 } from "lucide-react";
import { deviceService } from "@/lib/api/services";
import { apiErrorMessage } from "@/lib/api/client";
import { PageHeader, Panel, Waiting, fmtTime } from "@/components/states";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/devices")({
  beforeLoad: requireRole(["guardian"]),
  head: () => seo("Device Management", "Pair, monitor and manage SmartBand ESP32-C3 devices."),
  component: Devices,
});

const components = ["ESP32-C3 Mini", "NEO-6M GPS", "Pulse heart-rate sensor", "MPU6050 accelerometer", "SOS button", "Buzzer", "LiPo battery"];

function Devices() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["devices"], queryFn: deviceService.list, retry: false });
  const [f, setF] = useState({ deviceId: "", name: "" });
  const refresh = () => qc.invalidateQueries({ queryKey: ["devices"] });
  const pair = useMutation({ mutationFn: () => deviceService.pair(f), onSuccess: () => { setF({ deviceId: "", name: "" }); refresh(); } });
  const remove = useMutation({ mutationFn: deviceService.remove, onSuccess: refresh });
  const buzz = useMutation({ mutationFn: deviceService.testBuzzer });

  return (
    <>
      <PageHeader title="Device Management" subtitle="Pair bands and check their status" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Your bands" icon={Cpu} className="lg:col-span-2">
          {q.isLoading ? <Waiting label="Loading devices…" /> : q.isError ? <p className="text-sm text-muted-foreground">{apiErrorMessage(q.error)}</p>
            : !q.data?.length ? <p className="text-sm text-muted-foreground">No devices paired yet.</p> : (
            <ul className="space-y-3">
              {q.data.map((d) => {
                const on = d.status === "online";
                return (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                    <div>
                      <p className="font-semibold text-foreground">{d.name} <span className="text-xs text-muted-foreground">#{d.id}</span></p>
                      <p className={cn("text-xs font-semibold", on ? "text-success" : "text-destructive")}>{on ? "Online" : "Device not connected"}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Battery className="h-3 w-3" />{on && d.battery != null ? `${d.battery}%` : "Waiting for device data"} · Last seen {fmtTime(d.lastSeen)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button disabled={!on} onClick={() => buzz.mutate(d.id)} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"><Volume2 className="h-3 w-3" /> Test buzzer</button>
                      <button onClick={() => remove.mutate(d.id)} aria-label="Remove device" className="rounded-lg border p-1.5 text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        <div className="space-y-4">
          <Panel title="Pair a band" icon={Plus}>
            <form onSubmit={(e) => { e.preventDefault(); pair.mutate(); }} className="space-y-3">
              <input required placeholder="Device ID (on the band)" value={f.deviceId} onChange={(e) => setF({ ...f, deviceId: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
              <input required placeholder="Name (e.g. Riya's band)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
              {pair.isError && <p className="text-sm text-destructive">{apiErrorMessage(pair.error)}</p>}
              <button disabled={pair.isPending} className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground">Pair device</button>
            </form>
          </Panel>
          <Panel title="Hardware">
            <ul className="space-y-1 text-sm text-foreground">{components.map((c) => <li key={c}>• {c}</li>)}</ul>
            <p className="mt-3 text-xs text-muted-foreground">Connects over Wi-Fi — no SIM card. No SpO2 or temperature sensing.</p>
          </Panel>
        </div>
      </div>
    </>
  );
}
