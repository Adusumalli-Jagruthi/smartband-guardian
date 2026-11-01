import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Bot, Loader2, Mic, MicOff, Send, Square, Trash2, Volume2, VolumeX } from "lucide-react";
import { aiService } from "@/lib/api/services";
import { apiErrorMessage } from "@/lib/api/client";
import { requireRole } from "@/lib/session";
import { PageHeader, Panel } from "@/components/states";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/assistant")({
  beforeLoad: requireRole(["elderly"]),
  head: () => seo("AI Assistant", "Friendly multilingual chat and voice assistant for SmartBand users."),
  component: Assistant,
});

export const LANGUAGES = [
  { code: "en-IN", label: "English" }, { code: "te-IN", label: "తెలుగు · Telugu" }, { code: "ta-IN", label: "தமிழ் · Tamil" },
  { code: "hi-IN", label: "हिन्दी · Hindi" }, { code: "ml-IN", label: "മലയാളം · Malayalam" }, { code: "bn-IN", label: "বাংলা · Bengali" },
  { code: "mr-IN", label: "मराठी · Marathi" }, { code: "gu-IN", label: "ગુજરાતી · Gujarati" },
];

const SUGGESTIONS = ["When should I take my medicine?", "How do I send an SOS?", "Is my band connected?", "How do I add a medicine?"];
const STORE = "smartband_chat";

type Msg = { role: "user" | "assistant"; content: string; error?: boolean };
type SR = { lang: string; interimResults: boolean; start: () => void; stop: () => void; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onerror: (e: { error: string }) => void; onend: () => void };

function getRecognition(): (new () => SR) | null {
  const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function Assistant() {
  const [lang, setLang] = useState("en-IN");
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [voiceIn, setVoiceIn] = useState(true);
  const [voiceOut, setVoiceOut] = useState(true);
  const [notice, setNotice] = useState("");
  const [loaded, setLoaded] = useState(false);
  const rec = useRef<SR | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Restore history + capability checks after hydration.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) ?? "null");
      if (saved?.msgs) setMsgs(saved.msgs);
      if (saved?.lang) setLang(saved.lang);
    } catch { /* ignore */ }
    setVoiceIn(!!getRecognition());
    setVoiceOut("speechSynthesis" in window);
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(STORE, JSON.stringify({ msgs, lang })); }, [msgs, lang, loaded]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  function speak(t: string) {
    if (!voiceOut) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = lang; u.rate = 0.92;
    const v = window.speechSynthesis.getVoices().find((x) => x.lang === lang || x.lang.startsWith(lang.slice(0, 2)));
    if (v) u.voice = v;
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }
  function stopSpeaking() { window.speechSynthesis.cancel(); setSpeaking(false); }

  async function send(raw: string) {
    const message = raw.trim();
    if (!message || busy) return;
    const history = msgs.filter((m) => !m.error).slice(-12).map(({ role, content }) => ({ role, content }));
    setMsgs((m) => [...m, { role: "user", content: message }]);
    setText(""); setBusy(true); setNotice("");
    try {
      const r = await aiService.chat({ message, language: lang, history });
      setMsgs((m) => [...m, { role: "assistant", content: r.reply }]);
      if (autoSpeak) speak(r.reply);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: `Sorry, I can't reach the assistant right now. ${apiErrorMessage(e)}`, error: true }]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function toggleMic() {
    const Ctor = getRecognition();
    if (!Ctor) { setNotice("Voice input isn't supported in this browser. Please type your message, or try Chrome or Edge."); return; }
    if (listening) { rec.current?.stop(); return; }
    stopSpeaking();
    const r = new Ctor(); r.lang = lang; r.interimResults = false;
    r.onresult = (e) => { const t = e.results[0]?.[0]?.transcript; if (t) send(t); };
    r.onerror = (e) => setNotice(e.error === "not-allowed" ? "Microphone permission was denied. Allow it in your browser settings." : "I couldn't hear that. Please try again.");
    r.onend = () => setListening(false);
    rec.current = r;
    try { r.start(); setListening(true); setNotice(""); } catch { setNotice("Couldn't start the microphone."); }
  }

  function clearChat() { stopSpeaking(); setMsgs([]); }

  return (
    <>
      <PageHeader title="AI Assistant" subtitle="Talk or type — I'm here to help with medicines, safety and the app."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value)} className="rounded-xl border bg-card px-3 py-2 text-sm font-medium">
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <button onClick={() => setAutoSpeak((v) => !v)} disabled={!voiceOut} aria-pressed={autoSpeak} title="Read replies aloud"
              className={cn("flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium disabled:opacity-40", autoSpeak && voiceOut && "border-primary bg-accent text-primary")}>
              {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}<span className="hidden sm:inline">Voice replies</span>
            </button>
            <button onClick={clearChat} disabled={!msgs.length} className="flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-40">
              <Trash2 className="h-4 w-4" /><span className="hidden sm:inline">Clear chat</span>
            </button>
          </div>
        } />

      {(!voiceIn || !voiceOut) && (
        <p className="mb-3 flex items-center gap-2 rounded-xl bg-warning/15 px-4 py-2 text-sm text-foreground">
          <AlertCircle className="h-4 w-4 text-warning" />
          {!voiceIn && !voiceOut ? "Voice isn't supported in this browser — text chat still works." : !voiceIn ? "Voice input isn't supported here — please type. Replies can still be read aloud." : "Reading replies aloud isn't supported in this browser."}
        </p>
      )}

      <Panel className="flex h-[calc(100vh-14rem)] min-h-[28rem] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1" aria-live="polite">
          {msgs.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-accent"><Bot className="h-8 w-8 text-primary" /></span>
              <p className="mt-4 font-display text-xl font-semibold text-foreground">How can I help you today?</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">Press the microphone and speak, or type below. I don't give medical treatment — in an emergency, press SOS.</p>
              <div className="mt-6 flex max-w-xl flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border px-4 py-2 text-sm text-foreground hover:bg-accent">{s}</button>)}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "assistant" && <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent"><Bot className="h-4 w-4 text-primary" /></span>}
              <div className={cn("max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-base leading-relaxed",
                m.role === "user" ? "bg-primary text-primary-foreground" : m.error ? "bg-destructive/10 text-destructive" : "text-foreground")}>
                {m.content}
                {m.role === "assistant" && !m.error && voiceOut && (
                  <button onClick={() => speak(m.content)} className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary"><Volume2 className="h-3.5 w-3.5" /> Read aloud</button>
                )}
              </div>
            </div>
          ))}
          {busy && <div className="flex items-center gap-2 pl-11 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Thinking…</div>}
          <div ref={endRef} />
        </div>

        {notice && <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm text-foreground">{notice}</p>}
        {speaking && <button onClick={stopSpeaking} className="mt-3 flex items-center gap-2 self-start rounded-lg border px-3 py-1.5 text-sm"><Square className="h-3.5 w-3.5" /> Stop speaking</button>}

        <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="mt-4 flex items-end gap-2">
          <button type="button" onClick={toggleMic} aria-label={listening ? "Stop listening" : "Speak"} aria-pressed={listening}
            className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl border transition", listening ? "border-destructive bg-destructive text-destructive-foreground animate-pulse" : "bg-accent text-primary hover:opacity-90", !voiceIn && "opacity-50")}>
            {listening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>
          <textarea ref={inputRef} autoFocus rows={1} value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
            placeholder={listening ? "Listening…" : "Type your message…"} aria-label="Message"
            className="min-h-14 flex-1 resize-none rounded-2xl border bg-background px-4 py-4 text-base outline-none focus:ring-2 focus:ring-ring" />
          <button disabled={busy || !text.trim()} aria-label="Send" className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground disabled:opacity-40"><Send className="h-5 w-5" /></button>
        </form>
      </Panel>
    </>
  );
}
