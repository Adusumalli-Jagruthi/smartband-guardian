import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type { GpsPoint } from "@/lib/api/types";
import { NotConnected, Waiting } from "./states";

const LiveMap = lazy(() => import("./live-map"));

export function MapView({ points, offline, className }: { points: GpsPoint[]; offline?: boolean | undefined; className?: string | undefined }) {
  const box = `flex items-center justify-center rounded-xl border border-dashed bg-muted/40 ${className ?? "h-72"}`;
  if (offline && points.length === 0) return <div className={box}><NotConnected /></div>;
  if (points.length === 0) return <div className={box}><Waiting label="Waiting for GPS fix from device" /></div>;
  const fallback = <div className={box}><Waiting label="Loading map…" /></div>;
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}><LiveMap points={points} className={`${className ?? "h-72"} w-full rounded-xl z-0`} /></Suspense>
    </ClientOnly>
  );
}
