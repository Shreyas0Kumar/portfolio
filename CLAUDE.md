# Shreyas Portfolio — start here

**Read `README.md` first, especially the `## Roadmap` section.** It is the source
of truth for what's done and what's next. This file is just orientation; keep both
in sync as the project evolves.

## What this is

An interactive macOS-style portfolio (React + Vite + Spline 3D room) that "boots"
into a desktop of working apps. Mobile gets a scrollable portfolio plus a "open on
desktop" handoff screen. Live at https://portfolio.shreyas.space.

## How it ships

- **Cloudflare Pages**, native Git integration: a `git push` to `main` auto-builds
  (`npm run build` → `dist`) on Node 22. There are **no GitHub Actions**.
- The Google Drive API key lives **only** in Cloudflare env vars, read server-side
  by `functions/api/drive.js`. It never enters the repo or the client bundle —
  **do not reintroduce a client-side key.**

## Working agreements

- **Don't commit or push unless the user explicitly asks.** They review first.
- Run `npm run build` to verify before committing.
- **All content lives in `public/portfolio.json`** — the single source of truth.
  It's fetched at runtime via `src/data/portfolio.jsx` (`usePortfolio()`), so
  editing the JSON updates the whole site with no code changes. Do **not** hardcode
  portfolio content (names, links, copy) in components; read it from the JSON.
- Match the existing code style and the warm cream/brown macOS theme.

## Current focus

See README → Roadmap: (1) a PDF-style, mobile-friendly portfolio; (2) project
imagery (`portfolio.json` projects have empty `images: []` + `assetPlaceholders`).
