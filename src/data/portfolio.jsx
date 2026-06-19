// portfolio.jsx
// Single source of truth wiring. The actual content lives in `public/portfolio.json`
// (NOT in this repo's JS) so it ships as a static asset and can be edited without
// touching code — add an entry to the JSON and it shows up on the deployed site.
//
// We fetch it at runtime (rather than bundle-importing) precisely so the JSON stays
// the canonical, editable source. <PortfolioProvider> loads it once near the root and
// every consumer reads it through usePortfolio(). Provider gates render until the
// (tiny, same-origin) file resolves, so consumers can assume the data is present.

import React, { createContext, useContext, useEffect, useState } from 'react'

const PortfolioContext = createContext(null)

export function PortfolioProvider({ children }) {
  const [data, setData]   = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    fetch('/portfolio.json', { cache: 'no-cache' })
      .then(r => {
        if (!r.ok) throw new Error(`portfolio.json (${r.status})`)
        return r.json()
      })
      .then(json => { if (alive) setData(json) })
      .catch(e => { if (alive) setError(e) })
    return () => { alive = false }
  }, [])

  if (error) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center', padding: 24,
        background: '#1a1208', color: '#e8a55a', fontFamily: 'var(--font-body)',
      }}>
        Couldn’t load portfolio content. Please refresh.
      </div>
    )
  }

  // Brief blank while the local file resolves — blends with the black app background.
  if (!data) return null

  return <PortfolioContext.Provider value={data}>{children}</PortfolioContext.Provider>
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext)
  if (ctx === null) {
    throw new Error('usePortfolio() must be used inside <PortfolioProvider>')
  }
  return ctx
}

/* ───────────────────────── Derived helpers ─────────────────────────
   Presentation-only utilities. They shape JSON for the UI but never invent
   factual content — that always comes straight from portfolio.json. */

// Human labels for the skills.* group keys.
export const SKILL_GROUP_LABELS = {
  llmNlp:          'LLMs & NLP',
  mlData:          'ML & Data',
  backendApis:     'Backend & APIs',
  deploymentTools: 'Deployment & Tools',
  languages:       'Languages',
}

// Warm, theme-aligned accent palette. We assign a stable colour per item id so
// cards keep visual variety without hardcoding a colour into the content.
const ACCENTS = [
  '#c8782a', '#9c5a3c', '#6f7d3a', '#7a5c8a',
  '#5f7a6a', '#b07a30', '#a8632e', '#4f6d82',
]

export function accentFor(seed = '') {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return ACCENTS[Math.abs(h) % ACCENTS.length]
}

// A project/hackathon "won" something if it lists any awards.
export const hasAward = entry => Array.isArray(entry?.awards) && entry.awards.length > 0
