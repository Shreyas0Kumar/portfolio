import React, { useState, useLayoutEffect, useEffect, useCallback } from 'react'
import './TourOverlay.css'

/**
 * TourOverlay
 * First-visit guided tour of the desktop. Dims everything, cuts a spotlight
 * hole around the feature being introduced, and floats a small card beside it.
 * Fully skippable — Esc or "Skip tour" at any point; ← → / Enter to step.
 *
 * Steps target live DOM (by selector) so the highlight always lands on the
 * real element; a step whose target is missing falls back to a centered card.
 *
 * Props:
 *   onClose {function} — fired on skip or finish (Desktop marks the tour seen)
 */

const STEPS = [
  {
    center: true,
    title: 'Welcome in.',
    body: 'This portfolio is a working Mac desktop. Nothing here is a screenshot. Take the 60-second tour, or skip and just start clicking.',
  },
  {
    target: '.dock',
    placement: 'top',
    pad: 10,
    title: 'Real apps.',
    body: 'Portfolio holds my projects with tap-through case studies, Glassdoor my honest interview write-ups. And Mail actually sends, straight to my inbox.',
  },
  {
    target: '.desktop-icons',
    placement: 'left',
    pad: 8,
    title: 'Live documents.',
    body: 'Double-click Resume or Certificates: real files, streamed from Google Drive into an in-app Quick Look.',
  },
  {
    target: '[data-tour="spotlight"]',
    placement: 'bottom',
    pad: 6,
    title: 'Spotlight works.',
    body: 'Press ⌘ / Ctrl + Space anywhere, or click the magnifier, to search every app and project.',
  },
  {
    target: '.dock-item[aria-label="Terminal"]',
    placement: 'top',
    pad: 8,
    title: 'For the keyboard people.',
    body: 'Open Terminal and type help. The shell answers with the real story. Photo Booth, Calculator and the arcade are in the dock too.',
  },
  {
    center: true,
    title: 'Have fun poking around.',
    body: 'Right-click the desktop for wallpapers and this tour again. When you’re done, the Apple menu shuts the Mac down and returns you to the room.',
  },
]

const CARD_W = 330
const GAP = 16 // between the highlight ring and the card

export default function TourOverlay({ onClose }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)
  const s = STEPS[step]
  const last = step === STEPS.length - 1

  const next = useCallback(() => (last ? onClose() : setStep(i => i + 1)), [last, onClose])
  const back = useCallback(() => setStep(i => Math.max(0, i - 1)), [])

  // Measure the step's target (and re-measure on resize). A missing, hidden,
  // or off-screen target (e.g. the dock auto-hidden under a maximized window)
  // degrades to the centered card instead of highlighting empty space.
  useLayoutEffect(() => {
    const measure = () => {
      if (s.center || !s.target) { setRect(null); return }
      const el = document.querySelector(s.target)
      if (!el) { setRect(null); return }
      const r = el.getBoundingClientRect()
      const offscreen =
        r.width === 0 || r.height === 0 ||
        r.bottom < 0 || r.top > window.innerHeight ||
        r.right < 0 || r.left > window.innerWidth
      if (offscreen) { setRect(null); return }
      const pad = s.pad ?? 8
      setRect({ x: r.left - pad, y: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [s])

  // Keyboard: → / Enter advance, ← goes back, Esc skips out. Enter on a
  // focused tour button (Skip / Back, via Tab) activates that button instead.
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (e.key === 'Enter' && document.activeElement?.closest?.('.tour-card')) return
        e.preventDefault(); next()
      }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); back() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, back, onClose])

  // Card position: beside the highlight per the step's placement, clamped to
  // the viewport; centered when there's no target. Width lives here (not in
  // the CSS) so the clamping math can never drift from the rendered size.
  const cardStyle = (() => {
    if (!rect) return { width: CARD_W, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
    const vw = window.innerWidth
    const vh = window.innerHeight
    const cx = rect.x + rect.w / 2
    const clampX = x => Math.max(12, Math.min(x, vw - CARD_W - 12))
    const clampY = y => Math.min(y, vh - 260) // keep room for the card below its anchor
    switch (s.placement) {
      case 'top':
        return { width: CARD_W, left: clampX(cx - CARD_W / 2), bottom: vh - rect.y + GAP }
      case 'bottom':
        return { width: CARD_W, left: clampX(cx - CARD_W / 2), top: rect.y + rect.h + GAP }
      case 'left':
        return { width: CARD_W, left: Math.max(12, rect.x - CARD_W - GAP), top: clampY(rect.y) }
      default: // right
        return { width: CARD_W, left: clampX(rect.x + rect.w + GAP), top: clampY(rect.y) }
    }
  })()

  return (
    <div className="tour">
      {/* Dim layer — with a target it's a cutout ring whose giant box-shadow
          darkens everything else; without one it's a plain wash. */}
      {rect ? (
        <div
          className="tour-hole"
          style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
        />
      ) : (
        <div className="tour-wash" />
      )}

      <div className={`tour-card${rect ? '' : ' centered'}`} style={cardStyle}>
        <div className="tour-kicker">
          <span>Quick tour</span>
          <span className="tour-count">{step + 1} / {STEPS.length}</span>
        </div>
        <h3 className="tour-title">{s.title}</h3>
        <p className="tour-body">{s.body}</p>

        <div className="tour-footer">
          <button type="button" className="tour-skip" onClick={onClose}>
            Skip tour
          </button>
          <div className="tour-dots" aria-hidden="true">
            {STEPS.map((_, i) => (
              <span key={i} className={`tour-dot${i === step ? ' on' : ''}`} />
            ))}
          </div>
          <div className="tour-nav">
            {step > 0 && (
              <button type="button" className="tour-btn ghost" onClick={back}>
                Back
              </button>
            )}
            <button type="button" className="tour-btn" onClick={next} autoFocus>
              {last ? 'Start exploring' : step === 0 ? 'Show me' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
