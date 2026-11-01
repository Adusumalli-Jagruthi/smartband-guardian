import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bot, Loader2, Mic, MicOff, Send, Volume2 } from "lucide-react";
import { aiService } from "@/lib/api/services";
import { apiErrorMessage } from "@/lib/api/client";
import { PageHeader, Panel } from "@/components/states";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/assistant")({
  head: () => seo("AI Assistant", "Multilingual AI chat and voice assistant for SmartBand users."),
  component: Assistant,
});

const languages = [
  { code: "en-IN", label: "English" }, { code: "hi-IN", label: "हिन्दी" }, { code: "te-IN", label: "తెలుగు" },
  { code: "ta-IN", label: "தமிழ்" }, { code: "kn-IN", label: "ಕನ್ನಡ" }, { code: "ml-IN", label: "മലയാളം" },
];

type Msg = { from: "me" | "ai"; text: string };
type SR = { lang: string; interimResults: boolean; start: () => void; stop: () => void; onresult: (e: { results: { 0: { transcript: string } }[] }) => void; onend: () => void };

function Assistant() {
  const [lang, setLang] = useState("en-IN");
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const rec = useRef<SR | null>(null);

  async function send(message: string) {
    if (!message.trim()) return;
    setMsgs((m) => [...m, { from: "me", text: message }]); setText(""); setBusy(true);
    try {
      const r = await aiService.chat({ message, language: lang });
      setMsgs((m) => [...m, { from: "ai", text: r.reply }]);
    } catch (e) {
      setMsgs((m) => [...m, { from: "ai", text: `Assistant unavailable: ${apiErrorMessage(e)}` }]);
    } finally { setBusy(false); }
  }

  function speak(t: string) {
    const u = new SpeechSynthesisUtterance(t); u.lang = lang; window.speechSynthesis.speak(u);
  }

  function toggleMic() {
    const W = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) { setMsgs((m) => [...m, { from: "ai", text: "Voice input isn't supported in this browser." }]); return; }
    if (listening) { rec.current?.stop(); return; }
    const r = new Ctor(); r.lang = lang; r.interimResults = false;
    r.onresult = (e) => send(e.results[0]?.[0].transcript ?? "");
    r.onend = () => setListening(false);
    rec.current = r; r.start(); setListening(true);
  }

  return (
    <>
      <PageHeader title="AI Assistant" subtitle="Chat or speak in your language"
        action={<select value={lang} onChange={(e) => setLang(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm">
          {languages.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select>} />
      <Panel className="flex h-[70vh] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {msgs.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <Bot className="h-10 w-10 text-primary" />
              <p className="mt-3 text-sm">Ask about medicines, your day, or say "help" to alert guardians.</p>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] rounded-2xl px-4 py-2 text-sm", m.from === "me" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                {m.text}
                {m.from === "ai" && <button aria-label="Read aloud" onClick={() => speak(m.text)} className="ml-2 inline-flex align-middle text-primary"><Volume2 className="h-4 w-4" /></button>}
              </div>
            </div>
          ))}
          {busy && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="mt-4 flex gap-2">
          <button type="button" onClick={toggleMic} aria-label="Voice input" className={cn("rounded-xl border p-3", listening && "border-destructive bg-destructive/10 text-destructive")}>
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" className="flex-1 rounded-xl border bg-background px-4 text-sm" />
          <button disabled={busy} className="rounded-xl bg-primary px-4 text-primary-foreground disabled:opacity-50" aria-label="Send"><Send className="h-5 w-5" /></button>
        </form>
      </Panel>
    </>
  );
}
