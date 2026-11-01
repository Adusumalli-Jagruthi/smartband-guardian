import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Bot, Footprints, HeartPulse, Pill } from "lucide-react";
import { useBand } from "@/hooks/use-band";
import { Metric, PageHeader, Panel } from "@/components/states";
import { DeviceStatus, HeartChart, MedicineList, SosButton } from "@/components/widgets";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/app/elderly")({
  head: () => seo("Elderly Dashboard", "Heart rate, activity, medicine reminders, SOS and AI assistant for elderly users."),
  component: ElderlyDashboard,
});

function ElderlyDashboard() {
  const b = useBand();
  const r = b.reading;
  return (
    <>
      <PageHeader title="Elderly Dashboard" subtitle="Your health, reminders and help — in one place" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={HeartPulse} label="Heart rate" value={r?.heartRate} unit="BPM" loading={b.loading} offline={b.offline} />
        <Metric icon={Footprints} label="Steps today" value={r?.steps} loading={b.loading} offline={b.offline} />
        <Metric icon={Activity} label="Activity" value={r?.activity} loading={b.loading} offline={b.offline} />
        <DeviceStatus device={b.device} offline={b.offline} loading={b.loading} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Today's medicines" icon={Pill} className="lg:col-span-2"><MedicineList userId={b.userId} /></Panel>
        <SosButton userId={b.userId} />
        <Panel title="Heart rate today" icon={HeartPulse} className="lg:col-span-2"><HeartChart userId={b.userId} offline={b.offline} /></Panel>
        <Panel title="AI assistant" icon={Bot}>
          <p className="text-sm text-muted-foreground">Ask questions, hear reminders or call for help by voice in your language.</p>
          <Link to="/app/assistant" className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Talk to assistant</Link>
        </Panel>
      </div>
    </>
  );
}
