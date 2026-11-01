import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pill, Plus } from "lucide-react";
import { medicineService } from "@/lib/api/services";
import { apiErrorMessage } from "@/lib/api/client";
import { requireRole, useSessionUser } from "@/lib/session";
import { PageHeader, Panel } from "@/components/states";
import { MedicineList } from "@/components/widgets";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/app/medicines")({
  beforeLoad: requireRole(["elderly"]),
  head: () => seo("Medicine Schedules", "Schedule medicines, get band reminders and confirm doses."),
  component: Medicines,
});

const input = "w-full rounded-lg border bg-background px-3 py-2 text-sm";

function Medicines() {
  const user = useSessionUser();
  const qc = useQueryClient();
  const [f, setF] = useState({ name: "", dosage: "", time: "08:00" });
  const add = useMutation({
    mutationFn: () => medicineService.create(user!.id, f),
    onSuccess: () => { setF({ name: "", dosage: "", time: "08:00" }); qc.invalidateQueries({ queryKey: ["meds", user?.id] }); },
  });
  return (
    <>
      <PageHeader title="Medicine Schedules" subtitle="The band buzzes at each time; confirm when taken." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Schedule" icon={Pill} className="lg:col-span-2"><MedicineList userId={user?.id} /></Panel>
        <Panel title="Add medicine" icon={Plus}>
          <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="space-y-3">
            <input required placeholder="Medicine name" className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input required placeholder="Dosage (e.g. 1 tablet)" className={input} value={f.dosage} onChange={(e) => setF({ ...f, dosage: e.target.value })} />
            <input required type="time" className={input} value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />
            {add.isError && <p className="text-sm text-destructive">{apiErrorMessage(add.error)}</p>}
            <button disabled={!user || add.isPending} className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Add to schedule</button>
            {!user && <p className="text-xs text-muted-foreground">Sign in to add medicines.</p>}
          </form>
        </Panel>
      </div>
    </>
  );
}
