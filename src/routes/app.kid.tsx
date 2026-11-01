import { requireRole } from "@/lib/session";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, Footprints, HeartPulse, History, MapPin } from "lucide-react";
import { useBand } from "@/hooks/use-band";
import { Metric, PageHeader, Panel, StatusPill } from "@/components/states";
import { MapView } from "@/components/map-view";
import { AlertList, DeviceStatus, HeartChart, SosButton } from "@/components/widgets";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/app/kid")({
  beforeLoad: requireRole(["kid"]),
  head: () => seo("School Kid Dashboard", "Heart rate, GPS, activity, SOS and history for school kids."),
  component: KidDashboard,
});

function KidDashboard() {
  const b = useBand();
  const r = b.reading;
  return (
    <>
      <PageHeader title={`Hi${b.session ? `, ${b.session.name.split(" ")[0]}` : ""} 👋`} subtitle="Heart rate, location, activity and SOS" action={<StatusPill offline={b.offline} hasData={!!r} loading={b.loading} />} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={HeartPulse} label="Heart rate" value={r?.heartRate} unit="BPM" loading={b.loading} offline={b.offline} />
        <Metric icon={Footprints} label="Steps today" value={r?.steps} loading={b.loading} offline={b.offline} />
        <Metric icon={Activity} label="Activity" value={r?.activity} loading={b.loading} offline={b.offline} />
        <DeviceStatus device={b.device} offline={b.offline} loading={b.loading} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Live location" icon={MapPin} className="lg:col-span-2"><MapView points={b.location ? [b.location] : []} offline={b.offline} /></Panel>
        <SosButton userId={b.userId} />
        <Panel title="Heart rate today" icon={HeartPulse} className="lg:col-span-2"><HeartChart userId={b.userId} offline={b.offline} /></Panel>
        <Panel title="History & alerts" icon={History}><AlertList userId={b.userId} limit={5} /></Panel>
      </div>
    </>
  );
}
