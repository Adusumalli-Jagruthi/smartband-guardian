import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Baby, Bell, Bot, Cpu, HeartPulse, MapPin, Pill, ShieldCheck, Users, Activity, Radio, Battery } from "lucide-react";
import { Logo } from "@/components/app-shell";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => seo("AI + IoT Safety Band for Kids & Elders", "SmartBand keeps school kids and elderly people safe with live GPS, heart-rate, fall detection, SOS and medicine reminders."),
  component: Landing,
});

const features = [
  { icon: MapPin, title: "Live GPS tracking", text: "NEO-6M GPS with route history, so guardians always know where loved ones are." },
  { icon: HeartPulse, title: "Heart-rate monitoring", text: "A dedicated pulse sensor reports BPM with alerts for unusual readings." },
  { icon: Activity, title: "Activity & fall detection", text: "MPU6050 motion sensing tracks steps and detects sudden falls." },
  { icon: Bell, title: "One-press SOS", text: "Physical SOS button with buzzer instantly notifies every linked guardian." },
  { icon: Pill, title: "Medicine reminders", text: "Scheduled reminders with confirmations visible to caregivers." },
  { icon: Bot, title: "Multilingual AI assistant", text: "Voice and chat help in English, Hindi, Telugu, Tamil and more." },
];

const hardware = ["ESP32-C3 Mini", "NEO-6M GPS", "Pulse heart-rate sensor", "MPU6050", "SOS button", "Buzzer", "LiPo battery"];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent">Sign in</Link>
          <Link to="/register" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Get started</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-12 md:py-20 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary"><Radio className="h-3 w-3" /> AI + IoT wearable safety</span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight text-foreground md:text-6xl">
            Peace of mind, <span className="text-primary">on every wrist.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            SmartBand protects school kids and elderly people with live location, heart-rate, fall detection, SOS alerts and medicine reminders — all in one guardian dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-90">Create account <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/app/guardian" className="rounded-xl border px-6 py-3 font-semibold text-foreground hover:bg-accent">Open dashboard</Link>
          </div>
        </div>
        <div className="relative rounded-3xl border bg-card p-6 shadow-[var(--shadow-elegant)]">
          <div className="flex items-center justify-between">
            <p className="font-display font-semibold text-foreground">Guardian overview</p>
            <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">Preview</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[{ i: HeartPulse, l: "Heart rate" }, { i: MapPin, l: "Location" }, { i: Activity, l: "Activity" }, { i: Battery, l: "Battery" }].map(({ i: I, l }) => (
              <div key={l} className="rounded-xl bg-muted/60 p-4">
                <I className="h-5 w-5 text-primary" />
                <p className="mt-3 text-xs text-muted-foreground">{l}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">Live from band</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-destructive/10 p-4">
            <Bell className="h-5 w-5 text-destructive" />
            <p className="text-sm font-medium text-foreground">SOS alerts reach every guardian instantly</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <h2 className="font-display text-3xl font-bold text-foreground">Built for two families of care</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            { icon: Baby, t: "School kids", d: "Heart rate, GPS, activity, SOS and location history for the school run." },
            { icon: HeartPulse, t: "Elderly people", d: "Heart rate, activity, medicine reminders, SOS and a friendly AI assistant." },
            { icon: Users, t: "Guardians", d: "One dashboard for linked users, health status, GPS, medicine confirmations and alerts." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border bg-card p-6">
              <c.icon className="h-7 w-7 text-primary" />
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <h2 className="font-display text-3xl font-bold text-foreground">Everything a safety band should do</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 transition-shadow hover:shadow-[var(--shadow-card)]">
              <span className="inline-grid rounded-xl bg-accent p-3"><f.icon className="h-5 w-5 text-primary" /></span>
              <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="rounded-3xl bg-primary p-8 text-primary-foreground md:p-12">
          <div className="flex items-center gap-3"><Cpu className="h-6 w-6" /><h2 className="font-display text-2xl font-bold">Inside the band</h2></div>
          <div className="mt-6 flex flex-wrap gap-2">
            {hardware.map((h) => <span key={h} className="rounded-full bg-primary-foreground/15 px-4 py-2 text-sm font-medium">{h}</span>)}
          </div>
          <p className="mt-6 text-sm opacity-80">No SIM card required. The band measures heart rate and motion only — no SpO2 or temperature.</p>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-10 text-sm text-muted-foreground">
        <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> SmartBand Safety System</span>
        <span>© {2026} SmartBand</span>
      </footer>
    </div>
  );
}
