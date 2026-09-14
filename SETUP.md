# Geomap Web — Setup Steps

## 1. Scaffold the project

```bash
cd ~/path/to/geomap-web
npx create-next-app@latest .
```
Choices: TypeScript, ESLint, Tailwind CSS, App Router, `src/` directory, default import alias.

## 2. Install the map library

```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

## 3. Environment config

Create `.env.local` in the project root:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```
Confirm `.env.local` is listed in `.gitignore`.

## 4. Add the docs to the repo root

Copy these five files (uploaded manually) into the `geomap-web` root:
- `PROJECT.md`
- `ACCEPTANCE_CRITERIA.md`
- `API_CONTRACT.json` (copy from `geomap-backend` once exported)
- `WEB_IMPLEMENTATION.md`
- This file (`SETUP.md`)

## 5. Commit the initial scaffold

Set `package.json`'s `"version"` field to `0.1.0-SNAPSHOT` first, then:
```bash
git add .
git commit -m "[WEB-v0.1.0-SNAPSHOT] Initial Next.js project structure"
git push origin main
```

## 6. Open in Claude Code — initial prompt

```
Read PROJECT.md, ACCEPTANCE_CRITERIA.md, and WEB_IMPLEMENTATION.md, then
check API_CONTRACT.json for exact request/response shapes. Let's start
with the login page and auth flow on a new branch feature/login-and-map.
```
