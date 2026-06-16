import React, { useState, useMemo } from 'react'
import './PortfolioApp.css'
import { projects, getFeatured, getHackathons, getMore } from '../../../../data/projects.js'

/**
 * PortfolioApp
 * A pro-grade portfolio "app": a dark sidebar rail + paper content area, with
 * an Overview hero, a master–detail Work browser (cards slide into full
 * case-study panes), a Hackathons award wall, a categorized Stack, and a
 * Contact section wired to the in-desktop Mail app.
 *
 * Props:
 *   api {object} — { openApp, openAbout } from Desktop (used by Contact).
 */

const SECTIONS = [
  { id: 'overview',   label: 'Overview',   glyph: '◎' },
  { id: 'work',       label: 'Work',       glyph: '◆' },
  { id: 'hackathons', label: 'Hackathons', glyph: '★' },
  { id: 'stack',      label: 'Stack',      glyph: '▤' },
  { id: 'contact',    label: 'Contact',    glyph: '✦' },
]

// Curated tech taxonomy — reads better than auto-grouping raw stacks.
const STACK_GROUPS = [
  { name: 'Languages',     items: ['Python', 'Java 17', 'JavaScript', 'TypeScript'] },
  { name: 'AI / ML',       items: ['HuggingFace', 'LoRA', 'BM25', 'Sentence Transformers', 'OR-Tools', 'Gemini AI', 'TTS', 'VAD'] },
  { name: 'Backend',       items: ['FastAPI', 'NestJS', 'Spring Boot', 'WebSockets', 'Celery'] },
  { name: 'Frontend',      items: ['React', 'Angular', 'Next.js'] },
  { name: 'Data',          items: ['PostgreSQL', 'MongoDB', 'Redis', 'MinIO'] },
  { name: 'Infra / DevOps', items: ['Docker', 'GitHub Actions', 'Maven'] },
]

const CONTACTS = [
  { label: 'GitHub',   value: 'github.com/Shreyas0Kumar',     href: 'https://github.com/Shreyas0Kumar',          glyph: '⌥' },
  { label: 'LinkedIn', value: 'linkedin.com/in/shreyas0kumar', href: 'https://www.linkedin.com/in/shreyas0kumar/', glyph: '⌘' },
  { label: 'Email',    value: 'shreyaskr2000@gmail.com',      href: 'mailto:shreyaskr2000@gmail.com',            glyph: '✉' },
]

export default function PortfolioApp({ api }) {
  const [section, setSection] = useState('overview')
  const [detailId, setDetailId] = useState(null)

  const featured = useMemo(() => getFeatured(), [])
  const hackathons = useMemo(() => getHackathons(), [])
  const more = useMemo(() => getMore(), [])

  const stats = useMemo(() => {
    const tech = new Set()
    projects.forEach(p => p.stack.forEach(t => tech.add(t)))
    return [
      { value: String(projects.length), label: 'Projects shipped' },
      { value: '2', label: 'Hackathon wins' },
      { value: String(tech.size), label: 'Technologies' },
    ]
  }, [])

  const detail = detailId ? projects.find(p => p.id === detailId) : null

  // Open a case-study; remember which section to return to.
  const openDetail = id => setDetailId(id)
  const closeDetail = () => setDetailId(null)

  const go = id => { setDetailId(null); setSection(id) }

  return (
    <div className="pf">
      {/* ── Sidebar rail ── */}
      <aside className="pf-rail">
        <div className="pf-id">
          <div className="pf-monogram">SK</div>
          <div className="pf-id-text">
            <span className="pf-id-name">Shreyas Kumar</span>
            <span className="pf-id-role">AI Engineer</span>
          </div>
        </div>

        <nav className="pf-nav">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              type="button"
              className={`pf-navitem${section === s.id && !detail ? ' active' : ''}`}
              onClick={() => go(s.id)}
            >
              <span className="pf-navglyph">{s.glyph}</span>
              {s.label}
            </button>
          ))}
        </nav>

        <div className="pf-rail-foot">
          <span className="pf-status"><i className="pf-status-dot" /> Open to work</span>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="pf-main">
        {detail ? (
          <ProjectDetail key={detail.id} project={detail} onBack={closeDetail} />
        ) : section === 'overview' ? (
          <Overview
            stats={stats}
            featured={featured}
            onOpen={openDetail}
            onSeeAll={() => go('work')}
          />
        ) : section === 'work' ? (
          <Work featured={featured} more={more} onOpen={openDetail} />
        ) : section === 'hackathons' ? (
          <Hackathons items={hackathons} onOpen={openDetail} />
        ) : section === 'stack' ? (
          <Stack groups={STACK_GROUPS} />
        ) : (
          <Contact api={api} />
        )}
      </main>
    </div>
  )
}

/* ───────────────────────── Overview ───────────────────────── */

function Overview({ stats, featured, onOpen, onSeeAll }) {
  return (
    <div className="pf-page pf-fade">
      <p className="pf-eyebrow">Portfolio</p>
      <h1 className="pf-hero">
        I build <span className="pf-hl">end-to-end AI products</span> —
        from the data underneath to the interface on top.
      </h1>
      <p className="pf-lede">
        Data and retrieval pipelines, model fine-tuning, and the screens people
        actually use. I care about systems that are honest, useful, and shipped.
      </p>

      <div className="pf-stats">
        {stats.map(s => (
          <div key={s.label} className="pf-stat">
            <span className="pf-stat-num">{s.value}</span>
            <span className="pf-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="pf-sectionhead">
        <h2 className="pf-h2">Selected work</h2>
        <button type="button" className="pf-seeall" onClick={onSeeAll}>See all →</button>
      </div>

      <div className="pf-grid">
        {featured.map(p => (
          <ProjectCard key={p.id} project={p} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}

/* ───────────────────────── Work ───────────────────────── */

function Work({ featured, more, onOpen }) {
  return (
    <div className="pf-page pf-fade">
      <p className="pf-eyebrow">Work</p>
      <h1 className="pf-title">Things I've designed, built, and shipped.</h1>

      <div className="pf-grid">
        {featured.map(p => (
          <ProjectCard key={p.id} project={p} onOpen={onOpen} />
        ))}
      </div>

      {more.length > 0 && (
        <>
          <h2 className="pf-h2 pf-h2-spaced">Also worth a look</h2>
          <div className="pf-grid">
            {more.map(p => (
              <ProjectCard key={p.id} project={p} onOpen={onOpen} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ───────────────────────── Hackathons ───────────────────────── */

function Hackathons({ items, onOpen }) {
  return (
    <div className="pf-page pf-fade">
      <p className="pf-eyebrow">Hackathons</p>
      <h1 className="pf-title">Built under pressure, shipped on the clock.</h1>

      <div className="pf-grid">
        {items.map(p => (
          <ProjectCard key={p.id} project={p} badge="★ Award" onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}

/* ───────────────────────── Stack ───────────────────────── */

function Stack({ groups }) {
  return (
    <div className="pf-page pf-fade">
      <p className="pf-eyebrow">Stack</p>
      <h1 className="pf-title">The tools I reach for.</h1>

      <div className="pf-stackgrid">
        {groups.map(g => (
          <div key={g.name} className="pf-stackgroup">
            <h3 className="pf-stackname">{g.name}</h3>
            <ul className="pf-chips">
              {g.items.map(t => (
                <li key={t} className="pf-chip">{t}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ───────────────────────── Contact ───────────────────────── */

function Contact({ api }) {
  return (
    <div className="pf-page pf-fade">
      <p className="pf-eyebrow">Contact</p>
      <h1 className="pf-title">Let's build something.</h1>
      <p className="pf-lede">
        I'm open to roles and collaborations in applied AI. The fastest way to
        reach me is a quick message.
      </p>

      <button
        type="button"
        className="pf-cta"
        onClick={() => api?.openApp?.('mail')}
      >
        ✉ Send a message
      </button>

      <ul className="pf-contacts">
        {CONTACTS.map(c => (
          <li key={c.label}>
            <a className="pf-contact" href={c.href} target="_blank" rel="noreferrer">
              <span className="pf-contact-glyph">{c.glyph}</span>
              <span className="pf-contact-meta">
                <span className="pf-contact-label">{c.label}</span>
                <span className="pf-contact-value">{c.value}</span>
              </span>
              <span className="pf-contact-arrow">↗</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ───────────────────────── Shared: card + detail ───────────────────────── */

function ProjectCard({ project: p, badge, onOpen }) {
  return (
    <button
      type="button"
      className="pf-card"
      style={{ '--accent': p.color }}
      onClick={() => onOpen(p.id)}
    >
      <span className="pf-card-bar" />
      <span className="pf-card-top">
        <span className="pf-card-title">{p.title}</span>
        {badge && <span className="pf-card-badge">{badge}</span>}
      </span>
      <span className="pf-card-hook">{p.hook}</span>
      <span className="pf-card-stack">
        {p.stack.slice(0, 4).map(t => (
          <span key={t} className="pf-chip sm">{t}</span>
        ))}
        {p.stack.length > 4 && <span className="pf-chip sm more">+{p.stack.length - 4}</span>}
      </span>
      <span className="pf-card-open">View case study →</span>
    </button>
  )
}

function ProjectDetail({ project: p, onBack }) {
  return (
    <article className="pf-detail pf-slide">
      <button type="button" className="pf-back" onClick={onBack}>← Back</button>

      <div className="pf-detail-hero" style={{ '--accent': p.color }}>
        <div className="pf-detail-herotext">
          <h1 className="pf-detail-title">{p.title}</h1>
          <p className="pf-detail-hook">{p.hook}</p>
        </div>
      </div>

      <div className="pf-detail-body">
        <section className="pf-block">
          <h3 className="pf-block-label">What I built</h3>
          <p className="pf-block-text">{p.what}</p>
        </section>

        <section className="pf-block">
          <h3 className="pf-block-label">Why it matters</h3>
          <p className="pf-block-text">{p.why}</p>
        </section>

        <section className="pf-block">
          <h3 className="pf-block-label">Built with</h3>
          <ul className="pf-chips">
            {p.stack.map(t => (
              <li key={t} className="pf-chip">{t}</li>
            ))}
          </ul>
        </section>

        <div className="pf-detail-links">
          {p.links.live && (
            <a className="pf-link primary" href={p.links.live} target="_blank" rel="noreferrer">{p.cta}</a>
          )}
          {p.links.repo && (
            <a className="pf-link" href={p.links.repo} target="_blank" rel="noreferrer">View code →</a>
          )}
          {!p.links.live && !p.links.repo && (
            <span className="pf-link-static">{p.cta}</span>
          )}
        </div>
      </div>
    </article>
  )
}
