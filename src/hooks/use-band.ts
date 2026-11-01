import { useQuery } from "@tanstack/react-query";
import { deviceService, gpsService, sensorService } from "@/lib/api/services";
import { useSessionUser } from "@/lib/session";

const opts = { retry: false, refetchInterval: 15000 } as const;

/** Live band data for a user. `offline` = no reachable/online device. Values stay null when missing. */
export function useBand(userId?: string) {
  const session = useSessionUser();
  const id = userId ?? session?.id;
  const devices = useQuery({ queryKey: ["devices"], queryFn: deviceService.list, ...opts });
  const latest = useQuery({ queryKey: ["latest", id], queryFn: () => sensorService.latest(id!), enabled: !!id, ...opts });
  const gps = useQuery({ queryKey: ["gps", id], queryFn: () => gpsService.latest(id!), enabled: !!id, ...opts });

  const device = devices.data?.find((d) => !id || d.assignedTo === id || !d.assignedTo) ?? null;
  const offline = !devices.isLoading && (devices.isError || !device || device.status !== "online");
  return {
    userId: id, session, device, offline,
    loading: devices.isLoading,
    reading: latest.data ?? null,
    location: gps.data ?? null,
  };
}
