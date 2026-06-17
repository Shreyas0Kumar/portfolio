  # Shreyas Kumar — Portfolio

An interactive, macOS-style portfolio. Desktop visitors land in a live Spline 3D
room and click the monitor to "boot" into a retro desktop with working apps;
touch / small screens get a clean, fast scrollable portfolio instead.

Live: **https://portfolio.shreyas.space**

## Tech

- **React 18** + **Vite 8**
- **Spline** (`@splinetool/react-spline`) for the 3D room
- Scenes are code-split with `React.lazy` so each device only downloads its own
  path (mobile never loads the 3D runtime).
- Hosted on **Cloudflare Pages** (free tier); a Pages Function backs the Drive
  integration.

## Develop

```bash
npm install
npm run dev      # local dev server (no Pages Functions — see note)
npm run build    # production build → dist/
npm run preview  # preview the production build locally
```

> The Finder "Documents" list is served by a Cloudflare Pages Function
> (`functions/api/drive.js`). Plain `npm run dev` doesn't run Functions, so Finder
> falls back to a keyless folder embed. To exercise the real in-app grid locally:
> `npm run build` then `npx wrangler pages dev dist` (with a `.dev.vars` file).

## Deploy (Cloudflare Pages)

Connected via Cloudflare's **native Git integration** — every push to `main`
triggers a build automatically. No GitHub Actions, no secrets in the repo.

| Setting          | Value           |
| ---------------- | --------------- |
| Framework preset | Vite            |
| Build command    | `npm run build` |
| Build output dir | `dist`          |
| Node version     | `22` (`.nvmrc`) |

### Environment variables (Cloudflare → project → Settings → Environment variables)

| Name              | Purpose                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `DRIVE_API_KEY`   | Google Drive API key (mark **encrypted**). Restrict to *Google Drive API*; **no** referrer restriction (the call is server-side). |
| `DRIVE_FOLDER_ID` | ID of the public Drive folder shown in Finder "Documents".                                             |

The folder is link-public ("Anyone with the link → Viewer"). Upload a file to it
and it appears in Finder automatically (edge-cached ~5 min). The API key never
ships to the browser — it lives only in the Pages Function. Client config:
`src/scenes/ComputerScene/Desktop/apps/drive.js`.

## Content (single source of truth)

- `public/portfolio.json` — **everything**: profile, intro, projects, hackathons,
  experience, education, skills, interviews, and contact. It's served as a static
  asset and fetched at runtime (see `src/data/portfolio.jsx`), so editing the JSON
  updates the whole site — desktop apps and the mobile portfolio alike — with no
  code changes. Add an entry following the shape of the existing ones and it
  appears automatically.

## Structure

```
functions/api/drive.js       Cloudflare Pages Function — lists the Drive folder
public/
  portfolio.json             single source of truth for ALL content
src/
  App.jsx                    scene orchestration + mobile/desktop split
  data/
    portfolio.jsx            fetches portfolio.json + usePortfolio() hook
  scenes/
    IntroScreen/             first-load full-screen nudge (desktop)
    RoomScene/               live Spline 3D room (desktop entry)
    ComputerScene/           XP-style boot loader + macOS desktop & apps
    MobilePortfolio/         scrollable portfolio + MobileIntro handoff (mobile)
```

## Roadmap

Tracked here so the work survives across chat sessions.

**In progress**

1. **PDF-style mobile portfolio** — a clean, professional, print-like layout that
   reads great on phones. Becomes the mobile default and the destination of the
   mobile intro's "continue here"; a button toggles it on the same page (desktop too).
   (The current mobile portfolio is data-driven and scrollable; this is the polish pass.)

2. **Project imagery** — `portfolio.json` projects have empty `images: []` arrays
   and `assetPlaceholders` describing the shots to add. The detail pages already
   render an `images` gallery when populated.

**Done**

Cloudflare Pages deploy + custom domain · Vite 8 / Node 22 · code-split scenes ·
favicon · Drive-backed Finder with the API key hidden in a Pages Function ·
desktop Resume/Certificates icons + in-app Quick Look · mobile intro handoff
screen · **single-source `portfolio.json`** driving every surface (Portfolio app,
Interviews, About, Terminal, Safari, Mail, mobile) · real content pass (projects,
hackathons, experience, education, skills, interviews).
