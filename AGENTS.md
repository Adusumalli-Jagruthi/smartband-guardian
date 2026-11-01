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
