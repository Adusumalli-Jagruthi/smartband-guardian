import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, Footprints, HeartPulse } from "lucide-react";
import { useBand } from "@/hooks/use-band";
import { Metric, PageHeader, Panel } from "@/components/states";
import { HeartChart, StepsChart } from "@/components/widgets";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/health")({
  head: () => seo("Health & Activity", "Heart-rate and activity charts from the pulse sensor and MPU6050."),
  component: Health,
});

function Health() {
  const b = useBand();
  const [range, setRange] = useState<"day" | "week">("day");
  return (
    <>
      <PageHeader title="Health & Activity" subtitle="Pulse sensor heart rate and MPU6050 motion data"
        action={<div className="flex rounded-lg border p-1">{(["day", "week"] as const).map((r) => (
          <button key={r} onClick={() => setRange(r)} className={cn("rounded-md px-3 py-1 text-sm font-semibold capitalize", range === r ? "bg-primary text-primary-foreground" : "text-foreground")}>{r}</button>
        ))}</div>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric icon={HeartPulse} label="Current heart rate" value={b.reading?.heartRate} unit="BPM" loading={b.loading} offline={b.offline} />
        <Metric icon={Footprints} label="Steps" value={b.reading?.steps} loading={b.loading} offline={b.offline} />
        <Metric icon={Activity} label="Activity state" value={b.reading?.activity} loading={b.loading} offline={b.offline} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Heart rate trend" icon={HeartPulse}><HeartChart userId={b.userId} range={range} offline={b.offline} /></Panel>
        <Panel title="Daily steps" icon={Footprints}><StepsChart userId={b.userId} offline={b.offline} /></Panel>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">SmartBand measures heart rate and motion only. SpO2 and temperature are not supported.</p>
    </>
  );
}
