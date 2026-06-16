import React from 'react'
import { projects } from '../../data/projects.js'
import './MobilePortfolio.css'

/**
 * MobilePortfolio
 * A clean, scrollable single-column portfolio shown on small / touch screens,
 * where the draggable desktop metaphor doesn't work. Professional and fast.
 */
const CONTACTS = [
  { label: 'Email',    href: 'mailto:shreyaskr2000@gmail.com' },
  { label: 'GitHub',   href: 'https://github.com/Shreyas0Kumar' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/shreyas0kumar/' },
  { label: 'Resume',   href: '/resume.pdf' },
]

export default function MobilePortfolio() {
  const shown = projects.filter(p => p.category !== 'hackathon')

  return (
    <div className="mobile">
      <header className="mobile-header">
        <h1 className="mobile-name">Shreyas Kumar</h1>
        <p className="mobile-tagline">AI Engineer · builder of real systems</p>
        <nav className="mobile-links">
          {CONTACTS.map(c => (
            <a key={c.label} href={c.href} target="_blank" rel="noreferrer" className="mobile-link">
              {c.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="mobile-main">
        <h2 className="mobile-section">Projects</h2>
        {shown.map(p => (
          <article key={p.id} className="mobile-card" style={{ '--c': p.color }}>
            <div className="mobile-card-accent" />
            <h3 className="mobile-card-title">{p.title}</h3>
            <p className="mobile-card-what">{p.what}</p>
            <ul className="mobile-stack">
              {p.stack.map(t => <li key={t} className="mobile-chip">{t}</li>)}
            </ul>
            <div className="mobile-card-links">
              {p.links.live && <a href={p.links.live} target="_blank" rel="noreferrer" className="mobile-cta primary">Live ↗</a>}
              {p.links.repo && <a href={p.links.repo} target="_blank" rel="noreferrer" className="mobile-cta">Code ↗</a>}
            </div>
          </article>
        ))}
      </main>

      <footer className="mobile-footer">
        <p>Best viewed on desktop for the full experience.</p>
      </footer>
    </div>
  )
}
