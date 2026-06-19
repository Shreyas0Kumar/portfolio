import React, { useState, useRef, useEffect, useMemo } from 'react'
import './PortfolioApp.css'
import { usePortfolio, accentFor, SKILL_GROUP_LABELS } from '../../../../data/portfolio.jsx'

/**
 * PortfolioApp
 * A full-bleed editorial "magazine" rendition of the portfolio, fully driven by
 * public/portfolio.json. Keeps the warm paper system (Caveat
 * headlines, Source Serif 4 labels + body, espresso ink on cream with
 * a #c8782a orange) but trades the narrow column for a masthead + numbered
 * contents, a cover story, big-type project "articles", award stamps, a dated
 * experience timeline, and drop-capped case-study reads.
 *
 * Props:
 *   api {object} — { openApp, openAbout } from Desktop (used by Contact).
 */

const byOrder = (a, b) => (a.order ?? 99) - (b.order ?? 99)

const initials = name =>
  (name || '').trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

const short = url => (url || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

// A metric that LEADS with a number ("<300ms target latency") splits into a
// giant value + caption. Strings that don't lead with a number return null and
// are simply not shown as number callouts (their meaning lives in the prose).
const STAT_LEAD = /^([<~≈]?\$?\d[\d.,]*\s?(?:ms|s|%|M|K|GB|x|min|secs?|seconds?|days?|hrs?|hr)?)\b[\s,–-]*(.*)$/i
function leadStat(text) {
  const m = (text || '').match(STAT_LEAD)
  if (!m) return null
  return { n: m[1].trim(), l: (m[2] || '').replace(/\.$/, '') }
}
const numberMetrics = entry => (entry.metrics || []).map(leadStat).filter(Boolean)

// Short, rotated "stamp" text derived from a placement-style award. Honest about
// near-misses: only actual placements get a stamp (e.g. a 21st-place finish does
// not). The full award text still appears in the case-study sidebar.
function awardStamp(entry) {
  const a = (entry.awards || [])[0]
  if (!a) return null
  const s = a.toLowerCase()
  if (/\bfirst\b|\b1st\b|winner|\bwon\b/.test(s)) return 'First\nPrize'
  if (/runner-?up|\b2nd\b|\bsecond\b/.test(s)) return '2nd\nPlace'
  if (/\b3rd\b|\bthird\b/.test(s)) return '3rd\nPlace'
  return null
}

// Small categorizing kicker, derived from the data rather than hardcoded.
const projectKicker = p => [p.featured ? 'Featured' : 'Project', (p.tags || [])[0]].filter(Boolean).join(' · ')

const SECTIONS = [
  { id: 'overview',   label: 'Overview' },
  { id: 'work',       label: 'Work' },
  { id: 'hackathons', label: 'Hackathons' },
  { id: 'experience', label: 'Experience' },
  { id: 'stack',      label: 'Stack' },
  { id: 'contact',    label: 'Contact' },
]
const STACK_ORDER = ['languages', 'llmNlp', 'mlData', 'backendApis', 'deploymentTools']

export default function PortfolioApp({ api }) {
  const { profile, intro, projects, hackathons, experience, education, skills, contact } = usePortfolio()

  const [view, setView] = useState('overview')
  // detail = { kind: 'project' | 'experience', id } | null
  const [detail, setDetail] = useState(null)
  const scrollRef = useRef(null)

  // Reset scroll on any navigation, like turning a page.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [view, detail])

  const work = useMemo(() => [...projects].sort(byOrder), [projects])
  const hacks = useMemo(() => [...hackathons].sort(byOrder), [hackathons])
  const cover = useMemo(
    () => [...projects].filter(p => p.featured).sort(byOrder)[0] || work[0],
    [projects, work],
  )

  const stats = useMemo(() => {
    const wins = [...projects, ...hackathons].filter(awardStamp).length
    const tech = new Set(Object.values(skills).flat()).size
    return [
      { n: String(projects.length), l: 'Projects & builds' },
      { n: String(hackathons.length), l: 'Hackathons / comps' },
      { n: String(wins), l: wins === 1 ? 'Award won' : 'Awards won' },
      { n: `${tech}`, l: 'Technologies' },
    ]
  }, [projects, hackathons, skills])

  const current = useMemo(() => {
    if (!detail) return null
    if (detail.kind === 'experience') return experience.find(e => e.id === detail.id)
    return [...projects, ...hackathons].find(p => p.id === detail.id)
  }, [detail, experience, projects, hackathons])

  const openProject = id => setDetail({ kind: 'project', id })
  const openExperience = id => setDetail({ kind: 'experience', id })
  const back = () => setDetail(null)
  const go = id => { setDetail(null); setView(id) }

  const year = new Date().getFullYear()

  return (
    <div className="pf" ref={scrollRef}>
      {/* ===== MASTHEAD ===== */}
      <header className="pf-mast">
        <div className="pf-mast-top">
          <span>The Portfolio &nbsp;·&nbsp; Issue No. 01 · {year}</span>
          {profile.openToRelocate && (
            <span className="pf-mast-status">
              <i className="pf-status-dot" /> Open to work · {profile.location}
            </span>
          )}
        </div>
        <div className="pf-mast-main">
          <h1 className="pf-mast-name">{profile.name}</h1>
          <div className="pf-mast-roleblock">
            <div className="pf-mast-role">{profile.role}</div>
            <p className="pf-mast-tag">{profile.tagline}</p>
          </div>
        </div>
        <nav className="pf-nav">
          {SECTIONS.map((s, i) => {
            const active = !detail && view === s.id
            return (
              <button
                key={s.id}
                type="button"
                className={`pf-navbtn${active ? ' active' : ''}`}
                onClick={() => go(s.id)}
              >
                <span className="pf-navnum">{String(i + 1).padStart(2, '0')}</span>{s.label}
              </button>
            )
          })}
        </nav>
      </header>

      {/* ===== CONTENT ===== */}
      <div className="pf-content">
        {current ? (
          detail.kind === 'experience'
            ? <ExperienceDetail entry={current} onBack={back} />
            : <CaseStudy entry={current} onBack={back} />
        ) : view === 'overview' ? (
          <Overview
            intro={intro} stats={stats} cover={cover}
            teasers={work.filter(p => p.featured && p.id !== cover?.id)}
            onOpen={openProject} onSeeAll={() => go('work')}
          />
        ) : view === 'work' ? (
          <Work items={work} onOpen={openProject} />
        ) : view === 'hackathons' ? (
          <Hackathons items={hacks} onOpen={openProject} />
        ) : view === 'experience' ? (
          <Experience items={experience} education={education} onOpen={openExperience} />
        ) : view === 'stack' ? (
          <Stack skills={skills} />
        ) : (
          <Contact contact={contact} profile={profile} api={api} />
        )}
      </div>
    </div>
  )
}

/* ───────────────────────── Overview (No.01) ───────────────────────── */

function Overview({ intro, stats, cover, teasers, onOpen, onSeeAll }) {
  return (
    <section className="pf-fade">
      <p className="pf-eyebrow">No.01 — Overview</p>

      <div className="pf-ov-grid">
        <h2 className="pf-ov-head">{intro.heading}</h2>
        <div className="pf-ov-body">
          {intro.body.map((line, i) => <p key={i} className="pf-ov-line">{line}</p>)}
        </div>
      </div>

      <div className="pf-stats">
        {stats.map(s => (
          <div key={s.l} className="pf-stat">
            <div className="pf-stat-n">{s.n}</div>
            <div className="pf-stat-l">{s.l}</div>
          </div>
        ))}
      </div>

      {cover && (
        <>
          <div className="pf-bandhead pf-bandhead--strong">
            <h3>Cover Story</h3>
            <span>Featured project</span>
          </div>
          <article
            className="pf-cover"
            style={{ '--accent': accentFor(cover.id) }}
            onClick={() => onOpen(cover.id)}
          >
            <div className="pf-cover-img">
              {cover.images?.[0] && (
                <img className="pf-img-fill" src={cover.images[0]} alt={cover.name} loading="lazy" />
              )}
              <span className="pf-cover-idx">01</span>
              {!cover.images?.[0] && (
                <span className="pf-cover-cap">[ {(cover.assetPlaceholders || [])[0] || 'cover image'} ]</span>
              )}
            </div>
            <div className="pf-cover-body">
              <span className="pf-art-kicker">{projectKicker(cover)}</span>
              <h2 className="pf-cover-title">{cover.name}</h2>
              <p className="pf-cover-hook">{cover.homepage?.tagline}</p>
              <MetricRow metrics={numberMetrics(cover).slice(0, 3)} size="md" />
              <span className="pf-readcs">Read the case study →</span>
            </div>
          </article>
        </>
      )}

      {teasers.length > 0 && (
        <>
          <div className="pf-bandhead">
            <h3>Also Inside</h3>
            <button type="button" className="pf-textlink" onClick={onSeeAll}>All work →</button>
          </div>
          <div className="pf-teasers">
            {teasers.map(t => (
              <article key={t.id} className="pf-teaser" onClick={() => onOpen(t.id)}>
                <span className="pf-art-kicker">{projectKicker(t)}</span>
                <h4 className="pf-teaser-title">{t.name}</h4>
                <p className="pf-teaser-hook">{t.homepage?.tagline}</p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

/* ───────────────────────── Work (No.02) ───────────────────────── */

function Work({ items, onOpen }) {
  return (
    <section className="pf-fade">
      <p className="pf-eyebrow">No.02 — Work</p>
      <h2 className="pf-sectitle">Designed, built, and shipped.</h2>
      {items.map((p, i) => (
        <article key={p.id} className={`pf-article${i % 2 ? ' reverse' : ''}`} style={{ '--accent': accentFor(p.id) }}>
          <div className="pf-art-img" onClick={() => onOpen(p.id)}>
            {p.images?.[0] && (
              <img className="pf-img-fill" src={p.images[0]} alt={p.name} loading="lazy" />
            )}
            <span className="pf-art-idx">{String(i + 1).padStart(2, '0')}</span>
            {!p.images?.[0] && (
              <span className="pf-art-cap">[ {(p.assetPlaceholders || [])[0] || 'project image'} ]</span>
            )}
            {awardStamp(p) && <span className="pf-stamp">{awardStamp(p)}</span>}
          </div>
          <div className="pf-art-body">
            <div className="pf-art-meta">
              <span className="pf-art-kicker">{projectKicker(p)}</span>
              {p.timeframe && <><span className="pf-sep">/</span><span>{p.timeframe}</span></>}
              {p.status && <><span className="pf-sep">/</span><span>{p.status}</span></>}
            </div>
            <h3 className="pf-art-title">{p.name}</h3>
            <p className="pf-art-hook">{p.homepage?.tagline}</p>
            {p.role && <p className="pf-art-role">{p.role}</p>}
            <MetricRow metrics={numberMetrics(p).slice(0, 3)} size="md" />
            {p.techStack?.length > 0 && (
              <ul className="pf-chips">
                {p.techStack.slice(0, 6).map(t => <li key={t} className="pf-chip">{t}</li>)}
              </ul>
            )}
            <div className="pf-art-foot">
              <TeamLine collaborators={p.collaborators} />
              <button type="button" className="pf-readcs" onClick={() => onOpen(p.id)}>Read case study →</button>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}

/* ───────────────────────── Hackathons (No.03) ───────────────────────── */

function Hackathons({ items, onOpen }) {
  return (
    <section className="pf-fade">
      <p className="pf-eyebrow">No.03 — Hackathons & Competitions</p>
      <h2 className="pf-sectitle">Built under pressure, shipped on the clock.</h2>
      <div className="pf-hgrid">
        {items.map(p => (
          <article
            key={p.id}
            className="pf-hcard"
            style={{ '--accent': accentFor(p.id) }}
            onClick={() => onOpen(p.id)}
          >
            <div className="pf-hcard-top">
              <span className="pf-hcard-event">{p.event || 'Hackathon'}</span>
              {awardStamp(p) && <span className="pf-stamp pf-stamp--sm">{awardStamp(p)}</span>}
            </div>
            <h3 className="pf-hcard-title">{p.name}</h3>
            <p className="pf-hcard-hook">{p.homepage?.tagline}</p>
            <MetricRow metrics={numberMetrics(p).slice(0, 2)} size="sm" />
            {p.tags?.length > 0 && (
              <ul className="pf-chips">
                {p.tags.slice(0, 3).map(t => <li key={t} className="pf-chip">{t}</li>)}
              </ul>
            )}
            {p.location && <span className="pf-hcard-loc">{p.location}</span>}
          </article>
        ))}
      </div>
    </section>
  )
}

/* ───────────────────────── Experience (No.04) ───────────────────────── */

function expMeta(e) {
  return [
    e.advisor && `Advisor: ${e.advisor.name}`,
    e.manager && `Manager: ${e.manager.name}`,
    e.lab && e.lab.name,
  ].filter(Boolean)
}

function Experience({ items, education, onOpen }) {
  return (
    <section className="pf-fade">
      <p className="pf-eyebrow">No.04 — Experience</p>
      <h2 className="pf-sectitle">Where I've put the work in.</h2>
      {items.map(e => (
        <article key={e.id} className="pf-job" onClick={() => onOpen(e.id)}>
          <div className="pf-job-aside">
            <div className="pf-job-dates">{e.start} – {e.end}</div>
            {e.location && <div className="pf-job-loc">{e.location}</div>}
            {expMeta(e).map(m => <div key={m} className="pf-job-metaline">{m}</div>)}
          </div>
          <div className="pf-job-main">
            <h3 className="pf-job-company">{e.company}</h3>
            <div className="pf-job-role">{e.role}</div>
            {e.summary && <p className="pf-job-summary">{e.summary}</p>}
            {e.grounded?.length > 0 && (
              <ul className="pf-job-bullets">
                {e.grounded.slice(0, 4).map((b, i) => <li key={i} className="pf-bullet">{b}</li>)}
              </ul>
            )}
            <button type="button" className="pf-readcs" onClick={() => onOpen(e.id)}>Read the full story →</button>
          </div>
        </article>
      ))}

      {education?.length > 0 && (
        <>
          <h3 className="pf-subhead">Education</h3>
          <div className="pf-edugrid">
            {education.map(ed => (
              <div key={ed.institution} className="pf-edu">
                <h4 className="pf-edu-school">{ed.institution}</h4>
                <div className="pf-edu-degree">{ed.degree}</div>
                <div className="pf-edu-meta">
                  {ed.start} – {ed.end}{ed.gpa ? <> &nbsp;·&nbsp; <span className="pf-accent">GPA {ed.gpa}</span></> : null}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

/* ───────────────────────── Stack (No.05) ───────────────────────── */

function Stack({ skills }) {
  const keys = [
    ...STACK_ORDER.filter(k => skills[k]),
    ...Object.keys(skills).filter(k => !STACK_ORDER.includes(k)),
  ]
  return (
    <section className="pf-fade">
      <p className="pf-eyebrow">No.05 — Stack</p>
      <h2 className="pf-sectitle">The tools I reach for.</h2>
      <div className="pf-stackgrid">
        {keys.map(k => (
          <div key={k} className="pf-stackgroup">
            <h3 className="pf-stack-name">{SKILL_GROUP_LABELS[k] || k}</h3>
            <ul className="pf-chips">
              {skills[k].map(t => <li key={t} className="pf-chip pf-chip--lg">{t}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ───────────────────────── Contact (No.06) ───────────────────────── */

function Contact({ contact, profile, api }) {
  const links = [
    { label: 'Email', value: profile.email, href: `mailto:${profile.email}`, glyph: '✉' },
    profile.links?.github && { label: 'GitHub', value: short(profile.links.github), href: profile.links.github, glyph: '⌥' },
    profile.links?.linkedin && { label: 'LinkedIn', value: short(profile.links.linkedin), href: profile.links.linkedin, glyph: '⌘' },
    profile.phone && { label: 'Phone', value: profile.phone, href: `tel:${profile.phone.replace(/\s+/g, '')}`, glyph: '☎' },
  ].filter(Boolean)

  return (
    <section className="pf-fade">
      <p className="pf-eyebrow">No.06 — Contact</p>
      <h2 className="pf-contact-title">Let's build something.</h2>
      <div className="pf-contact-grid">
        <div>
          {contact.body.map((line, i) => <p key={i} className="pf-contact-line">{line}</p>)}
          <button type="button" className="pf-contact-btn" onClick={() => api?.openApp?.('mail')}>
            ✉ Send a message
          </button>
        </div>
        <ul className="pf-links">
          {links.map(c => (
            <li key={c.label}>
              <a className="pf-link-row" href={c.href} target="_blank" rel="noreferrer">
                <span className="pf-link-glyph">{c.glyph}</span>
                <span className="pf-link-meta">
                  <span className="pf-link-label">{c.label}</span>
                  <span className="pf-link-value">{c.value}</span>
                </span>
                <span className="pf-link-arrow">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ───────────────────────── Case study (project / hackathon) ───────────────────────── */

function CaseStudy({ entry: p, onBack }) {
  const sections = p.detailContent?.sections || []
  const linkList = [
    p.links?.product && { href: p.links.product, label: 'Visit product →', primary: true },
    p.links?.repo && { href: p.links.repo, label: 'View code →' },
  ].filter(Boolean)

  return (
    <article className="pf-detail pf-fade" style={{ '--accent': accentFor(p.id) }}>
      <button type="button" className="pf-back" onClick={onBack}>← Back</button>

      <div className="pf-detail-head">
        <span className="pf-art-kicker">{projectKicker(p)}</span>
        <h2 className="pf-detail-title">{p.name}</h2>
        <p className="pf-detail-hook">{p.homepage?.tagline}</p>
      </div>

      <div className="pf-detail-grid">
        <div className="pf-story">
          <ImageGallery images={p.images} name={p.name} />
          <StoryBody role={p.role} sections={sections} />
        </div>

        <aside className="pf-aside">
          {awardStamp(p) && <div className="pf-stamp pf-aside-stamp">{awardStamp(p)}</div>}
          <Fact label="Timeframe" value={p.timeframe} />
          <Fact label="Status" value={p.status} />
          {p.event && <Fact label="Event" value={p.event} />}
          {p.location && <Fact label="Where" value={p.location} />}

          {p.awards?.length > 0 && (
            <div className="pf-aside-block">
              <div className="pf-aside-label">Recognition</div>
              {p.awards.map(a => <div key={a} className="pf-aside-award">★ {a}</div>)}
            </div>
          )}

          <AsideMetrics metrics={numberMetrics(p).slice(0, 4)} />

          {p.techStack?.length > 0 && (
            <div className="pf-aside-block">
              <div className="pf-aside-label">Built with</div>
              <ul className="pf-chips">
                {p.techStack.map(t => <li key={t} className="pf-chip">{t}</li>)}
              </ul>
            </div>
          )}

          <CollabList people={p.collaborators} />
          <AsideLinks links={linkList} posts={p.linkedinPosts} />
        </aside>
      </div>
    </article>
  )
}

/* ───────────────────────── Experience detail ───────────────────────── */

function ExperienceDetail({ entry: e, onBack }) {
  const sections = e.detailContent?.sections || []
  const refs = [
    e.lab && { label: 'Lab', ...e.lab },
    e.advisor && { label: 'Advisor', ...e.advisor },
    e.manager && { label: 'Manager', ...e.manager },
  ].filter(Boolean)

  return (
    <article className="pf-detail pf-fade" style={{ '--accent': accentFor(e.id) }}>
      <button type="button" className="pf-back" onClick={onBack}>← Back</button>

      <div className="pf-detail-head">
        <span className="pf-art-kicker">{e.company}</span>
        <h2 className="pf-detail-title">{e.role}</h2>
        {e.summary && <p className="pf-detail-hook">{e.summary}</p>}
      </div>

      <div className="pf-detail-grid">
        <div className="pf-story">
          <StoryBody sections={sections} />
          {sections.length === 0 && e.grounded?.length > 0 && (
            <>
              <h3 className="pf-story-h">Highlights</h3>
              <ul className="pf-job-bullets">
                {e.grounded.map((b, i) => <li key={i} className="pf-bullet">{b}</li>)}
              </ul>
            </>
          )}
        </div>

        <aside className="pf-aside">
          <Fact label="Timeframe" value={`${e.start} – ${e.end}`} />
          {e.location && <Fact label="Location" value={e.location} />}

          {refs.length > 0 && (
            <div className="pf-aside-block">
              {refs.map(r => (
                <div key={r.label} className="pf-ref">
                  <span className="pf-aside-label">{r.label}</span>
                  {r.url
                    ? <a className="pf-ref-name" href={r.url} target="_blank" rel="noreferrer">{r.name} ↗</a>
                    : <span className="pf-ref-name">{r.name}</span>}
                </div>
              ))}
            </div>
          )}

          {e.team?.length > 0 && (
            <div className="pf-aside-block">
              <div className="pf-aside-label">Team</div>
              <div className="pf-aside-team">
                {e.team.map(m => (
                  <span key={m.name} className="pf-teammember">
                    <span className="pf-avatar">{initials(m.name)}</span>
                    {m.name}{m.role ? ` — ${m.role}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          <AsideLinks links={[e.links?.repo && { href: e.links.repo, label: 'View code →' }].filter(Boolean)} posts={e.linkedinPosts} />
        </aside>
      </div>
    </article>
  )
}

/* ───────────────────────── Shared detail parts ───────────────────────── */

// Drop-capped first paragraph, then the rest of the story, like a magazine read.
function StoryBody({ role, sections }) {
  const secs = sections || []
  const first = secs[0]
  const lead = first?.body?.[0] || ''
  return (
    <>
      {role && (
        <p className="pf-story-role">{role}</p>
      )}
      {first && (
        <>
          <h3 className="pf-story-h">{first.heading}</h3>
          {lead && (
            <p className="pf-story-p">
              <span className="pf-dropcap">{lead.charAt(0)}</span>{lead.slice(1)}
            </p>
          )}
          {(first.body || []).slice(1).map((para, i) => <p key={i} className="pf-story-p">{para}</p>)}
        </>
      )}
      {secs.slice(1).map((sec, i) => (
        <section key={i}>
          <h3 className="pf-story-h">{sec.heading}</h3>
          {(sec.body || []).map((para, j) => <p key={j} className="pf-story-p">{para}</p>)}
        </section>
      ))}
    </>
  )
}

function MetricRow({ metrics, size }) {
  if (!metrics?.length) return null
  return (
    <div className={`pf-metricrow pf-metricrow--${size || 'md'}`}>
      {metrics.map(m => (
        <div key={m.n + m.l} className="pf-metric">
          <div className="pf-metric-n">{m.n}</div>
          <div className="pf-metric-l">{m.l}</div>
        </div>
      ))}
    </div>
  )
}

function AsideMetrics({ metrics }) {
  if (!metrics?.length) return null
  return (
    <div className="pf-aside-block">
      <div className="pf-aside-metrics">
        {metrics.map(m => (
          <div key={m.n + m.l} className="pf-metric">
            <div className="pf-metric-n">{m.n}</div>
            <div className="pf-metric-l">{m.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Fact({ label, value }) {
  if (!value) return null
  return (
    <div className="pf-fact">
      <div className="pf-aside-label">{label}</div>
      <div className="pf-fact-val">{value}</div>
    </div>
  )
}

function TeamLine({ collaborators }) {
  const people = collaborators || []
  if (people.length === 0) return <span className="pf-teamlabel">Solo build</span>
  const others = people.filter(c => c.name !== 'Shreyas Kumar')
  return (
    <span className="pf-team">
      <span className="pf-avatars">
        {people.slice(0, 4).map(c => (
          <span key={c.name} className="pf-avatar" title={c.name}>{initials(c.name)}</span>
        ))}
      </span>
      {others.length > 0 && (
        <span className="pf-teamlabel">with {others.map(c => c.name.split(' ')[0]).join(', ')}</span>
      )}
    </span>
  )
}

function CollabList({ people }) {
  if (!people?.length) return null
  return (
    <div className="pf-aside-block">
      <div className="pf-aside-label">Team</div>
      <div className="pf-aside-team">
        {people.map(c => (
          c.github
            ? <a key={c.name} className="pf-teammember" href={c.github} target="_blank" rel="noreferrer">
                <span className="pf-avatar">{initials(c.name)}</span>{c.name} ↗
              </a>
            : <span key={c.name} className="pf-teammember"><span className="pf-avatar">{initials(c.name)}</span>{c.name}</span>
        ))}
      </div>
    </div>
  )
}

function AsideLinks({ links, posts }) {
  const real = links || []
  const hasPosts = posts?.length > 0
  if (real.length === 0 && !hasPosts) return null
  return (
    <div className="pf-aside-links">
      {real.map(l => (
        <a key={l.href} className={`pf-aside-link${l.primary ? ' primary' : ''}`} href={l.href} target="_blank" rel="noreferrer">
          {l.label}
        </a>
      ))}
      {posts?.map((href, i) => (
        <a key={href} className="pf-aside-link ghost" href={href} target="_blank" rel="noreferrer">
          LinkedIn{posts.length > 1 ? ` #${i + 1}` : ''} ↗
        </a>
      ))}
    </div>
  )
}

function ImageGallery({ images, name }) {
  if (!images?.length) return null
  return (
    <div className="pf-gallery">
      {images.map((src, i) => (
        <img key={i} className="pf-gallery-img" src={src} alt={`${name} screenshot ${i + 1}`} loading="lazy" />
      ))}
    </div>
  )
}
