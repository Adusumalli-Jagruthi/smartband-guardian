const BASE = "https://api.thingspeak.com";

/** Verifies channel + read key by fetching the latest feed entry. */
async function verifyChannel({ channelId, readApiKey }) {
  if (!channelId) throw new Error("Channel ID is required");
  const url = new URL(`${BASE}/channels/${encodeURIComponent(channelId)}/feeds.json`);
  url.searchParams.set("results", "1");
  if (readApiKey) url.searchParams.set("api_key", readApiKey);
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`ThingSpeak error [${res.status}]: ${(await res.text()).slice(0, 200) || "channel not reachable"}`);
  const body = await res.json();
  if (body === -1 || !body.channel) throw new Error("ThingSpeak rejected the channel ID or read key");
  return { name: body.channel.name, lastEntryAt: body.feeds?.[0]?.created_at ?? null };
}

/** Mirrors a reading to ThingSpeak: field1=BPM, field2=steps, field3=battery, field4=lat, field5=lng. */
async function writeReading({ writeApiKey }, r) {
  if (!writeApiKey) return;
  const params = new URLSearchParams({ api_key: writeApiKey });
  const map = { field1: r.heartRate, field2: r.steps, field3: r.battery, field4: r.lat, field5: r.lng };
  for (const [k, v] of Object.entries(map)) if (v !== null && v !== undefined) params.set(k, String(v));
  const res = await fetch(`${BASE}/update`, { method: "POST", body: params, signal: AbortSignal.timeout(10000) });
  const text = await res.text();
  if (!res.ok || text.trim() === "0") throw new Error(`ThingSpeak write failed [${res.status}]: ${text.slice(0, 100)}`);
}
module.exports = { verifyChannel, writeReading };

/** Reads up to `results` feed entries (fields 1–8). Missing/blank values become null — never filled in. */
async function readFeeds({ channelId, readApiKey }, results = 100) {
  if (!channelId) throw new Error("ThingSpeak Channel ID is not configured");
  const url = new URL(`${BASE}/channels/${encodeURIComponent(channelId)}/feeds.json`);
  url.searchParams.set("results", String(Math.min(Math.max(results, 1), 8000)));
  if (readApiKey) url.searchParams.set("api_key", readApiKey);
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`ThingSpeak error [${res.status}]`);
  const body = await res.json();
  if (body === -1 || !body.channel) throw new Error("ThingSpeak rejected the channel ID or read key");
  const num = (v) => { if (v === null || v === undefined || String(v).trim() === "") return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
  const feeds = (body.feeds || []).map((f) => {
    const lat = num(f.field7), lng = num(f.field8);
    const validGps = lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
    return {
      timestamp: f.created_at, entryId: f.entry_id,
      temperatureF: num(f.field1), heartRate: num(f.field2), spo2: num(f.field3),
      accelX: num(f.field4), accelY: num(f.field5),
      panic: num(f.field6) === null ? null : num(f.field6) === 1,
      lat: validGps ? lat : null, lng: validGps ? lng : null,
    };
  });
  return { channelName: body.channel.name, lastEntryAt: body.channel.last_entry_id ? (feeds.at(-1)?.timestamp ?? null) : null, feeds };
}
module.exports.readFeeds = readFeeds;
