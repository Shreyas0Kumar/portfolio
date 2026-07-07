import React, { useState, useEffect, useMemo } from 'react'
import { usePortfolio } from '../../../../data/portfolio.jsx'
import './SafariApp.css'

/**
 * SafariApp
 * A small but real tabbed browser: new/close/switch tabs, an address bar that
 * navigates to URLs or searches Google, back/forward history, and a Favorites
 * start page. Favorites are built from public/portfolio.json (profile links +
 * any project / hackathon product or repo links).
 *
 * Note: many sites send X-Frame-Options and refuse to load in an <iframe>, so
 * the in-app view may be blank for them — the ↗ button opens the page in a real
 * browser tab as a fallback.
 */

// Build the Favorites list from the portfolio data: profile links first, then
// every project / hackathon that exposes a product or repo URL.
function useFavorites() {
  const { profile, projects, hackathons } = usePortfolio()
  return useMemo(() => {
    const profiles = [
      profile.links.github   && { label: 'GitHub',   url: profile.links.github,   glyph: '🐙' },
      profile.links.linkedin && { label: 'LinkedIn', url: profile.links.linkedin, glyph: '💼' },
    ].filter(Boolean)

    const links = [...projects, ...hackathons]
      .map(p => {
        const url = p.links?.product || p.links?.repo
        if (!url) return null
        return { label: p.name, url, glyph: p.links?.product ? '🌐' : '📦' }
      })
      .filter(Boolean)

    return [...profiles, ...links]
  }, [profile, projects, hackathons])
}

// The string 'start' is a sentinel for the Favorites start page. A 'card:' prefix
// means "show a landing card instead of an iframe" (for sites that block embedding).
let TAB_SEQ = 1
const newTab = () => ({ id: TAB_SEQ++, history: ['start'], idx: 0 })
const newTabAt = entry => ({ id: TAB_SEQ++, history: [entry], idx: 0 })

// Hosts known to refuse iframe embedding (X-Frame-Options / CSP). These get a
// landing card rather than a broken "refused to connect" frame.
const NO_EMBED = ['linkedin.com', 'github.com', 'google.com', 'x.com', 'twitter.com', 'facebook.com', 'instagram.com', 'youtube.com', 'lumo.shreyas.space']

// Hosts that show a login wall to logged-out visitors — a screenshot would just
// capture their sign-in page, so these get a plain card instead of a preview.
const LOGIN_WALL = ['linkedin.com', 'facebook.com', 'instagram.com']

const hostMatches = (url, list) => {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '')
    return list.some(b => h === b || h.endsWith('.' + b))
  } catch {
    return false
  }
}

const isBlocked = url => hostMatches(url, NO_EMBED)
const isLoginWalled = url => hostMatches(url, LOGIN_WALL)

// Map a real URL to a history entry: a card for blocked hosts, else the raw URL.
const entryFor = url => (isBlocked(url) ? 'card:' + url : url)
const entryUrl = entry => (entry.startsWith('card:') ? entry.slice(5) : entry)

// Turn address-bar input into a destination. URLs/domains navigate in-app
// (iframe); plain text is a Google search, which must open in a real tab since
// Google refuses to be embedded.
function resolveQuery(input) {
  const s = input.trim()
  if (!s) return { kind: 'start' }
  if (/^https?:\/\//i.test(s)) return { kind: 'url', url: s }
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(s)) return { kind: 'url', url: 'https://' + s }
  return { kind: 'search', url: 'https://www.google.com/search?q=' + encodeURIComponent(s), q: s }
}

function tabTitle(entry) {
  if (entry === 'start') return 'Favorites'
  try {
    const u = new URL(entryUrl(entry))
    if (u.hostname.includes('google') && u.pathname.includes('/search')) return 'Google'
    return u.hostname.replace(/^www\./, '')
  } catch {
    return 'New Tab'
  }
}

export default function SafariApp() {
  const FAVORITES = useFavorites()
  const [tabs, setTabs]         = useState(() => [newTab()])
  const [activeId, setActiveId] = useState(() => tabs[0].id)
  const [address, setAddress]   = useState('')
  const [toast, setToast]       = useState('')

  const active = tabs.find(t => t.id === activeId) || tabs[0]
  const currentUrl = active.history[active.idx]

  // Sync the address bar when the tab or its page changes (show the real URL).
  useEffect(() => {
    setAddress(currentUrl === 'start' ? '' : entryUrl(currentUrl))
  }, [activeId, currentUrl])

  const updateActive = updater =>
    setTabs(ts => ts.map(t => (t.id === activeId ? updater(t) : t)))

  const pushUrl = url =>
    updateActive(t => {
      const history = t.history.slice(0, t.idx + 1)
      history.push(url)
      return { ...t, history, idx: history.length - 1 }
    })

  const navigate = input => {
    const r = resolveQuery(input)
    if (r.kind === 'search') {
      // Google blocks embedding — open real results in a new browser tab.
      window.open(r.url, '_blank', 'noopener,noreferrer')
      setToast(`Searched “${r.q}” in a new tab`)
      setTimeout(() => setToast(''), 2600)
      return
    }
    if (r.kind === 'url') pushUrl(entryFor(r.url))
  }

  const submit = e => {
    e.preventDefault()
    navigate(address)
  }

  const back = () => updateActive(t => ({ ...t, idx: Math.max(0, t.idx - 1) }))
  const forward = () => updateActive(t => ({ ...t, idx: Math.min(t.history.length - 1, t.idx + 1) }))

  const addTab = () => {
    const tab = newTab()
    setTabs(ts => [...ts, tab])
    setActiveId(tab.id)
  }

  // Open a favorite in a brand-new in-app tab (card for blocked hosts).
  const openFavorite = url => {
    const tab = newTabAt(entryFor(url))
    setTabs(ts => [...ts, tab])
    setActiveId(tab.id)
  }

  const closeTab = (id, e) => {
    e.stopPropagation()
    setTabs(ts => {
      const rest = ts.filter(t => t.id !== id)
      if (rest.length === 0) {
        const tab = newTab()
        setActiveId(tab.id)
        return [tab]
      }
      if (id === activeId) setActiveId(rest[rest.length - 1].id)
      return rest
    })
  }

  const canBack = active.idx > 0
  const canForward = active.idx < active.history.length - 1

  return (
    <div className="safari">
      {/* Tab strip */}
      <div className="safari-tabstrip">
        {tabs.map(t => (
          <div
            key={t.id}
            className={`safari-tab${t.id === activeId ? ' active' : ''}`}
            onClick={() => setActiveId(t.id)}
          >
            <span className="safari-tab-title">{tabTitle(t.history[t.idx])}</span>
            <button
              type="button"
              className="safari-tab-close"
              onClick={e => closeTab(t.id, e)}
              aria-label="Close tab"
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" className="safari-newtab" onClick={addTab} aria-label="New tab">
          ＋
        </button>
      </div>

      {/* Toolbar */}
      <div className="safari-chrome">
        <div className="safari-nav">
          <button type="button" onClick={back} disabled={!canBack} aria-label="Back">‹</button>
          <button type="button" onClick={forward} disabled={!canForward} aria-label="Forward">›</button>
        </div>

        <form className="safari-addressform" onSubmit={submit}>
          <input
            className="safari-address"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Search Google or enter address"
            spellCheck={false}
          />
        </form>

        {currentUrl !== 'start' && (
          <a
            className="safari-external"
            href={currentUrl}
            target="_blank"
            rel="noreferrer"
            title="Open in a real browser tab"
          >
            ↗
          </a>
        )}
      </div>

      {/* Content */}
      <div className="safari-content">
        {currentUrl === 'start' ? (
          <div className="safari-page">
            <h2 className="safari-title">Favorites</h2>
            <div className="safari-grid">
              {FAVORITES.map(link => (
                <button
                  key={link.label}
                  type="button"
                  className="safari-fav"
                  onClick={() => openFavorite(link.url)}
                >
                  <span className="safari-fav-glyph">{link.glyph}</span>
                  <span className="safari-fav-label">{link.label}</span>
                </button>
              ))}
            </div>
            <p className="safari-note">
              Favorites open in a new in-app tab. Sites that allow it load live;
              others (LinkedIn, GitHub…) show a screenshot preview you can click to
              open. Type in the address bar to search Google.
            </p>
          </div>
        ) : currentUrl.startsWith('card:') ? (
          <>
            {isLoginWalled(entryUrl(currentUrl))
              ? <SiteCard url={entryUrl(currentUrl)} reason="login" />
              : <SitePreview url={entryUrl(currentUrl)} />}
            <a
              className="safari-openreal"
              href={entryUrl(currentUrl)}
              target="_blank"
              rel="noreferrer"
            >
              Open in your browser ↗
            </a>
          </>
        ) : (
          <>
            {/* No allow-top-navigation in the sandbox: a framed site can't
                hijack the whole portfolio tab; popups it opens still work. */}
            <iframe
              key={currentUrl}
              className="safari-frame"
              src={currentUrl}
              title="browser"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
            />
            <a
              className="safari-openreal"
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open in your browser ↗
            </a>
          </>
        )}

        {toast && <div className="safari-toast">{toast}</div>}
      </div>
    </div>
  )
}

// Live screenshot preview for sites that refuse iframe embedding. Looks like a
// loaded page; the screenshot is clickable. Falls back to a plain card if the
// screenshot service fails (e.g. rate-limited).
function SitePreview({ url }) {
  const [state, setState] = useState('loading') // loading | ready | error

  let host = url
  try { host = new URL(url).hostname.replace(/^www\./, '') } catch { /* ignore */ }

  // Microlink returns the screenshot image directly via embed=screenshot.url.
  const shot = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`

  if (state === 'error') return <SiteCard url={url} />

  return (
    <div className="safari-preview">
      {state === 'loading' && (
        <div className="safari-preview-load">
          <span className="safari-spinner" />
          Loading preview of {host}…
        </div>
      )}
      <a className="safari-preview-shot" href={url} target="_blank" rel="noreferrer" title={`Open ${host}`}>
        <img
          src={shot}
          alt={`Preview of ${host}`}
          style={{ opacity: state === 'ready' ? 1 : 0 }}
          onLoad={() => setState('ready')}
          onError={() => setState('error')}
        />
      </a>
    </div>
  )
}

// Plain card for sites that can't be embedded or previewed. `reason` tailors
// the glyph + copy ('login' for sign-in-walled sites, else generic embedding).
function SiteCard({ url, reason = 'embed' }) {
  let host = url
  try { host = new URL(url).hostname.replace(/^www\./, '') } catch { /* ignore */ }
  const login = reason === 'login'
  return (
    <div className="safari-card">
      <div className="safari-card-glyph">{login ? '🔒' : '🔗'}</div>
      <h2 className="safari-card-host">{host}</h2>
      <p className="safari-card-note">
        {login
          ? 'This site only shows its content to logged-in users, so it can’t be previewed here. Open it to take a look.'
          : 'This site doesn’t allow being embedded in another browser. Open it for real to take a look.'}
      </p>
      <a className="safari-card-btn" href={url} target="_blank" rel="noreferrer">
        Open in your browser ↗
      </a>
      <p className="safari-card-url">{url}</p>
    </div>
  )
}
