# Geomap Web — Implementation Status

Tracks what's actually built in this repo against `PROJECT.md`, `ACCEPTANCE_CRITERIA.md`, and `WEB_IMPLEMENTATION.md`. Update this alongside future feature branches rather than letting it drift.

Last updated: 2026-09-15, branch `feature/login-and-map` ([PR #1](https://github.com/rawchor/geomap-web/pull/1)).

---

## Done

### Scaffold
- Next.js (App Router, TypeScript, Tailwind, `src/` dir) via `create-next-app`
- Leaflet + react-leaflet for the map, OpenStreetMap tiles (no billing setup)
- `NEXT_PUBLIC_API_URL` env var for the backend base URL, `.env.local` gitignored

### Authentication
- [`/login`](src/app/login/page.tsx) — email/password form, inline error text surfaced verbatim from the backend response
- [`/register`](src/app/register/page.tsx) — display name/email/password form (see *Open deviation* below)
- JWT storage: **httpOnly cookie**, set server-side only. The token never reaches client JS — pages/components only ever see `{ userId, email, displayName }`.
- Implemented as a thin BFF proxy layer so the browser only ever talks to same-origin Next.js routes, which attach the cookie's token as `Authorization: Bearer` when calling the real backend:
  - [`POST /api/auth/login`](src/app/api/auth/login/route.ts)
  - [`POST /api/auth/register`](src/app/api/auth/register/route.ts)
  - [`POST /api/auth/logout`](src/app/api/auth/logout/route.ts) — clears the cookie
- Session cookie helpers: [`src/lib/session.ts`](src/lib/session.ts)
- Backend fetch helper (server-only, forwards the bearer token, normalizes error bodies): [`src/lib/backend.ts`](src/lib/backend.ts)

### Protected map route
- [`/map`](src/app/map/page.tsx) is a server component: reads the session cookie, calls `GET /auth/me` server-side, and redirects to `/login` if the token is missing or invalid (clearing the stale cookie in that case)

### Main map view
- [`MapView`](src/components/MapView.tsx) (client component):
  - Centers on the browser's Geolocation API result; falls back to a fixed default center if geolocation is denied/unavailable so the map still renders
  - Posts the user's coordinates to `POST /api/location` → backend `POST /location`, on load and every poll
  - Fetches `GET /api/friends/nearby` → backend `GET /friends/nearby` on load and every **15s** (within the 10–30s band from `ACCEPTANCE_CRITERIA.md`), plus a manual "Refresh" button
  - Loading, empty (`"No friends nearby yet"`), and error+retry states
  - On a 401 from the friends poll (expired/invalid session), redirects to `/login`
- [`LeafletMap`](src/components/LeafletMap.tsx): renders the user's own marker plus one marker per friend, colored by `degree` (`FIRST_DEGREE` vs `SECOND_DEGREE`) per the acceptance criteria's "equal prominence, no extra tap" requirement
- [`FriendDetailPanel`](src/components/FriendDetailPanel.tsx) (tap/click a marker):
  - Name + photo (initial-letter avatar fallback if no `profilePhotoUrl`)
  - Connection context: "Direct friend" for 1st-degree, "Friends with {mutualFriendName}" for 2nd-degree
  - Status: preset label (mapped from `StatusResponse.preset`) or `customText`, with a neutral "No status set" when `status` is `null` — not an error state
  - Dismissible via close button or tapping outside

### Landing page
- [`/`](src/app/page.tsx) — placeholder only, per `WEB_IMPLEMENTATION.md` ("don't build the landing page's marketing content in depth yet")

---

## Explicitly out of scope for web (confirmed, not gaps)

Per `ACCEPTANCE_CRITERIA.md` §7 and `WEB_IMPLEMENTATION.md`:
- No "Add Friend" flow — MultipeerConnectivity is iOS/mobile-only
- No status-setting UI on web (deferred to iOS)
- No 20km radius visual boundary/grey-out — `WEB_IMPLEMENTATION.md`'s web scope only lists centering + friend markers + popup, not the radius overlay from `ACCEPTANCE_CRITERIA.md` §2 (which reads as iOS-primary)

## Open deviation from the spec doc (flagged, not yet re-confirmed)

- `WEB_IMPLEMENTATION.md` listed registration UI as optional/TBD for web. I built `/register` anyway since `ACCEPTANCE_CRITERIA.md` §1 lists "register with email + password" as a plain requirement with no platform restriction. Revert if you'd rather registration only happen via iOS.

## Open questions resolved during implementation

1. **Token storage** → httpOnly cookie via Next.js route handlers (more secure than `localStorage`; chosen by user over the simpler client-side-store option)
2. **Web posting its own location** → yes, via the browser Geolocation API (chosen over "just render whatever's on file from iOS")

## Verification done

- `next build`, `tsc --noEmit`, `eslint` all pass clean
- Manually exercised end-to-end against a local mock backend standing in for the real Spring Boot service: register/login success + error paths, protected-route redirect, map rendering with both friend degrees, all three detail-panel status states (preset/custom/empty), empty-friends state, `/api/location` round trip, logout clearing the cookie
- **Not yet run against the real `geomap-backend` service** — do that before merging

## Not yet built (next candidates)

- Landing page marketing content (currently a placeholder, deliberately deferred)
- Verification against the real backend once it's running
- Anything from the iOS or backend repos — out of scope for `geomap-web`
