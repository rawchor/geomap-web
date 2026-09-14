# Geomap Web — Implementation Instructions

Purpose: validate the backend end-to-end (per the agreed plan — web before iOS) and serve as the public landing page + logged-in web companion, per `PROJECT.md`'s scope. This is intentionally a subset of the full mobile feature set.

Read `API_CONTRACT.json` (exported from the backend's live OpenAPI spec) for exact request/response shapes before implementing anything below — that file is the source of truth, not this doc's examples.

---

## Stack

- Next.js (React, TypeScript, App Router) — already scaffolded via `create-next-app`
- Leaflet + react-leaflet for the map (OpenStreetMap tiles, no billing setup)
- Fetch or a thin wrapper (`fetch`-based API client) for calling the backend — no need for a heavier data-fetching library at this scale

---

## Scope for MVP1 web (per `PROJECT.md` and `ACCEPTANCE_CRITERIA.md`)

**In scope:**
- Landing page (public, unauthenticated)
- Login page
- Main map view: shows nearby friends (1st- and 2nd-degree, visually distinguished) via `GET /friends/nearby`
- Tap/click a friend icon → detail popup (name, connection context, status)

**Explicitly out of scope for web (per `ACCEPTANCE_CRITERIA.md` Section 7):**
- Adding friends — MultipeerConnectivity is iOS/mobile-only by nature; web has no "Add Friend" flow
- Setting your own status (defer to iOS for MVP1, unless you want this added to web too — flag if so)
- Registration UI is optional for MVP1 — confirm whether you want a web register form, or whether registration happens only via iOS for now and web is login-only

---

## Pages

### 1. Landing page (`/`)
- Public, unauthenticated
- Simple marketing page: what the app does, a login link/button
- No API calls needed here

### 2. Login page (`/login`)
- Email + password form
- On submit: `POST /auth/login` (see `API_CONTRACT.json` for exact request/response shape)
- On success: store the returned JWT, redirect to `/map`
- On failure: show the backend's error message inline (don't invent custom copy — surface what the API returns)

**Token storage**: use an httpOnly cookie set by a Next.js API route/server action if you want it inaccessible to client-side JS (more secure), or `localStorage`/a client-side store if simplicity matters more for MVP1. Recommend httpOnly cookie — flag if you'd rather keep it simpler for now and revisit later.

### 3. Map page (`/map`)
- Protected route — redirect to `/login` if no valid token
- On load: call `GET /auth/me` to validate the stored token (matches the "session persists" pattern from the backend); if it fails (expired/invalid token), clear the stored token and redirect to `/login`
- Center the Leaflet map on the user's own location
  - **Note**: web won't have a native GPS location-posting flow like iOS does in MVP1 — for now, either (a) use the browser's Geolocation API to get the user's coordinates and call `POST /location` on load/periodically, or (b) simply render the map centered on whatever location the backend already has on file for this user (posted from their iOS app). Recommend (a) if you want web to be a fully standalone client; flag which you want.
- Call `GET /friends/nearby` on load, and re-poll every 10–30s to match the acceptance criteria's decided refresh rate
- Render each friend as a Leaflet marker:
  - Different marker style/border for `FIRST_DEGREE` vs `SECOND_DEGREE` (per `degree` field in the response)
  - Click a marker → open a popup/panel showing `displayName`, `profilePhotoUrl` (if present), connection context (`mutualFriendName` for 2nd-degree only), and `status` (if non-null — render nothing/empty state if `status` is `null`, per the "empty status is valid" decision)

---

## Error and loading states

- Loading skeleton or spinner while `/friends/nearby` is in flight
- Empty state ("No friends nearby yet") when the response is an empty array — this is a valid, expected state per the backend's edge-case handling, not an error
- Network/server error state with a retry action

---

## Environment config

- Backend base URL via an environment variable (`NEXT_PUBLIC_API_URL` or similar), not hardcoded — so it's easy to point at localhost during dev and a real host later
- `.env.local` for local dev, gitignored (Spring Initializr's/Next's default `.gitignore` should already cover this — confirm)

---

## Instructions for Claude Code

1. Read `PROJECT.md`, `ACCEPTANCE_CRITERIA.md`, and `API_CONTRACT.json` (copy the latter in from the backend repo, or `/add-dir` it temporarily) before starting
2. Build on a branch: `feature/login-and-map`
3. Follow the same commit versioning convention as backend, adapted for web — prefix `WEB`, version tracked in `package.json`'s `version` field instead of `pom.xml`. Format: `[WEB-vX.Y.Z] Description`
4. Start with the login page and auth flow, then the map page — don't build the landing page's marketing content in depth yet, a placeholder is fine for MVP1
5. Confirm the two open questions above (token storage approach, and whether web posts its own location via browser Geolocation) before/while implementing, rather than guessing silently
