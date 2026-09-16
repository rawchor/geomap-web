# Geomap Web — Implementation Status

Tracks what's actually built in this repo against `PROJECT.md`, `ACCEPTANCE_CRITERIA.md`, `WEB_IMPLEMENTATION.md`, and the live `API_CONTRACT.json`. Update this alongside future feature branches rather than letting it drift.

Last updated: 2026-09-17, branch `feature/ios-parity-ui-upgrade` (on top of merged [PR #1](https://github.com/rawchor/geomap-web/pull/1)).

---

## Done

### Scaffold & auth (PR #1)
- Next.js (App Router, TypeScript, Tailwind, `src/` dir), Leaflet + react-leaflet.
- Login/register with the JWT held in an **httpOnly cookie** — the browser never sees the token. A BFF proxy layer (`src/app/api/**/route.ts`) attaches it as `Authorization: Bearer` when calling the real backend. Session helpers in [src/lib/session.ts](src/lib/session.ts), backend fetch wrapper in [src/lib/backend.ts](src/lib/backend.ts).
- `/map` is a server component that validates the session against `GET /auth/me` and redirects to `/login` on a missing/invalid token.

### iOS feature parity (this branch)
- **Status** ([src/components/StatusEditor.tsx](src/components/StatusEditor.tsx)): tap your own marker to open a search-over-DB-backed-presets editor, optional custom text (30-char cap, matching the live contract), expiry picker (1h / 4h / until changed), Clear Status. Proxied via `/api/status/presets`, `/api/status/me`, `/api/status`. Your own status renders as a bubble above your marker on the map.
- **Chat, as a popup widget** ([src/components/chat/](src/components/chat/)): a floating button (bottom-right, unread badge) opens a small popup panel — conversation list or an open thread — rather than a separate page/route.
  - REST: `/api/chat/conversations`, `/api/chat/[friendId]/messages` proxy the backend the same way as everything else.
  - Realtime: the backend's chat WebSocket auths via a raw JWT in the URL (`/ws/chat?token=`), which would have meant exposing the httpOnly-protected token to client JS. Instead, [server.mjs](server.mjs) is a **custom Next.js server** that relays the browser's same-origin `wss://.../ws/chat` connection to the backend, attaching the JWT server-side from the cookie — the token never reaches the browser. This replaces `next dev`/`next start` in `package.json`'s scripts.
  - Unread tracking mirrors a fix the iOS team found necessary: `GET /chat/conversations` has no `senderId`, so a self-sent message's own echo needs a short time-tolerance window (and immediate local optimism) to avoid being misread as an incoming unread. `lastRead` timestamps persist per-user in `localStorage`.
- **Subscription tier / locked friends**: `AuthResponse.subscriptionTier` and `NearbyFriendResponse.locked` are modeled; locked (out-of-radius preview) friends render as faded, non-interactive gray markers — no name/detail reveal, matching iOS's "faded, unlabeled" treatment. No paywall/upgrade UI, since billing is explicitly out of scope for MVP1.

### Nav & map redesign (this branch)
- **Navbar** ([src/components/Navbar.tsx](src/components/Navbar.tsx)): logo, refresh action, avatar/name with a dropdown (email + logout), premium badge when applicable — replacing the earlier plain text header. The public landing page got a matching lightweight header too.
- **Map look**: switched from plain OSM tiles to a Google-Maps-style presentation — a "Map / Satellite" layer toggle (top-left, to avoid Next's dev-mode overlay badge which otherwise collides bottom-left) backed by free, keyless tile sources: OpenStreetMap standard tiles for street view, Esri World Imagery for satellite. **Not** the real Google Maps API — that needs a billing-enabled API key, which `PROJECT.md` explicitly avoids; confirmed this trade-off with the user first. (Note: CARTO's basemap tiles were tried first but turned out to now require a key — they render a visible "API KEY REQUIRED" watermark for unauthenticated browser requests even though the HTTP status is a plain 200, so `curl` alone won't catch it.)
- Zoom control moved to bottom-right, matching Google Maps' conventional layout.

---

## Explicitly out of scope for web (confirmed, not gaps)
- No "Add Friend" flow — MultipeerConnectivity is iOS/mobile-only.
- No payment/subscription-purchase UI — `locked` friends are shown but not purchasable from web.
- No 20km radius visual boundary/grey-out overlay — `WEB_IMPLEMENTATION.md`'s web scope never listed this (reads as iOS-primary in `ACCEPTANCE_CRITERIA.md` §2).

## Verification done
- `next build`, `tsc --noEmit`, `eslint` all pass clean, including a real production-mode (`NODE_ENV=production`) smoke test of the custom server.
- Manually exercised end-to-end against a local mock backend (REST + a real WebSocket server): login/register, protected-route redirect, status set/save/clear across all three display states (preset, custom text, empty), the full chat loop (send → optimistic echo → realtime receive of a reply, verified via the actual browser↔server.mjs↔backend WebSocket relay, not just REST), locked-friend marker non-interactivity, satellite/map toggle, and mobile viewport (375px) layout.
- **Not yet run against the real `geomap-backend` service** — the backend was running locally during this session but without `SPRING_PROFILES_ACTIVE=dev`, so the seed endpoints needed to populate friends/chat data weren't available; testing used a mock backend on a separate port instead of touching the user's running process. Re-verify against the real backend with the dev profile active before merging.

## Not yet built
- Verification against the real backend (see above).
- Landing page marketing content beyond the placeholder.
- Anything from the iOS or backend repos.

## Known follow-ups
- `server.mjs`'s WebSocket relay is a single in-process proxy — fine for one instance, would need the same kind of session-registry rework the backend already anticipated (`ChatSessionRegistry`) if this ever runs on more than one instance.
- Chat has no read receipts or typing indicators, matching the backend's current scope.
