import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { requireRole, useSessionUser } from "@/lib/session";
import { PageHeader, Panel } from "@/components/states";
import { AlertList, SosButton } from "@/components/widgets";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/app/alerts")({
  beforeLoad: requireRole(["kid", "elderly", "guardian"]),
  head: () => seo("SOS & Alerts", "SOS button events, fall detection, heart-rate and medicine alerts."),
  component: Alerts,
});

function Alerts() {
  const user = useSessionUser();
  return (
    <>
      <PageHeader title="SOS & Notifications" subtitle="SOS presses, falls, abnormal heart rate, missed medicines and device events" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="All alerts" icon={Bell} className="lg:col-span-2"><AlertList userId={user?.role === "guardian" ? undefined : user?.id} /></Panel>
        <SosButton userId={user?.id} />
      </div>
    </>
  );
}
