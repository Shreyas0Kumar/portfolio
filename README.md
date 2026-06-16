# Shreyas Kumar — Portfolio

An interactive, macOS-style portfolio. Desktop visitors land in a live Spline 3D
room and click the monitor to "boot" into a retro desktop with working apps;
touch / small screens get a clean, fast scrollable portfolio instead.

Live: **https://portfolio.shreyas.space**

## Tech

- **React 18** + **Vite 5**
- **Spline** (`@splinetool/react-spline`) for the 3D room
- Scenes are code-split with `React.lazy` so each device only downloads its own
  path (mobile never loads the 3D runtime).

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # preview the production build locally
```

## Deploy (Cloudflare Pages)

Connected via Cloudflare's native Git integration — every push to `main`
triggers a build automatically.

| Setting              | Value           |
| -------------------- | --------------- |
| Framework preset     | Vite            |
| Build command        | `npm run build` |
| Build output dir     | `dist`          |
| Node version         | `20` (`.nvmrc`) |

## Structure

```
src/
  App.jsx                  scene orchestration + mobile/desktop split
  scenes/
    IntroScreen/           first-load full-screen nudge
    RoomScene/             live Spline 3D room (desktop entry)
    ComputerScene/         XP-style boot loader + macOS desktop & apps
    MobilePortfolio/       scrollable portfolio for touch / small screens
  data/projects.js         single source of truth for projects
```
