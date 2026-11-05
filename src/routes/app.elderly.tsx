import { requireRole } from "@/lib/session";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Bot, Footprints, HeartPulse, Pill } from "lucide-react";
import { useBand } from "@/hooks/use-band";
import { Metric, PageHeader, Panel, StatusPill } from "@/components/states";
import { DeviceStatus, HeartChart, MedicineList, SosButton } from "@/components/widgets";
import { ThingSpeakPanel } from "@/components/thingspeak-panel";
import { LinkGuardianPanel } from "@/components/link-panels";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/app/elderly")({
  beforeLoad: requireRole(["elderly"]),
  head: () => seo("Elderly Dashboard", "Heart rate, activity, medicine reminders, SOS and AI assistant for elderly users."),
  component: ElderlyDashboard,
});

function ElderlyDashboard() {
  const b = useBand();
  const r = b.reading;
  return (
    <>
      <PageHeader title={`Hello${b.session ? `, ${b.session.name.split(" ")[0]}` : ""}`} subtitle="Your health, reminders and help — in one place" action={<StatusPill offline={b.offline} hasData={!!r} loading={b.loading} />} />
      <h2 className="mb-3 font-display text-lg font-semibold">Live health (ThingSpeak)</h2>
      <ThingSpeakPanel userId={b.userId} sections={["vitals", "sos", "charts"]} />
      <div className="mt-8"><LinkGuardianPanel /></div>
      <h2 className="mb-3 mt-8 font-display text-lg font-semibold">Reminders & help</h2>
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
