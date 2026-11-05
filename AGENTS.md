<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All backend calls go through `src/lib/api/services.ts` (single Axios instance in `client.ts`, base URL from `VITE_API_BASE_URL`); backend is external, no Supabase/Firebase.
- UI must never fabricate sensor/GPS values: use `DataState`/`Waiting`/`NotConnected` from `src/components/states.tsx`.
- Leaflet is only loaded via `MapView` (lazy + ClientOnly) because it touches `window` at import.
- Role-based access: `/app` is client-only (session in localStorage); every `/app/*` route declares `beforeLoad: requireRole([...])`, and sidebar items come from `roleNav` in `app-shell.tsx` — keep both in sync when adding pages.
- AI chat calls only `aiService.chat` (backend proxies NVIDIA NIM + fallback); voice uses browser SpeechRecognition/SpeechSynthesis with visible fallbacks.
- Integration credentials (ThingSpeak, Telegram, AI provider) go only to the external backend via `integrationConfigService`; the UI shows backend-masked values and never persists secrets client-side.
- The backend lives in `server/` (Express + Mongoose, CommonJS, not part of the Vite build); its routes must mirror `src/lib/api/services.ts` — change both together.
- ThingSpeak is read only by the backend (`/api/thingspeak/:userId/feeds`) using the member's or a linked guardian's encrypted config; the UI polls every 20 s via `ThingSpeakPanel` and shows "--" for missing values.
- Guardian linking: member generates a one-time code (hash stored, 15 min TTL); guardian submit creates a pending LinkRequest; only member approval adds to member.guardians, which is the sole source of access.
