import React, { useState, useMemo } from 'react'
import { usePortfolio } from '../../../../data/portfolio.jsx'
import './InterviewsTab.css'

/**
 * InterviewsTab
 * Editorial "newspaper" rendition of interview reviews, driven by
 * public/portfolio.json (interviews.items). Matches PortfolioApp's warm
 * paper system (Caveat signature name, Montserrat headlines + labels +
 * body, espresso ink on cream with a #c8782a orange): a sticky
 * masthead, a four-up stats strip, and expandable company "articles" that open
 * into a two-column read (story + a sticky facts sidebar).
 *
 * Entries flagged `ongoing: true` (e.g. an in-process loop) are blurred and
 * locked — the outcome isn't known yet, so there's nothing honest to show.
 */

const DIFFICULTY_CLASS = { Easy: 'easy', Medium: 'med', Hard: 'hard' }
const OUTCOME_CLASS = { Offer: 'offer', 'In process': 'process', Waitlisted: 'wait' }
const outcomeClass = o => OUTCOME_CLASS[o] || 'neutral'

function Stars({ rating }) {
  return (
    <span className="iv-stars" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={`iv-star${n <= rating ? ' on' : ''}`}>★</span>
      ))}
    </span>
  )
}

export default function InterviewsTab() {
  const { interviews } = usePortfolio()
  const items = useMemo(
    () => [...(interviews?.items || [])].sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
    [interviews]
  )
  const [openId, setOpenId] = useState(null)

  const summary = useMemo(() => {
    const total = items.length
    const rated = items.filter(i => typeof i.rating === 'number')
    const avg = rated.length
      ? (rated.reduce((s, i) => s + i.rating, 0) / rated.length).toFixed(1)
      : '–'
    const offers = items.filter(i => i.outcome === 'Offer').length
    const inProcess = items.filter(i => i.ongoing || i.outcome === 'In process').length
    return { total, avg, offers, inProcess }
  }, [items])

  const year = new Date().getFullYear()

  if (items.length === 0) {
    return (
      <div className="iv">
        <p className="iv-empty">No interview reviews yet.</p>
      </div>
    )
  }

  return (
    <div className="iv">
      {/* ===== MASTHEAD ===== */}
      <header className="iv-mast">
        <div className="iv-mast-top">
          <span>The Interviews &nbsp;·&nbsp; Issue No.&thinsp;01 · {year}</span>
          <span className="iv-mast-status">
            <i className="iv-status-dot" /> {summary.total} reviews on file
          </span>
        </div>
        <div className="iv-mast-main">
          <h1 className="iv-mast-name">Interview Reviews</h1>
          <div className="iv-mast-roleblock">
            <div className="iv-mast-role">Process · Questions · Takeaway</div>
            <p className="iv-mast-tag">
              Honest accounts of every loop I've been through: what they asked,
              how it went, and what I'd do differently.
            </p>
          </div>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <div className="iv-content">
        <p className="iv-eyebrow">No.01 · Reviews</p>

        {/* Stats strip */}
        <div className="iv-stats">
          <div className="iv-stat">
            <div className="iv-stat-n">{summary.total}</div>
            <div className="iv-stat-l">Total interviews</div>
          </div>
          <div className="iv-stat">
            <div className="iv-stat-n">{summary.avg}★</div>
            <div className="iv-stat-l">Avg experience</div>
          </div>
          <div className="iv-stat">
            <div className="iv-stat-n">{summary.offers}</div>
            <div className="iv-stat-l">Offers received</div>
          </div>
          <div className="iv-stat">
            <div className="iv-stat-n">{summary.inProcess}</div>
            <div className="iv-stat-l">In process</div>
          </div>
        </div>

        <h2 className="iv-sectitle">Every loop, told honestly.</h2>

        <div className="iv-list">
          {items.map(iv => {
            // Ongoing loops are locked: no outcome to report yet.
            if (iv.ongoing) return <LockedCard key={iv.id} iv={iv} />
            const open = openId === iv.id
            return (
              <Card
                key={iv.id}
                iv={iv}
                open={open}
                onToggle={() => setOpenId(open ? null : iv.id)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── Regular card ───────────────────────── */

function Card({ iv, open, onToggle }) {
  const meta = [iv.location, iv.when].filter(Boolean).join(' · ')
  const rounds = iv.rounds || []
  const questions = iv.questionsAsked || []
  const sections = iv.detailContent?.sections || []

  return (
    <div className={`iv-card${open ? ' open' : ''}`}>
      <button
        type="button"
        className="iv-cardhead"
        onClick={onToggle}
        aria-expanded={open}
      >
        <div className="iv-cardmain">
          {meta && <span className="iv-kicker">{meta}</span>}
          <span className="iv-company">{iv.company}</span>
          <span className="iv-role">{iv.role}</span>
        </div>
        <div className="iv-cardside">
          {typeof iv.rating === 'number' && <Stars rating={iv.rating} />}
          <div className="iv-badges">
            {iv.difficulty && (
              <span className={`iv-badge diff ${DIFFICULTY_CLASS[iv.difficulty] || 'med'}`}>
                {iv.difficulty}
              </span>
            )}
            {iv.outcome && (
              <span className={`iv-badge outcome ${outcomeClass(iv.outcome)}`}>
                {iv.outcome}
              </span>
            )}
          </div>
          <span className="iv-chevron" aria-hidden="true">{open ? '▾' : '▸'}</span>
        </div>
      </button>

      {open && (
        <div className="iv-detail">
          <div className="iv-detail-grid">
            {/* Story column */}
            <div className="iv-story">
              {rounds.length > 0 && (
                <section className="iv-block">
                  <h3 className="iv-block-label">The process</h3>
                  <ol className="iv-rounds">
                    {rounds.map((r, idx) => (
                      <li key={idx} className="iv-round">
                        <span className="iv-round-name">
                          {r.stage}{r.date ? ` · ${r.date}` : ''}
                        </span>
                        {r.description && <span className="iv-round-detail">{r.description}</span>}
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {questions.length > 0 && (
                <section className="iv-block">
                  <h3 className="iv-block-label">Questions they asked</h3>
                  <ul className="iv-questions">
                    {questions.map((q, idx) => (
                      <li key={idx} className="iv-question">{q}</li>
                    ))}
                  </ul>
                </section>
              )}

              {iv.takeaway && (
                <section className="iv-block">
                  <h3 className="iv-block-label">Takeaway</h3>
                  <blockquote className="iv-takeaway">
                    <span className="iv-quote" aria-hidden="true">“</span>{iv.takeaway}
                  </blockquote>
                </section>
              )}

              {sections.length > 0 && (
                <section className="iv-block">
                  <h3 className="iv-block-label">The full story</h3>
                  {sections.map((s, idx) => (
                    <div key={idx} className="iv-storysec">
                      <h4 className="iv-story-head">{s.heading}</h4>
                      {s.body.map((para, j) => <p key={j} className="iv-story-text">{para}</p>)}
                    </div>
                  ))}
                </section>
              )}
            </div>

            {/* Facts sidebar */}
            <aside className="iv-aside">
              <Fact label="When" value={iv.when} />
              <Fact label="Location" value={iv.location} />
              <Fact label="Difficulty" value={iv.difficulty} />
              <Fact label="Outcome" value={iv.outcome} />
              <div className="iv-fact iv-fact--rating">
                <div className="iv-aside-label">Experience rating</div>
                <div className="iv-rating-big">
                  {typeof iv.rating === 'number' ? `${iv.rating}★` : '–'}
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  )
}

function Fact({ label, value }) {
  if (!value) return null
  return (
    <div className="iv-fact">
      <div className="iv-aside-label">{label}</div>
      <div className="iv-fact-val">{value}</div>
    </div>
  )
}

/* ───────────────────────── Locked / ongoing card ───────────────────────── */

function LockedCard({ iv }) {
  const meta = [iv.location, iv.when].filter(Boolean).join(' · ')
  return (
    <div className="iv-card locked">
      <div className="iv-locked-inner">
        <div className="iv-blur" aria-hidden="true">
          {meta && <span className="iv-kicker">{meta}</span>}
          <span className="iv-company">{iv.company}</span>
          <span className="iv-role">{iv.role}</span>
        </div>
        <div className="iv-lockoverlay">
          <span className="iv-lock">🔒</span>
          <span className="iv-locktext">Still in process. I'll write this one up once it wraps.</span>
        </div>
        {iv.outcome && (
          <span className={`iv-badge outcome ${outcomeClass(iv.outcome)} iv-locked-badge`}>
            {iv.outcome}
          </span>
        )}
      </div>
    </div>
  )
}
