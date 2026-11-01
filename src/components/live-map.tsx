import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GpsPoint } from "@/lib/api/types";

/** Renders only real GPS points supplied by the backend. */
export default function LiveMap({ points, className }: { points: GpsPoint[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || points.length === 0) return;
    const map = L.map(ref.current);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors", maxZoom: 19,
    }).addTo(map);
    const latlngs: [number, number][] = points.map((p) => [p.lat, p.lng] as [number, number]);
    if (latlngs.length > 1) L.polyline(latlngs, { color: "#0d9488", weight: 4 }).addTo(map);
    const last = latlngs[latlngs.length - 1]!;
    L.circleMarker(last, { radius: 9, color: "#0f2a4a", fillColor: "#14b8a6", fillOpacity: 1, weight: 3 }).addTo(map);
    if (latlngs.length > 1) map.fitBounds(L.latLngBounds(latlngs), { padding: [24, 24] });
    else map.setView(last, 16);
    return () => { map.remove(); };
  }, [points]);
  return <div ref={ref} className={className ?? "h-72 w-full rounded-xl"} />;
}
