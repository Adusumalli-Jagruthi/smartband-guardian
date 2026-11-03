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
