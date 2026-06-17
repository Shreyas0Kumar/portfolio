import React, { useState } from 'react'
import { usePortfolio, accentFor, hasAward, SKILL_GROUP_LABELS } from '../../data/portfolio.jsx'
import { driveFolderUrl } from '../ComputerScene/Desktop/apps/drive.js'
import MobileIntro from './MobileIntro.jsx'
import './MobilePortfolio.css'

/**
 * MobilePortfolio
 * A clean, scrollable single-column portfolio shown on small / touch screens,
 * where the draggable desktop metaphor doesn't work. Fully driven by
 * public/portfolio.json (via usePortfolio) — professional and fast.
 */

// Shown once per browser session so a refresh doesn't re-nag, but a fresh visit
// still gets the "open on desktop" pitch.
const INTRO_KEY = 'shreyas-mobile-intro-seen'

const byOrder = (a, b) => (a.order ?? 99) - (b.order ?? 99)

export default function MobilePortfolio() {
  const { profile, intro, projects, hackathons, experience, skills, contact } = usePortfolio()

  const [showIntro, setShowIntro] = useState(() => {
    try { return sessionStorage.getItem(INTRO_KEY) !== '1' } catch { return true }
  })
  const dismissIntro = () => {
    try { sessionStorage.setItem(INTRO_KEY, '1') } catch { /* ignore */ }
    setShowIntro(false)
  }

  if (showIntro) return <MobileIntro onContinue={dismissIntro} />

  const links = [
    { label: 'Email',    href: `mailto:${profile.email}` },
    profile.links.github   && { label: 'GitHub',   href: profile.links.github },
    profile.links.linkedin && { label: 'LinkedIn', href: profile.links.linkedin },
    { label: 'Résumé',   href: driveFolderUrl() },
  ].filter(Boolean)

  const work = [...projects].sort(byOrder)
  const hacks = [...hackathons].sort(byOrder)

  return (
    <div className="mobile">
      <header className="mobile-header">
        <h1 className="mobile-name">{profile.name}</h1>
        <p className="mobile-tagline">{profile.role} · {profile.location}</p>
        <nav className="mobile-links">
          {links.map(c => (
            <a key={c.label} href={c.href} target="_blank" rel="noreferrer" className="mobile-link">
              {c.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="mobile-main">
        <section className="mobile-intro">
          <h2 className="mobile-intro-head">{intro.heading}</h2>
          {intro.body.map((line, i) => <p key={i} className="mobile-intro-line">{line}</p>)}
        </section>

        <h2 className="mobile-section">Projects</h2>
        {work.map(p => <ProjectCard key={p.id} p={p} />)}

        <h2 className="mobile-section">Hackathons & competitions</h2>
        {hacks.map(p => <ProjectCard key={p.id} p={p} award={hasAward(p)} />)}

        <h2 className="mobile-section">Experience</h2>
        {experience.map(e => (
          <article key={e.id} className="mobile-exp">
            <div className="mobile-exp-top">
              <span className="mobile-exp-role">{e.role}</span>
              <span className="mobile-exp-dates">{e.start} – {e.end}</span>
            </div>
            <span className="mobile-exp-company">{e.company}</span>
            <p className="mobile-exp-summary">{e.summary}</p>
          </article>
        ))}

        <h2 className="mobile-section">Skills</h2>
        <div className="mobile-skills">
          {Object.entries(skills).map(([key, list]) => (
            <div key={key} className="mobile-skillgroup">
              <h3 className="mobile-skillname">{SKILL_GROUP_LABELS[key] || key}</h3>
              <ul className="mobile-stack">
                {list.map(t => <li key={t} className="mobile-chip">{t}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <h2 className="mobile-section">{contact.heading}</h2>
        <section className="mobile-contact">
          {contact.body.map((line, i) => <p key={i} className="mobile-intro-line">{line}</p>)}
          <a className="mobile-cta primary" href={`mailto:${profile.email}`}>Email me ↗</a>
        </section>
      </main>

      <footer className="mobile-footer">
        <p>Best viewed on desktop for the full interactive experience.</p>
      </footer>
    </div>
  )
}

function ProjectCard({ p, award }) {
  const stack = p.techStack || []
  return (
    <article className="mobile-card" style={{ '--c': accentFor(p.id) }}>
      <div className="mobile-card-accent" />
      <div className="mobile-card-head">
        <h3 className="mobile-card-title">{p.name}</h3>
        {award && <span className="mobile-card-badge">★ Award</span>}
      </div>
      <p className="mobile-card-what">{p.homepage?.tagline}</p>
      <ul className="mobile-stack">
        {stack.slice(0, 6).map(t => <li key={t} className="mobile-chip">{t}</li>)}
      </ul>
      <div className="mobile-card-links">
        {p.links?.product && (
          <a href={p.links.product} target="_blank" rel="noreferrer" className="mobile-cta primary">Product ↗</a>
        )}
        {p.links?.repo && (
          <a href={p.links.repo} target="_blank" rel="noreferrer" className="mobile-cta">Code ↗</a>
        )}
      </div>
    </article>
  )
}
