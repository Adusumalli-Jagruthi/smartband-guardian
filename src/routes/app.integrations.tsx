import { createFileRoute } from "@tanstack/react-router";
import { Bot, Lock, Radio, Send } from "lucide-react";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/states";
import { IntegrationCard, type FieldDef } from "@/components/integration-card";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/app/integrations")({
  beforeLoad: requireRole(["guardian"]),
  head: () => seo("Integrations & API", "Configure ThingSpeak, Telegram alerts and the AI provider for SmartBand."),
  component: Integrations,
});

const thingspeak: FieldDef[] = [
  { key: "channelId", label: "Channel ID", help: "The numeric ID of the ThingSpeak channel your band uploads to.", placeholder: "e.g. 2345678" },
  { key: "readApiKey", label: "Read API Key", help: "Lets SmartBand read sensor data from the channel.", secret: true, placeholder: "16-character key" },
  { key: "writeApiKey", label: "Write API Key", help: "Used by the ESP32 band to upload readings.", secret: true, placeholder: "16-character key" },
];
const telegram: FieldDef[] = [
  { key: "botToken", label: "Telegram Bot Token", help: "From @BotFather when you create the bot.", secret: true, placeholder: "123456:ABC-…" },
  { key: "chatId", label: "Chat ID", help: "The chat or group that receives SOS and alert messages.", placeholder: "e.g. -1001234567890" },
];
const ai: FieldDef[] = [
  { key: "provider", label: "AI provider", help: "Which service powers the assistant. Others act as fallback on your backend.",
    options: [{ value: "nvidia_nim", label: "NVIDIA NIM" }, { value: "groq", label: "Groq" }, { value: "other", label: "Other" }] },
  { key: "apiKey", label: "API Key", help: "Your provider key. Stored encrypted on the server only.", secret: true, placeholder: "nvapi-… / gsk_…" },
  { key: "model", label: "Model name", help: "Exact model ID offered by the provider.", placeholder: "e.g. meta/llama-3.1-70b-instruct" },
];

function Integrations() {
  return (
    <>
      <PageHeader title="Integrations & API" subtitle="Connect cloud data, alert channels and the AI assistant" />
      <p className="mb-6 flex items-start gap-2 rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        Credentials are sent directly to the SmartBand server, encrypted there, and never shown again in full or stored in this browser.
      </p>
      <div className="grid gap-5 xl:grid-cols-2">
        <IntegrationCard name="thingspeak" title="ThingSpeak" description="IoT cloud channel for band sensor data." icon={Radio}
          fields={thingspeak} enableLabel="Enable integration" lastLabel="Last successful sync" testLabel="Test connection" />
        <IntegrationCard name="telegram" title="Telegram Bot" description="Send SOS and health alerts to Telegram." icon={Send}
          fields={telegram} enableLabel="Enable notifications" lastLabel="Last notification sent" testLabel="Send test notification" />
        <IntegrationCard name="ai" title="AI Provider" description="Powers the multilingual chat and voice assistant." icon={Bot}
          fields={ai} enableLabel="Enable AI assistant" lastLabel="Last successful test" testLabel="Test connection" />
      </div>
    </>
  );
}
