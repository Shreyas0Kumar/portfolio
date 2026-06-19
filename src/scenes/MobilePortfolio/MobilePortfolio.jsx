import React, { useState } from 'react'
import { usePortfolio, accentFor } from '../../data/portfolio.jsx'
import MobileIntro from './MobileIntro.jsx'
import './MobilePortfolio.css'

/**
 * MobilePortfolio
 * A "printed magazine" edition of the portfolio for phones / touch screens, where
 * the draggable desktop metaphor doesn't work. It's a sectioned reader (Overview,
 * Work, Hackathons, Experience, Stack, Interviews, Contact) with tap-through detail
 * pages — fully driven by public/portfolio.json (via usePortfolio), so editing the
 * JSON updates the whole thing with no code changes.
 */

// Shown once per browser session so a refresh doesn't re-nag, but a fresh visit
// still gets the "open on desktop" pitch.
const INTRO_KEY = 'shreyas-mobile-intro-seen'

const byOrder = (a, b) => (a.order ?? 99) - (b.order ?? 99)

// The masthead nav + the section each tab maps to.
const SECTIONS = [
  ['01', 'Overview', 'overview'],
  ['02', 'Work', 'work'],
  ['03', 'Hacks', 'hackathons'],
  ['04', 'Career', 'experience'],
  ['05', 'Stack', 'stack'],
  ['06', 'Interviews', 'interviews'],
  ['07', 'Contact', 'contact'],
]

const STACK_LABELS = {
  llmNlp: 'LLMs & NLP',
  mlData: 'ML & Data',
  backendApis: 'Backend & APIs',
  deploymentTools: 'Deployment & Tools',
  languages: 'Languages',
}
const STACK_ORDER = ['languages', 'llmNlp', 'mlData', 'backendApis', 'deploymentTools']

// Data-driven chip colours for interview difficulty / outcome. [bg, fg]
const DIFF_COLORS = {
  Easy: ['#d8f0d4', '#2f7d33'],
  Medium: ['#fbecc8', '#9a6a16'],
  Hard: ['#f4d4d0', '#a8362b'],
}
const OUTCOME_COLORS = {
  Offer: ['#d8f0d4', '#1f7a3a'],
  'In process': ['#dfe7f2', '#3a5a86'],
  Rejected: ['#f1e0dc', '#9a5048'],
  Waitlisted: ['#f3e8d0', '#8a5a2a'],
}

/* ── presentation-only helpers (shape JSON for the UI, never invent content) ── */

const initials = n =>
  (n || '').trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

const shortUrl = u => (u || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

// Split a metric string like "120ms p95 latency" into a big number + a label.
function leadStat(t) {
  const m = (t || '').match(
    /^([<~≈]?\$?\d[\d.,]*\s?(?:ms|s|%|M|K|GB|x|min|secs?|seconds?|days?|hrs?|hr)?)\b[\s,–-]*(.*)$/i,
  )
  if (!m) return null
  return { n: m[1].trim(), l: (m[2] || '').replace(/\.$/, '') }
}
const numMetrics = e => (e.metrics || []).map(leadStat).filter(Boolean)

// A round "rubber stamp" for podium finishes, derived from the first award line.
function awardStamp(e) {
  const a = (e.awards || [])[0]
  if (!a) return null
  const s = a.toLowerCase()
  if (/\bfirst\b|\b1st\b|winner|\bwon\b/.test(s)) return 'First\nPrize'
  if (/runner-?up|\b2nd\b|\bsecond\b/.test(s)) return '2nd\nPlace'
  if (/\b3rd\b|\bthird\b/.test(s)) return '3rd\nPlace'
  return null
}

const kickerFor = p => [p.featured ? 'Featured' : 'Project', (p.tags || [])[0]].filter(Boolean).join(' · ')

function teamLabel(p) {
  const people = p.collaborators || []
  if (!people.length) return 'Solo build'
  const others = people.filter(c => c.name !== 'Shreyas Kumar')
  return others.length ? 'with ' + others.map(c => c.name.split(' ')[0]).join(', ') : 'Solo build'
}

// Turn detailContent sections into a "lead paragraph with drop cap, then the rest".
function buildStory(secs) {
  if (!secs || !secs.length) {
    return { empty: true, leadHeading: '', leadChar: '', leadRest: '', leadExtra: [], rest: [] }
  }
  const first = secs[0]
  const lead = (first.body && first.body[0]) || ''
  return {
    empty: false,
    leadHeading: first.heading,
    leadChar: lead.charAt(0),
    leadRest: lead.slice(1),
    leadExtra: (first.body || []).slice(1),
    rest: secs.slice(1).map(s => ({ heading: s.heading, body: s.body || [] })),
  }
}

export default function MobilePortfolio() {
  const data = usePortfolio()

  const [showIntro, setShowIntro] = useState(() => {
    try { return sessionStorage.getItem(INTRO_KEY) !== '1' } catch { return true }
  })
  const [view, setView] = useState('overview')
  const [detail, setDetail] = useState(null) // { kind: 'project' | 'experience', id }
  const [openIv, setOpenIv] = useState(null)

  const dismissIntro = () => {
    try { sessionStorage.setItem(INTRO_KEY, '1') } catch { /* ignore */ }
    setShowIntro(false)
  }
  const toTop = () => { try { window.scrollTo(0, 0) } catch { /* ignore */ } }
  const go = next => { setView(next); setDetail(null); toTop() }
  const open = (kind, id) => { setDetail({ kind, id }); toTop() }
  const back = () => { setDetail(null); toTop() }

  if (showIntro) return <MobileIntro onContinue={dismissIntro} />

  const projects = [...(data.projects || [])].sort(byOrder)
  const hacks = [...(data.hackathons || [])].sort(byOrder)
  const builtDetail = detail ? buildDetail(data, detail, projects, hacks) : null

  return (
    <div className="mag-viewport">
      <div className="mag">
        <header className="mag-masthead">
          <div className="mag-folio">
            <span>The Portfolio &nbsp;·&nbsp; No.01 &nbsp;·&nbsp; {new Date().getFullYear()}</span>
            <span className="mag-status"><i className="mag-dot" />Open to work</span>
          </div>
          <div className="mag-title-block">
            <h1 className="mag-name">{data.profile.name}</h1>
            <div className="mag-byline">{data.profile.role} &nbsp;·&nbsp; {data.profile.location}</div>
            <p className="mag-deck">{data.profile.tagline}</p>
          </div>
          <nav className="mag-nav">
            {SECTIONS.map(([num, label, id]) => {
              const active = !detail && view === id
              return (
                <button
                  key={id}
                  className={'mag-tab' + (active ? ' is-active' : '')}
                  onClick={() => go(id)}
                >
                  <span className="mag-tab-num">{num}</span>{label}
                </button>
              )
            })}
          </nav>
        </header>

        <main className="mag-main">
          {builtDetail ? (
            <DetailView detail={builtDetail} onBack={back} />
          ) : view === 'overview' ? (
            <Overview data={data} projects={projects} hacks={hacks} onOpen={open} onWork={() => go('work')} />
          ) : view === 'work' ? (
            <Work projects={projects} onOpen={open} />
          ) : view === 'hackathons' ? (
            <Hacks hacks={hacks} onOpen={open} />
          ) : view === 'experience' ? (
            <Experience data={data} onOpen={open} />
          ) : view === 'stack' ? (
            <Stack skills={data.skills || {}} />
          ) : view === 'interviews' ? (
            <Interviews
              interviews={data.interviews || {}}
              openIv={openIv}
              onToggle={id => setOpenIv(cur => (cur === id ? null : id))}
            />
          ) : (
            <Contact data={data} />
          )}
        </main>
      </div>
    </div>
  )
}

/* ───────────────────────────── Overview ───────────────────────────── */

function Overview({ data, projects, hacks, onOpen, onWork }) {
  const intro = data.intro || {}
  const wins = [...projects, ...hacks].filter(awardStamp).length
  const tech = new Set(Object.values(data.skills || {}).flat()).size
  const stats = [
    { n: String(projects.length), l: 'Projects & builds' },
    { n: String(hacks.length), l: 'Hackathons / comps' },
    { n: String(wins), l: wins === 1 ? 'Award won' : 'Awards won' },
    { n: String(tech), l: 'Technologies' },
  ]

  const cover = projects.filter(p => p.featured).sort(byOrder)[0] || projects[0]
  const teasers = projects.filter(p => p.featured && (!cover || p.id !== cover.id))

  return (
    <section className="mag-section">
      <p className="mag-eyebrow">No.01 — Overview</p>
      <h2 className="mag-display">{intro.heading}</h2>
      <div className="mag-lede">
        {(intro.body || []).map((line, i) => <p key={i} className="mag-lede-line">{line}</p>)}
      </div>

      <div className="mag-stats">
        {stats.map((st, i) => (
          <div key={i} className="mag-stat">
            <div className="mag-stat-n">{st.n}</div>
            <div className="mag-stat-l">{st.l}</div>
          </div>
        ))}
      </div>

      {cover && (
        <>
          <div className="mag-rule mag-rule--heavy">
            <h3 className="mag-kicker">Cover Story</h3>
            <span className="mag-rule-note">Featured project</span>
          </div>
          <article className="mag-cover" onClick={() => onOpen('project', cover.id)}>
            <div className="mag-frame mag-frame--cover">
              <span className="mag-frame-num">01</span>
              <span className="mag-frame-cap">[ {(cover.assetPlaceholders || [])[0] || 'cover image'} ]</span>
            </div>
            <div className="mag-cover-body">
              <span className="mag-card-kicker">{kickerFor(cover)}</span>
              <h2 className="mag-cover-title">{cover.name}</h2>
              <p className="mag-cover-hook">{cover.homepage?.tagline}</p>
              <Metrics list={numMetrics(cover).slice(0, 3)} />
              <span className="mag-readlink">Read the case study →</span>
            </div>
          </article>
        </>
      )}

      {teasers.length > 0 && (
        <>
          <div className="mag-rule">
            <h3 className="mag-kicker">Also Inside</h3>
            <button className="mag-link" onClick={onWork}>All work →</button>
          </div>
          {teasers.map(t => (
            <article key={t.id} className="mag-teaser" onClick={() => onOpen('project', t.id)}>
              <span className="mag-card-kicker">{kickerFor(t)}</span>
              <h4 className="mag-teaser-title">{t.name}</h4>
              <p className="mag-teaser-hook">{t.homepage?.tagline}</p>
            </article>
          ))}
        </>
      )}
    </section>
  )
}

/* ─────────────────────────────── Work ─────────────────────────────── */

function Work({ projects, onOpen }) {
  return (
    <section className="mag-section">
      <p className="mag-eyebrow">No.02 — Work</p>
      <h2 className="mag-display mag-display--ruled">Designed, built &amp; shipped.</h2>
      {projects.map((p, i) => (
        <article key={p.id} className="mag-work">
          <div className="mag-frame mag-frame--work" onClick={() => onOpen('project', p.id)}>
            <span className="mag-frame-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="mag-frame-cap">[ {(p.assetPlaceholders || [])[0] || 'project image'} ]</span>
            <Stamp text={awardStamp(p)} size="lg" />
          </div>
          <div className="mag-meta">
            <span className="mag-meta-accent">{kickerFor(p)}</span>
            {p.timeframe && <><span className="mag-meta-sep">/</span><span>{p.timeframe}</span></>}
            {p.status && <><span className="mag-meta-sep">/</span><span>{p.status}</span></>}
          </div>
          <h3 className="mag-work-title">{p.name}</h3>
          <p className="mag-work-hook">{p.homepage?.tagline}</p>
          {p.role && <p className="mag-work-role">{p.role}</p>}
          <Metrics list={numMetrics(p).slice(0, 3)} />
          <Chips list={(p.techStack || []).slice(0, 6)} />
          <div className="mag-work-foot">
            <span className="mag-work-team">{teamLabel(p)}</span>
            <button className="mag-readbtn" onClick={() => onOpen('project', p.id)}>Read case study →</button>
          </div>
        </article>
      ))}
    </section>
  )
}

/* ──────────────────────────── Hackathons ──────────────────────────── */

function Hacks({ hacks, onOpen }) {
  return (
    <section className="mag-section">
      <p className="mag-eyebrow">No.03 — Hackathons &amp; Competitions</p>
      <h2 className="mag-display mag-display--ruled">Built under pressure, shipped on the clock.</h2>
      {hacks.map(p => (
        <article key={p.id} className="mag-hack" onClick={() => onOpen('project', p.id)}>
          <div className="mag-hack-top">
            <span className="mag-hack-event">{p.event || 'Hackathon'}</span>
            <Stamp text={awardStamp(p)} size="sm" />
          </div>
          <h3 className="mag-hack-title">{p.name}</h3>
          <p className="mag-hack-hook">{p.homepage?.tagline}</p>
          <Metrics list={numMetrics(p).slice(0, 2)} />
          <Chips list={(p.tags || []).slice(0, 3)} />
          {p.location && <span className="mag-hack-loc">{p.location}</span>}
        </article>
      ))}
    </section>
  )
}

/* ───────────────────────────── Experience ─────────────────────────── */

function Experience({ data, onOpen }) {
  const jobs = data.experience || []
  const education = data.education || []
  return (
    <section className="mag-section">
      <p className="mag-eyebrow">No.04 — Experience</p>
      <h2 className="mag-display mag-display--ruled">Where I've put the work in.</h2>
      {jobs.map(e => {
        const meta = [
          e.advisor && 'Advisor: ' + e.advisor.name,
          e.manager && 'Manager: ' + e.manager.name,
          e.lab && e.lab.name,
        ].filter(Boolean)
        return (
          <article key={e.id} className="mag-job" onClick={() => onOpen('experience', e.id)}>
            <div className="mag-job-when">
              <div className="mag-job-dates">{e.start} – {e.end}</div>
              {e.location && <div className="mag-job-meta">{e.location}</div>}
              {meta.map((m, i) => <div key={i} className="mag-job-meta">{m}</div>)}
            </div>
            <h3 className="mag-job-company">{e.company}</h3>
            <div className="mag-job-role">{e.role}</div>
            <p className="mag-job-summary">{e.summary}</p>
            <ul className="mag-bullets">
              {(e.grounded || []).slice(0, 4).map((b, i) => <li key={i}>{b}</li>)}
            </ul>
            <button className="mag-readbtn" onClick={() => onOpen('experience', e.id)}>Read the full story →</button>
          </article>
        )
      })}

      {education.length > 0 && (
        <>
          <h3 className="mag-subhead">Education</h3>
          {education.map((ed, i) => (
            <div key={i} className="mag-edu">
              <h4 className="mag-edu-school">{ed.institution}</h4>
              <div className="mag-edu-degree">{ed.degree}</div>
              <div className="mag-edu-meta">
                {ed.start} – {ed.end}{ed.gpa ? `  ·  GPA ${ed.gpa}` : ''}
              </div>
            </div>
          ))}
        </>
      )}
    </section>
  )
}

/* ─────────────────────────────── Stack ────────────────────────────── */

function Stack({ skills }) {
  const keys = [
    ...STACK_ORDER.filter(k => skills[k]),
    ...Object.keys(skills).filter(k => !STACK_ORDER.includes(k)),
  ]
  return (
    <section className="mag-section">
      <p className="mag-eyebrow">No.05 — Stack</p>
      <h2 className="mag-display mag-display--ruled">The tools I reach for.</h2>
      {keys.map(k => (
        <div key={k} className="mag-stackgroup">
          <h3 className="mag-stackname">{STACK_LABELS[k] || k}</h3>
          <ul className="mag-chiprow mag-chiprow--lg">
            {(skills[k] || []).map(c => <li key={c}>{c}</li>)}
          </ul>
        </div>
      ))}
    </section>
  )
}

/* ──────────────────────────── Interviews ──────────────────────────── */

function Interviews({ interviews, openIv, onToggle }) {
  const items = [...(interviews.items || [])].sort(byOrder)
  const rated = items.filter(i => typeof i.rating === 'number')
  const avg = rated.length ? (rated.reduce((s, i) => s + i.rating, 0) / rated.length).toFixed(1) : '—'
  const stats = [
    { n: String(items.length), l: 'Total interviews' },
    { n: avg + '★', l: 'Avg experience' },
    { n: String(items.filter(i => i.outcome === 'Offer').length), l: 'Offers received' },
    { n: String(items.filter(i => i.ongoing || i.outcome === 'In process').length), l: 'In process' },
  ]

  return (
    <section className="mag-section">
      <p className="mag-eyebrow">No.06 — Interview Reviews</p>
      <div className="mag-stats mag-stats--tight">
        {stats.map((st, i) => (
          <div key={i} className="mag-stat">
            <div className="mag-stat-n mag-stat-n--sm">{st.n}</div>
            <div className="mag-stat-l">{st.l}</div>
          </div>
        ))}
      </div>
      <h2 className="mag-display mag-display--ruled">Every loop, told honestly.</h2>
      <p className="mag-note-block">
        Honest accounts of every interview I've been through — what they asked, how it went,
        and what I'd do differently. Tap one to read the whole story.
      </p>
      {items.map(iv => (
        <InterviewCard key={iv.id} iv={iv} open={openIv === iv.id} onToggle={() => onToggle(iv.id)} />
      ))}
    </section>
  )
}

function InterviewCard({ iv, open, onToggle }) {
  const [outBg, outFg] = OUTCOME_COLORS[iv.outcome] || ['rgba(26,18,8,.08)', '#6b6051']

  if (iv.ongoing) {
    return (
      <div className="mag-iv mag-iv--locked">
        <div className="mag-iv-blur">
          <span className="mag-iv-kicker">{[iv.location, iv.when].filter(Boolean).join(' · ')}</span>
          <span className="mag-iv-company">{iv.company}</span>
          <span className="mag-iv-role">{iv.role}</span>
        </div>
        <div className="mag-iv-lock">
          <span className="mag-iv-lockglyph">🔒</span>
          <span>Still in process — I'll write this one up once it wraps.</span>
        </div>
        {iv.outcome && (
          <span className="mag-pill" style={{ position: 'absolute', top: 14, right: 16, background: outBg, color: outFg }}>
            {iv.outcome}
          </span>
        )}
      </div>
    )
  }

  const [diffBg, diffFg] = DIFF_COLORS[iv.difficulty] || ['rgba(26,18,8,.08)', '#6b6051']
  const facts = [
    { label: 'When', value: iv.when },
    { label: 'Location', value: iv.location },
    { label: 'Difficulty', value: iv.difficulty },
    { label: 'Outcome', value: iv.outcome },
  ].filter(f => f.value)
  const sections = (iv.detailContent && iv.detailContent.sections) || []

  return (
    <div className="mag-iv">
      <button className="mag-iv-head" onClick={onToggle}>
        <span className="mag-iv-headmain">
          <span className="mag-iv-kicker">{[iv.location, iv.when].filter(Boolean).join(' · ')}</span>
          <span className="mag-iv-company">{iv.company}</span>
          <span className="mag-iv-role">{iv.role}</span>
        </span>
        <span className="mag-iv-headside">
          <span className="mag-stars">
            {[1, 2, 3, 4, 5].map(n => (
              <span key={n} style={{ color: n <= (iv.rating || 0) ? '#0caa41' : 'rgba(26,18,8,.18)' }}>★</span>
            ))}
          </span>
          <span className="mag-iv-pills">
            {iv.difficulty && <span className="mag-pill" style={{ background: diffBg, color: diffFg }}>{iv.difficulty}</span>}
            {iv.outcome && <span className="mag-pill" style={{ background: outBg, color: outFg }}>{iv.outcome}</span>}
          </span>
          <span className="mag-iv-chev">{open ? '▾' : '▸'}</span>
        </span>
      </button>

      {open && (
        <div className="mag-iv-body">
          {facts.length > 0 && (
            <div className="mag-factgrid">
              {facts.map((f, i) => (
                <div key={i} className="mag-fact">
                  <div className="mag-fact-l">{f.label}</div>
                  <div className="mag-fact-v">{f.value}</div>
                </div>
              ))}
            </div>
          )}

          {iv.rounds && iv.rounds.length > 0 && (
            <>
              <h3 className="mag-iv-h">The process</h3>
              <ol className="mag-rounds">
                {iv.rounds.map((r, i) => (
                  <li key={i}>
                    <span className="mag-round-name">{r.stage}{r.date ? ' · ' + r.date : ''}</span>
                    <span className="mag-round-detail">{r.description}</span>
                  </li>
                ))}
              </ol>
            </>
          )}

          {iv.questionsAsked && iv.questionsAsked.length > 0 && (
            <>
              <h3 className="mag-iv-h">Questions they asked</h3>
              <ul className="mag-qs">
                {iv.questionsAsked.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </>
          )}

          {iv.takeaway && (
            <>
              <h3 className="mag-iv-h">Takeaway</h3>
              <blockquote className="mag-quote">{iv.takeaway}</blockquote>
            </>
          )}

          {sections.length > 0 && (
            <>
              <h3 className="mag-iv-h">The full story</h3>
              {sections.map((s, i) => (
                <div key={i} className="mag-iv-sec">
                  <h4 className="mag-iv-sech">{s.heading}</h4>
                  {(s.body || []).map((para, j) => <p key={j} className="mag-iv-p">{para}</p>)}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ────────────────────────────── Contact ───────────────────────────── */

function Contact({ data }) {
  const pr = data.profile || {}
  const contact = data.contact || {}
  const links = [
    { label: 'Email', value: pr.email, href: 'mailto:' + pr.email, glyph: '✉' },
    pr.links?.github && { label: 'GitHub', value: shortUrl(pr.links.github), href: pr.links.github, glyph: 'GH' },
    pr.links?.linkedin && { label: 'LinkedIn', value: shortUrl(pr.links.linkedin), href: pr.links.linkedin, glyph: 'in' },
    pr.phone && { label: 'Phone', value: pr.phone, href: 'tel:' + pr.phone.replace(/\s+/g, ''), glyph: '☎' },
  ].filter(Boolean)

  return (
    <section className="mag-section">
      <p className="mag-eyebrow">No.07 — Contact</p>
      <h2 className="mag-display mag-display--ruled mag-display--xl">{contact.heading || "Let's build something."}</h2>
      {(contact.body || []).map((line, i) => <p key={i} className="mag-contact-line">{line}</p>)}
      <a className="mag-sendbtn" href={`mailto:${pr.email}`}>✉ &nbsp;Send a message</a>
      <ul className="mag-contacts">
        {links.map(c => (
          <li key={c.label}>
            <a href={c.href} target="_blank" rel="noreferrer" className="mag-contact-row">
              <span className="mag-contact-glyph">{c.glyph}</span>
              <span className="mag-contact-text">
                <span className="mag-contact-label">{c.label}</span>
                <span className="mag-contact-value">{c.value}</span>
              </span>
              <span className="mag-contact-arrow">↗</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mag-coda">
        This is the mobile edition. The full interactive desktop — a 3D room you boot into a
        macOS of working apps — lives at portfolio.shreyas.space.
      </p>
    </section>
  )
}

/* ───────────────────────────── Detail view ────────────────────────── */

function buildDetail(d, detail, projects, hacks) {
  if (!detail) return null

  if (detail.kind === 'experience') {
    const e = (d.experience || []).find(x => x.id === detail.id)
    if (!e) return null
    const secs = e.detailContent ? e.detailContent.sections : []
    return {
      kicker: e.company,
      title: e.role,
      hook: e.summary || '',
      accent: accentFor(e.id),
      role: '',
      story: buildStory(secs),
      facts: [
        { label: 'Timeframe', value: e.start + ' – ' + e.end },
        { label: 'Location', value: e.location },
      ].filter(f => f.value),
      refs: [
        e.lab && { label: 'Lab', name: e.lab.name, url: e.lab.url },
        e.advisor && { label: 'Advisor', name: e.advisor.name, url: e.advisor.url },
        e.manager && { label: 'Manager', name: e.manager.name, url: e.manager.url },
      ].filter(Boolean),
      awards: [],
      metrics: [],
      chips: [],
      collaborators: [],
      links: [e.links?.repo && { href: e.links.repo, label: 'View code →' }].filter(Boolean),
      posts: e.linkedinPosts || [],
      stamp: null,
      highlights: secs.length ? [] : e.grounded || [],
    }
  }

  const p = [...projects, ...hacks].find(x => x.id === detail.id)
  if (!p) return null
  const secs = p.detailContent ? p.detailContent.sections : []
  return {
    kicker: kickerFor(p),
    title: p.name,
    hook: p.homepage?.tagline || '',
    accent: accentFor(p.id),
    role: p.role || '',
    story: buildStory(secs),
    facts: [
      { label: 'Timeframe', value: p.timeframe },
      { label: 'Status', value: p.status },
      { label: 'Event', value: p.event },
      { label: 'Where', value: p.location },
    ].filter(f => f.value),
    refs: [],
    awards: p.awards || [],
    metrics: numMetrics(p).slice(0, 4),
    chips: p.techStack || [],
    collaborators: (p.collaborators || []).map(c => ({ initials: initials(c.name), name: c.name })),
    links: [
      p.links?.product && { href: p.links.product, label: 'Visit product →' },
      p.links?.repo && { href: p.links.repo, label: 'View code →' },
    ].filter(Boolean),
    posts: p.linkedinPosts || [],
    stamp: awardStamp(p),
    highlights: [],
  }
}

function DetailView({ detail, onBack }) {
  const { story } = detail
  const hasAside =
    detail.stamp || detail.facts.length || detail.refs.length || detail.awards.length ||
    detail.metrics.length || detail.chips.length || detail.collaborators.length ||
    detail.links.length || detail.posts.length

  return (
    <article className="mag-detail">
      <button className="mag-backbtn" onClick={onBack}>← Back</button>

      <div className="mag-detail-head" style={{ borderLeftColor: detail.accent }}>
        <span className="mag-card-kicker">{detail.kicker}</span>
        <h2 className="mag-detail-title">{detail.title}</h2>
        <p className="mag-detail-hook">{detail.hook}</p>
      </div>

      {detail.role && <p className="mag-detail-role">{detail.role}</p>}

      {!story.empty && (
        <>
          <h3 className="mag-detail-h">{story.leadHeading}</h3>
          <p className="mag-detail-p">
            <span className="mag-dropcap">{story.leadChar}</span>{story.leadRest}
          </p>
          {story.leadExtra.map((para, i) => <p key={i} className="mag-detail-p">{para}</p>)}
          {story.rest.map((sec, i) => (
            <React.Fragment key={i}>
              <h3 className="mag-detail-h">{sec.heading}</h3>
              {sec.body.map((para, j) => <p key={j} className="mag-detail-p">{para}</p>)}
            </React.Fragment>
          ))}
        </>
      )}

      {detail.highlights.length > 0 && (
        <>
          <h3 className="mag-detail-h">Highlights</h3>
          <ul className="mag-bullets">
            {detail.highlights.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </>
      )}

      {hasAside && (
        <aside className="mag-aside">
          <Stamp text={detail.stamp} size="aside" />
          {detail.facts.map((f, i) => (
            <div key={i} className="mag-aside-row">
              <div className="mag-aside-l">{f.label}</div>
              <div className="mag-aside-v">{f.value}</div>
            </div>
          ))}
          {detail.refs.map((r, i) => (
            <div key={i} className="mag-aside-row">
              <span className="mag-aside-l">{r.label}</span>
              {r.url
                ? <a className="mag-aside-link" href={r.url} target="_blank" rel="noreferrer">{r.name} ↗</a>
                : <div className="mag-aside-v">{r.name}</div>}
            </div>
          ))}
          {detail.awards.length > 0 && (
            <div className="mag-aside-block">
              <div className="mag-aside-l">Recognition</div>
              {detail.awards.map((a, i) => <div key={i} className="mag-award">★ {a}</div>)}
            </div>
          )}
          {detail.metrics.length > 0 && (
            <div className="mag-aside-block">
              <Metrics list={detail.metrics} />
            </div>
          )}
          {detail.chips.length > 0 && (
            <div className="mag-aside-block">
              <div className="mag-aside-l">Built with</div>
              <Chips list={detail.chips} />
            </div>
          )}
          {detail.collaborators.length > 0 && (
            <div className="mag-aside-block">
              <div className="mag-aside-l">Team</div>
              <div className="mag-team">
                {detail.collaborators.map((c, i) => (
                  <span key={i} className="mag-team-row">
                    <span className="mag-avatar">{c.initials}</span>{c.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(detail.links.length > 0 || detail.posts.length > 0) && (
            <div className="mag-aside-actions">
              {detail.links.map((l, i) => (
                <a key={i} className="mag-aside-btn" href={l.href} target="_blank" rel="noreferrer">{l.label}</a>
              ))}
              {detail.posts.map((href, i) => (
                <a key={i} className="mag-aside-btn mag-aside-btn--ghost" href={href} target="_blank" rel="noreferrer">LinkedIn ↗</a>
              ))}
            </div>
          )}
        </aside>
      )}
    </article>
  )
}

/* ─────────────────────────── small shared bits ────────────────────── */

function Metrics({ list }) {
  if (!list || !list.length) return null
  return (
    <div className="mag-metrics">
      {list.map((m, i) => (
        <div key={i} className="mag-metric">
          <div className="mag-metric-n">{m.n}</div>
          <div className="mag-metric-l">{m.l}</div>
        </div>
      ))}
    </div>
  )
}

function Chips({ list }) {
  if (!list || !list.length) return null
  return (
    <ul className="mag-chiprow">
      {list.map(c => <li key={c}>{c}</li>)}
    </ul>
  )
}

function Stamp({ text, size }) {
  if (!text) return null
  return <span className={'mag-stamp mag-stamp--' + size}>{text}</span>
}
