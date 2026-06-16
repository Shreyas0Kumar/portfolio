import React, { useState } from 'react'
import { projects } from '../../../../data/projects.js'
import './ProjectsTab.css'

/**
 * ProjectsTab
 * A grid of project cards. Clicking a card expands it inline (full width) to
 * reveal the full what / why / stack / links. One card open at a time.
 *
 * Scope: featured + more (hackathons live under their own tab).
 */
const items = projects.filter(p => p.category !== 'hackathon')

export default function ProjectsTab() {
  const [openId, setOpenId] = useState(null)

  const toggle = id => setOpenId(curr => (curr === id ? null : id))

  return (
    <div className="projects-tab">
      <h2 className="projects-heading">Projects</h2>
      <p className="projects-sub">Things I've designed, built, and shipped.</p>

      <div className="projects-grid">
        {items.map(p => {
          const open = openId === p.id
          return (
            <article
              key={p.id}
              className={`project-card${open ? ' open' : ''}`}
              style={{ '--card-color': p.color }}
              onClick={() => toggle(p.id)}
            >
              <div className="project-accent" />

              <header className="project-head">
                <h3 className="project-title">{p.title}</h3>
                <span className="project-toggle" aria-hidden="true">
                  {open ? '−' : '+'}
                </span>
              </header>

              <p className="project-hook">{p.hook}</p>

              {open && (
                <div className="project-detail" onClick={e => e.stopPropagation()}>
                  <p className="project-what">{p.what}</p>

                  <p className="project-why">
                    <span className="project-label">Why</span>
                    {p.why}
                  </p>

                  <ul className="project-stack">
                    {p.stack.map(tech => (
                      <li key={tech} className="project-chip">{tech}</li>
                    ))}
                  </ul>

                  <div className="project-links">
                    {p.links.live && (
                      <a
                        className="project-link primary"
                        href={p.links.live}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {p.cta}
                      </a>
                    )}
                    {p.links.repo && (
                      <a
                        className="project-link"
                        href={p.links.repo}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View code →
                      </a>
                    )}
                    {!p.links.live && !p.links.repo && (
                      <span className="project-cta-static">{p.cta}</span>
                    )}
                  </div>
                </div>
              )}

              {!open && (
                <ul className="project-stack preview">
                  {p.stack.slice(0, 4).map(tech => (
                    <li key={tech} className="project-chip">{tech}</li>
                  ))}
                  {p.stack.length > 4 && (
                    <li className="project-chip more">+{p.stack.length - 4}</li>
                  )}
                </ul>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
