import React, { useState, useEffect } from 'react'
import './Desktop.css'
import MenuBar       from './MenuBar.jsx'
import Dock          from './Dock.jsx'
import AppWindow     from './AppWindow.jsx'
import LockScreen    from './LockScreen.jsx'
import Spotlight     from './Spotlight.jsx'
import ContextMenu   from './ContextMenu.jsx'
import Stickies      from './Stickies.jsx'
import PortfolioApp  from './apps/PortfolioApp.jsx'
import InterviewsApp from './apps/InterviewsApp.jsx'
import FinderApp     from './apps/FinderApp.jsx'
import SafariApp     from './apps/SafariApp.jsx'
import NotesApp      from './apps/NotesApp.jsx'
import TerminalApp   from './apps/TerminalApp.jsx'
import MailApp       from './apps/MailApp.jsx'
import MusicApp      from './apps/MusicApp.jsx'
import GamesApp      from './apps/GamesApp.jsx'
import AboutMe       from './apps/AboutMe.jsx'
import { usePortfolio } from '../../../data/portfolio.jsx'
import { resolveResume, driveFolderUrl } from './apps/drive.js'
import { setMuted, chime, sOpen, sClose, sMinimize, sShutdown } from './sound.js'

/**
 * Desktop
 * macOS-style desktop: lock screen → draggable/minimizable/maximizable windows,
 * a dock with magnification, Spotlight (⌘/Ctrl+Space), a right-click context
 * menu, switchable wallpapers, UI sounds, and the Apple menu (About Me /
 * Shut Down). Adding an app = add to APPS + DOCK.
 *
 * Props:
 *   onExit {function} — fired on Shut Down (back to the room)
 */

// Glassdoor mark: a white door (with a handle) on the green tile.
const GLASSDOOR_ICON = (
  <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="6" y="3" width="12" height="18" rx="1.5" fill="#ffffff" />
    <circle cx="14.4" cy="12" r="1.3" fill="#0caa41" />
  </svg>
)

const APPS = {
  finder:     { id: 'finder',     name: 'Finder',    icon: '🗂️',           title: 'Finder',                 Component: FinderApp },
  safari:     { id: 'safari',     name: 'Safari',    icon: '🧭',           title: 'Safari',                 Component: SafariApp },
  mail:       { id: 'mail',       name: 'Mail',      icon: '✉️',           title: 'Mail — New Message',     Component: MailApp },
  notes:      { id: 'notes',      name: 'Notes',     icon: '🗒️',           title: 'Notes',                  Component: NotesApp },
  music:      { id: 'music',      name: 'Music',     icon: '♫', iconClass: 'icon-music', title: 'Music',          Component: MusicApp },
  games:      { id: 'games',      name: 'Games',     icon: '♟', iconClass: 'icon-games', title: 'Games — Arcade', Component: GamesApp },
  terminal:   { id: 'terminal',   name: 'Terminal',  icon: '>_', iconClass: 'icon-term', title: 'Terminal — zsh', Component: TerminalApp },
  portfolio:  { id: 'portfolio',  name: 'Portfolio', icon: '</>', iconClass: 'icon-dev', title: 'Portfolio — shreyas.dev', Component: PortfolioApp },
  glassdoor:  { id: 'glassdoor',  name: 'Glassdoor', icon: GLASSDOOR_ICON, iconClass: 'icon-glassdoor', title: 'Glassdoor — Interviews', Component: InterviewsApp },
}

const DOCK = ['finder', 'safari', 'mail', 'notes', 'music', 'terminal', 'divider', 'portfolio', 'glassdoor', 'games']

const WALLPAPERS = [
  'radial-gradient(circle at 28% 18%, #46402f 0%, transparent 55%), linear-gradient(160deg, #3a3530 0%, #1a1208 100%)',
  'radial-gradient(circle at 70% 20%, #2f4a5a 0%, transparent 55%), linear-gradient(160deg, #21323e 0%, #0c1218 100%)',
  'radial-gradient(circle at 30% 25%, #4a2f44 0%, transparent 55%), linear-gradient(160deg, #382438 0%, #160d16 100%)',
  'radial-gradient(circle at 60% 18%, #2f4a39 0%, transparent 55%), linear-gradient(160deg, #1f3a2c 0%, #0c1812 100%)',
]

const maxZ = ws => ws.reduce((m, w) => Math.max(m, w.z), 0)
const bringToFront = (ws, id) =>
  ws.map(w => (w.id === id ? { ...w, z: maxZ(ws) + 1, minimized: false } : w))
const defaultSize = () => ({
  w: Math.min(1320, window.innerWidth - 48),
  h: Math.min(820, window.innerHeight - 100),
})

// Place a freshly opened window so a wider default still fits on screen,
// keeping the cascade offset but clamping to the viewport.
const placeWindow = (w, h, offset = 0) => ({
  x: Math.max(8, Math.min(90 + offset * 30, window.innerWidth - w - 8)),
  y: Math.max(34, Math.min(56 + offset * 28, window.innerHeight - h - 8)),
})

const readLS = (k, fallback) => { try { return localStorage.getItem(k) ?? fallback } catch { return fallback } }

export default function Desktop({ onExit }) {
  const { projects, hackathons } = usePortfolio()
  const [loggedIn, setLoggedIn] = useState(false)
  const [windows, setWindows] = useState(() => {
    const { w, h } = defaultSize()
    return [{ id: 'portfolio', ...placeWindow(w, h), w, h, z: 1, minimized: false, maximized: false, prev: null }]
  })
  const [appleOpen, setAppleOpen]       = useState(false)
  const [aboutOpen, setAboutOpen]       = useState(false)
  const [shuttingDown, setShuttingDown] = useState(false)
  const [spotlightOpen, setSpotlightOpen] = useState(false)
  const [ctxMenu, setCtxMenu]           = useState(null)
  const [quickLook, setQuickLook]       = useState(null) // { name, src } shown in-desktop
  const [wallpaper, setWallpaper]       = useState(() => Number(readLS('shreyas-wallpaper', '0')) || 0)
  const [soundOn, setSoundOn]           = useState(() => readLS('shreyas-sound', '1') === '1')

  // Keep the sound module + storage in sync.
  useEffect(() => {
    setMuted(!soundOn)
    try { localStorage.setItem('shreyas-sound', soundOn ? '1' : '0') } catch { /* ignore */ }
  }, [soundOn])

  useEffect(() => {
    try { localStorage.setItem('shreyas-wallpaper', String(wallpaper)) } catch { /* ignore */ }
  }, [wallpaper])

  const openApp = id => {
    setAppleOpen(false)
    setSpotlightOpen(false)
    setWindows(ws => {
      if (ws.find(w => w.id === id)) return bringToFront(ws, id)
      const { w, h } = defaultSize()
      const offset = ws.length % 6
      sOpen()
      return [...ws, {
        id, ...placeWindow(w, h, offset), w, h,
        z: maxZ(ws) + 1, minimized: false, maximized: false, prev: null,
      }]
    })
  }

  const focusWindow    = id => setWindows(ws => bringToFront(ws, id))
  const closeWindow    = id => { sClose(); setWindows(ws => ws.filter(w => w.id !== id)) }
  const minimizeWindow = id => { sMinimize(); setWindows(ws => ws.map(w => (w.id === id ? { ...w, minimized: true } : w))) }
  const moveWindow     = (id, x, y) => setWindows(ws => ws.map(w => (w.id === id ? { ...w, x, y } : w)))

  const toggleMaximize = id => setWindows(ws => {
    const top = maxZ(ws) + 1
    return ws.map(w => {
      if (w.id !== id) return w
      if (w.maximized) {
        const p = w.prev || w
        return { ...w, x: p.x, y: p.y, w: p.w, h: p.h, maximized: false, prev: null, z: top }
      }
      const prev = { x: w.x, y: w.y, w: w.w, h: w.h }
      return { ...w, x: 8, y: 34, w: window.innerWidth - 16, h: window.innerHeight - 34 - 12, maximized: true, prev, z: top }
    })
  })

  const visible = windows.filter(w => !w.minimized)
  const focused = visible.reduce((top, w) => (!top || w.z > top.z ? w : top), null)
  const focusedId = focused?.id
  const openIds = windows.map(w => w.id)

  const handleAbout = () => { setAboutOpen(true); setAppleOpen(false); setSpotlightOpen(false) }
  const handleLogin = () => { setLoggedIn(true); chime() }

  const handleShutDown = () => {
    setAppleOpen(false)
    sShutdown()
    setShuttingDown(true)
    setTimeout(() => onExit(), 700)
  }

  const cycleWallpaper = () => setWallpaper(i => (i + 1) % WALLPAPERS.length)

  // Keyboard: Spotlight (⌘/Ctrl+Space) + Escape handling.
  useEffect(() => {
    if (!loggedIn) return
    const onKey = e => {
      if (e.code === 'Space' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSpotlightOpen(o => !o)
      } else if (e.key === 'Escape') {
        if (spotlightOpen) setSpotlightOpen(false)
        else if (quickLook) setQuickLook(null)
        else if (ctxMenu) setCtxMenu(null)
        else if (aboutOpen) setAboutOpen(false)
        else if (focusedId) closeWindow(focusedId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loggedIn, spotlightOpen, quickLook, ctxMenu, aboutOpen, focusedId])

  // Spotlight + Terminal + Finder share this app API.
  const api = { openApp, openAbout: handleAbout, quickLook: setQuickLook }

  const spotlightItems = [
    ...DOCK.filter(id => id !== 'divider').map(id => ({
      label: APPS[id].name, hint: 'App', run: () => openApp(id),
    })),
    { label: 'About Me', hint: 'Profile', run: handleAbout },
    ...[...projects, ...hackathons].map(p => ({
      label: p.name, hint: 'Project', run: () => openApp('portfolio'),
    })),
  ]

  const onContextMenu = e => {
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }

  const ctxItems = [
    { label: 'Open Spotlight', onClick: () => setSpotlightOpen(true) },
    { label: 'Change Wallpaper', onClick: cycleWallpaper },
    { divider: true },
    { label: 'About This Site', onClick: handleAbout },
  ]

  return (
    <div className="macos-desktop" style={{ background: WALLPAPERS[wallpaper] }} onContextMenu={onContextMenu}>
      {loggedIn && (
        <MenuBar
          activeAppName={focusedId ? APPS[focusedId].name : 'Finder'}
          appleOpen={appleOpen}
          onToggleApple={() => setAppleOpen(o => !o)}
          onAbout={handleAbout}
          onShutDown={handleShutDown}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn(s => !s)}
        />
      )}

      {appleOpen && <div className="desktop-clickaway" onClick={() => setAppleOpen(false)} />}

      {loggedIn && <Stickies />}

      {loggedIn && (
        <DesktopIcons
          onOpenResume={async () => {
            const r = await resolveResume()
            if (r) setQuickLook(r)
            else window.open(driveFolderUrl(), '_blank', 'noopener')
          }}
          onOpenCertificates={() => openApp('finder')}
        />
      )}

      <div className="window-layer">
        {visible.length === 0 && (
          <p className="desktop-hint">Open an app from the dock — or press ⌘ Space</p>
        )}

        {windows.map(w => {
          const app = APPS[w.id]
          const AppComponent = app.Component
          return (
            <AppWindow
              key={w.id}
              title={app.title}
              x={w.x} y={w.y} w={w.w} h={w.h} z={w.z}
              focused={focusedId === w.id}
              minimized={w.minimized}
              maximized={w.maximized}
              onClose={() => closeWindow(w.id)}
              onFocus={() => focusWindow(w.id)}
              onMinimize={() => minimizeWindow(w.id)}
              onToggleMaximize={() => toggleMaximize(w.id)}
              onMove={(x, y) => moveWindow(w.id, x, y)}
            >
              <AppComponent api={api} />
            </AppWindow>
          )
        })}
      </div>

      {loggedIn && (
        <Dock
          apps={DOCK.map(id => (id === 'divider' ? { divider: true } : APPS[id]))}
          openIds={openIds}
          focusedId={focusedId}
          onOpen={openApp}
          collapsed={!!focused?.maximized}
        />
      )}

      {spotlightOpen && (
        <Spotlight items={spotlightItems} onClose={() => setSpotlightOpen(false)} />
      )}

      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxItems} onClose={() => setCtxMenu(null)} />
      )}

      {aboutOpen && (
        <div className="about-layer">
          <div className="about-backdrop" onClick={() => setAboutOpen(false)} />
          <AboutMe onClose={() => setAboutOpen(false)} />
        </div>
      )}

      {!loggedIn && <LockScreen onLogin={handleLogin} />}

      {quickLook && (
        <div className="quicklook" onMouseDown={() => setQuickLook(null)}>
          <div className="quicklook-panel" onMouseDown={e => e.stopPropagation()}>
            <div className="quicklook-bar">
              <span className="quicklook-title">{quickLook.name}</span>
              <a className="quicklook-open" href={quickLook.openHref || quickLook.src} target="_blank" rel="noreferrer">
                Open in new tab ↗
              </a>
              <button
                type="button"
                className="quicklook-close"
                aria-label="Close"
                onClick={() => setQuickLook(null)}
              >
                ✕
              </button>
            </div>
            <iframe className="quicklook-frame" src={quickLook.src} title={quickLook.name} />
          </div>
        </div>
      )}

      <div className={`shutdown-overlay${shuttingDown ? ' on' : ''}`} />
    </div>
  )
}

/**
 * DesktopIcons
 * Resume + Certificates icons on the desktop. Single click selects; double-click
 * opens (Resume → the PDF; Certificates → Finder, which lands on the Drive folder).
 */
function DesktopIcons({ onOpenResume, onOpenCertificates }) {
  const [selected, setSelected] = useState(null)
  const icons = [
    { id: 'resume', label: 'Resume',       glyph: '📄', onOpen: onOpenResume },
    { id: 'certs',  label: 'Certificates', glyph: '📜', onOpen: onOpenCertificates },
  ]
  return (
    <div className="desktop-icons">
      {icons.map(ic => (
        <button
          key={ic.id}
          type="button"
          className={`desktop-icon${selected === ic.id ? ' selected' : ''}`}
          onClick={() => setSelected(ic.id)}
          onDoubleClick={ic.onOpen}
          title={`Double-click to open ${ic.label}`}
        >
          <span className="desktop-icon-glyph">{ic.glyph}</span>
          <span className="desktop-icon-label">{ic.label}</span>
        </button>
      ))}
    </div>
  )
}
