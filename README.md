# Shreyas Kumar — Portfolio

An interactive, macOS-style portfolio. Instead of a static page, desktop visitors
land in a live 3D room and click the monitor to **boot into a working desktop** —
a little operating system where each app reveals a different part of my work.

**Live → https://portfolio.shreyas.space**

## What it is

- **A 3D room you boot into.** Desktop visitors arrive in a live Spline 3D scene,
  click the monitor, and watch it power on into a retro desktop. First-time
  visitors get a skippable guided tour of the desktop's features.
- **Working apps, not screenshots.** The desktop is a real little OS:
  - **Portfolio** — projects, hackathons, and experience with tap-through case studies
  - **Interviews** — honest write-ups of real interview loops (rounds, questions, takeaways)
  - **About / Terminal / Safari** — different lenses on the same content
  - **Mail** — a contact form that actually sends, in-app, straight to my inbox
  - **Finder** — Documents (résumé, certificates) served live from Google Drive with
    in-app Quick Look
  - **Photo Booth / Calculator** — the little utilities, faithfully recreated:
    a live-camera booth with effects and a working macOS calculator
- **A mobile edition that stands on its own.** Phones and touch screens get a
  "printed magazine" portfolio — a sectioned reader (Overview, Work, Hackathons,
  Experience, Stack, Interviews, Contact) with tap-through detail pages — rather
  than a cramped version of the desktop.

## How it's built

- **React 18 + Vite** single-page app.
- **Spline** (`@splinetool/react-spline`) for the 3D room.
- Scenes are **code-split with `React.lazy`**, so each device only downloads its own
  path — mobile never loads the 3D runtime at all.
- Hosted on **Cloudflare Pages**. A Pages Function (`functions/api/drive.js`) lists
  the public Drive folder server-side, so the API key never reaches the browser.
- The in-app **Mail** sends through Formspree and stays on-screen — no `mailto:`
  handoff — with the visitor's address set as reply-to.

## One source of truth

All content lives in **`public/portfolio.json`** — profile, intro, projects,
hackathons, experience, education, skills, interviews, and contact. It's served as
a static asset and fetched at runtime (`src/data/portfolio.jsx`), so editing the
JSON updates every surface — desktop apps *and* the mobile edition — with no code
changes.

## Structure

```
functions/api/drive.js       Cloudflare Pages Function — lists the Drive folder
public/
  portfolio.json             single source of truth for ALL content
src/
  App.jsx                    scene orchestration + mobile/desktop split
  data/portfolio.jsx         fetches portfolio.json + usePortfolio() hook
  scenes/
    IntroScreen/             first-load full-screen nudge (desktop)
    RoomScene/               live Spline 3D room (desktop entry)
    ComputerScene/           boot loader + macOS desktop & apps
    MobilePortfolio/         "magazine" mobile edition + intro handoff
```
