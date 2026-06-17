import React, { useState, useMemo } from 'react'
import { usePortfolio } from '../../../../data/portfolio.jsx'
import './InterviewsTab.css'

/**
 * InterviewsTab
 * Glassdoor-style interview reviews driven by public/portfolio.json
 * (interviews.items). A summary strip plus expandable company cards (rounds,
 * questions, takeaway, and the full story when an entry has detailContent).
 *
 * Entries flagged `ongoing: true` (e.g. an in-process loop) are blurred and
 * locked — the outcome isn't known yet, so there's nothing honest to show.
 */

const DIFFICULTY_CLASS = { Easy: 'easy', Medium: 'med', Hard: 'hard' }
const POSITIVE_OUTCOMES = ['Offer']

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
      : '—'
    const inProcess = items.filter(i => i.ongoing || i.outcome === 'In process').length
    return { total, avg, inProcess }
  }, [items])

  if (items.length === 0) {
    return (
      <div className="iv">
        <p className="iv-empty">No interview reviews yet.</p>
      </div>
    )
  }

  return (
    <div className="iv">
      <header className="iv-head">
        <h1 className="iv-title">Interview Reviews</h1>
        <p className="iv-sub">
          Honest write-ups of interviews I've been through — process, questions, and what I took away.
        </p>
        <div className="iv-summary">
          <div className="iv-stat">
            <span className="iv-stat-num">{summary.total}</span>
            <span className="iv-stat-label">interviews</span>
          </div>
          <div className="iv-stat">
            <span className="iv-stat-num">{summary.avg}★</span>
            <span className="iv-stat-label">avg experience</span>
          </div>
          <div className="iv-stat">
            <span className="iv-stat-num">{summary.inProcess}</span>
            <span className="iv-stat-label">in process</span>
          </div>
        </div>
      </header>

      <ul className="iv-list">
        {items.map(iv => {
          // Ongoing loops are locked: no outcome to report yet.
          if (iv.ongoing) return <LockedCard key={iv.id} iv={iv} />

          const open = openId === iv.id
          const meta = [iv.location, iv.when].filter(Boolean).join(' · ')
          const sections = iv.detailContent?.sections || []
          return (
            <li key={iv.id} className={`iv-card${open ? ' open' : ''}`}>
              <button
                type="button"
                className="iv-cardhead"
                onClick={() => setOpenId(open ? null : iv.id)}
                aria-expanded={open}
              >
                <div className="iv-cardmain">
                  <span className="iv-company">{iv.company}</span>
                  <span className="iv-role">{iv.role}</span>
                  {meta && <span className="iv-meta">{meta}</span>}
                </div>
                <div className="iv-cardside">
                  {typeof iv.rating === 'number' && <Stars rating={iv.rating} />}
                  <div className="iv-badges">
                    {iv.difficulty && (
                      <span className={`iv-badge diff ${DIFFICULTY_CLASS[iv.difficulty] || 'med'}`}>
                        {iv.difficulty}
                      </span>
                    )}
                    <span className={`iv-badge outcome${POSITIVE_OUTCOMES.includes(iv.outcome) ? ' good' : ''}`}>
                      {iv.outcome}
                    </span>
                  </div>
                  <span className="iv-chevron" aria-hidden="true">{open ? '▾' : '▸'}</span>
                </div>
              </button>

              {open && (
                <div className="iv-detail">
                  {iv.rounds?.length > 0 && (
                    <section className="iv-block">
                      <h3 className="iv-block-label">The process</h3>
                      <ol className="iv-rounds">
                        {iv.rounds.map((r, idx) => (
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

                  {iv.questionsAsked?.length > 0 && (
                    <section className="iv-block">
                      <h3 className="iv-block-label">Questions they asked</h3>
                      <ul className="iv-questions">
                        {iv.questionsAsked.map((q, idx) => (
                          <li key={idx} className="iv-question">{q}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {iv.takeaway && (
                    <section className="iv-block">
                      <h3 className="iv-block-label">Takeaway</h3>
                      <p className="iv-takeaway">“{iv.takeaway}”</p>
                    </section>
                  )}

                  {sections.length > 0 && (
                    <section className="iv-block">
                      <h3 className="iv-block-label">The full story</h3>
                      {sections.map((s, idx) => (
                        <div key={idx} className="iv-story">
                          <h4 className="iv-story-head">{s.heading}</h4>
                          {s.body.map((para, j) => <p key={j} className="iv-story-text">{para}</p>)}
                        </div>
                      ))}
                    </section>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* A blurred, non-expandable card for interviews still in process. */
function LockedCard({ iv }) {
  const meta = [iv.location, iv.when].filter(Boolean).join(' · ')
  return (
    <li className="iv-card locked">
      <div className="iv-cardhead" aria-disabled="true">
        <div className="iv-cardmain iv-blur">
          <span className="iv-company">{iv.company}</span>
          <span className="iv-role">{iv.role}</span>
          {meta && <span className="iv-meta">{meta}</span>}
        </div>
        <div className="iv-cardside">
          <span className="iv-badge outcome process">In process</span>
        </div>
      </div>
      <div className="iv-lockoverlay">
        <span className="iv-lock">🔒</span>
        <span className="iv-locktext">Still in process — I'll write this one up once it wraps.</span>
      </div>
    </li>
  )
}
