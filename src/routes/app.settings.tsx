import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link2, UserCircle } from "lucide-react";
import { integrationService, userService } from "@/lib/api/services";
import { API_BASE_URL, apiErrorMessage } from "@/lib/api/client";
import { useSessionUser } from "@/lib/session";
import { PageHeader, Panel } from "@/components/states";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/settings")({
  head: () => seo("Settings & Profile", "Manage your SmartBand profile, language and integrations."),
  component: Settings,
});

const integrations = [
  { key: "pushNotifications", label: "Push notifications", desc: "Browser alerts for SOS and falls" },
  { key: "emailAlerts", label: "Email alerts", desc: "Send alerts to guardian email" },
  { key: "whatsappAlerts", label: "WhatsApp alerts", desc: "Forward SOS via backend messaging provider" },
  { key: "fallDetection", label: "Fall detection", desc: "Use MPU6050 to detect falls" },
  { key: "heartRateAlerts", label: "Heart-rate alerts", desc: "Alert when BPM is outside safe range" },
];

function Settings() {
  const user = useSessionUser();
  const [p, setP] = useState({ name: "", phone: "", language: "en-IN" });
  useEffect(() => { if (user) setP({ name: user.name, phone: user.phone ?? "", language: user.language ?? "en-IN" }); }, [user]);
  const save = useMutation({ mutationFn: () => userService.update(user!.id, p) });
  const iq = useQuery({ queryKey: ["integrations"], queryFn: integrationService.get, retry: false });
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  useEffect(() => { if (iq.data) setToggles(iq.data); }, [iq.data]);
  const saveInt = useMutation({ mutationFn: integrationService.update });

  return (
    <>
      <PageHeader title="Settings & Profile" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Profile" icon={UserCircle}>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
            <label className="block text-sm font-medium text-foreground">Name<input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" /></label>
            <label className="block text-sm font-medium text-foreground">Email<input disabled value={user?.email ?? ""} className="mt-1 w-full rounded-lg border bg-muted px-3 py-2 text-sm" /></label>
            <label className="block text-sm font-medium text-foreground">Phone<input value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" /></label>
            <label className="block text-sm font-medium text-foreground">Language
              <select value={p.language} onChange={(e) => setP({ ...p, language: e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="en-IN">English</option><option value="hi-IN">Hindi</option><option value="te-IN">Telugu</option><option value="ta-IN">Tamil</option><option value="kn-IN">Kannada</option><option value="ml-IN">Malayalam</option>
              </select></label>
            {save.isError && <p className="text-sm text-destructive">{apiErrorMessage(save.error)}</p>}
            {save.isSuccess && <p className="text-sm text-success">Saved.</p>}
            <button disabled={!user} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Save profile</button>
          </form>
        </Panel>
        <Panel title="Integrations" icon={Link2}>
          <ul className="divide-y">
            {integrations.map((i) => {
              const on = !!toggles[i.key];
              return (
                <li key={i.key} className="flex items-center justify-between gap-4 py-3">
                  <div><p className="text-sm font-semibold text-foreground">{i.label}</p><p className="text-xs text-muted-foreground">{i.desc}</p></div>
                  <button role="switch" aria-checked={on} aria-label={i.label} onClick={() => setToggles({ ...toggles, [i.key]: !on })}
                    className={cn("relative h-6 w-11 rounded-full transition", on ? "bg-primary" : "bg-muted")}>
                    <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all", on ? "left-5" : "left-0.5")} />
                  </button>
                </li>
              );
            })}
          </ul>
          {saveInt.isError && <p className="text-sm text-destructive">{apiErrorMessage(saveInt.error)}</p>}
          <button onClick={() => saveInt.mutate(toggles)} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Save integrations</button>
          <p className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            Backend: {API_BASE_URL || "not configured — set VITE_API_BASE_URL"}. API keys for messaging or AI providers stay on the backend only.
          </p>
        </Panel>
      </div>
    </>
  );
}
