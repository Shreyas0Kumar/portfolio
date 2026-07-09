import React, { useEffect, useRef, useState } from 'react'
import './SwipeTour.css'

/**
 * SwipeTour — a one-time, ~4.6s demo that shows the mobile edition is
 * swipe-navigable. The live page zooms out into a minimal phone frame, a
 * fingertip dot performs the swipes while the *real* scroll-snap pager flips
 * through sections underneath, swipes back home, then the frame falls away
 * and the page zooms back to full size.
 *
 * Self-contained: delete this file + SwipeTour.css and the <SwipeTour/> block
 * in MobilePortfolio.jsx to remove the feature entirely.
 *
 * Props:
 *   magRef  {ref}      — the `.mag` page element to scale in/out
 *   onSwipe {function} — (pageIndex) => scroll the real pager to that section
 *   onDone  {function} — tour finished or skipped; parent unmounts us
 */

const TOUR_KEY = 'shreyas-mobile-swipe-tour-seen'
const SCALE = 0.62    // single source of truth — fed to the CSS via --stour-scale
const GAP = 13        // px between the scaled page edge and the frame border
const LEAVE_MS = 720  // exit budget: covers the 0.68s zoom-back + 0.5s frame drop in the CSS

// Gate: first visit only (localStorage), and never for reduced-motion users —
// they go straight to the interactive page.
export function shouldRunSwipeTour() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
  try { return localStorage.getItem(TOUR_KEY) !== '1' } catch { return false }
}

export default function SwipeTour({ magRef, onSwipe, onDone }) {
  const [frame, setFrame] = useState(null) // { w, h } px, measured from the page
  const [dot, setDot] = useState({ o: 0, x: 0, t: 'none' })
  const [leaving, setLeaving] = useState(false)
  const timers = useRef([])
  const phaseRef = useRef('running') // 'running' | 'interrupted' | 'done'

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  // Give the page back mid-exit: un-shrink and clear `inert` so it's fully
  // interactive again while the zoom-back plays (.stour-anim stays on to
  // carry that transition until release()).
  const restorePage = () => {
    const mag = magRef.current
    if (!mag) return
    mag.classList.remove('stour-shrink')
    mag.removeAttribute('inert')
  }

  // Final teardown: drop everything of ours off the page and unmount. Only
  // safe once the zoom-back has finished — removing .stour-anim (the class
  // carrying the transition) mid-flight would snap the page to full scale.
  const release = () => {
    if (phaseRef.current === 'done') return
    phaseRef.current = 'done'
    clearTimers()
    const mag = magRef.current
    if (mag) {
      mag.classList.remove('stour-anim', 'stour-shrink')
      mag.removeAttribute('inert')
      mag.style.removeProperty('--stour-scale')
    }
    onDone()
  }

  // A tap or swipe anywhere ends the tour early: glide home, zoom back in,
  // and release. The overlay goes pointer-transparent immediately (leaving),
  // so the page is interactive again while the exit transition plays out.
  const interrupt = () => {
    if (phaseRef.current !== 'running') return
    phaseRef.current = 'interrupted'
    clearTimers()
    restorePage()
    setLeaving(true)
    setDot(d => ({ ...d, o: 0, t: 'opacity .12s ease' }))
    onSwipe(0)
    timers.current.push(setTimeout(release, LEAVE_MS))
  }

  useEffect(() => {
    const mag = magRef.current
    if (!mag) { onDone(); return undefined }

    // Mark seen up front so a mid-tour tab close still never replays it.
    try { localStorage.setItem(TOUR_KEY, '1') } catch { /* ignore */ }

    // Size the frame around where the page will sit once scaled (scale is
    // about the center, so the frame just centers over the viewport too).
    const r = mag.getBoundingClientRect()
    setFrame({
      w: Math.round(r.width * SCALE) + GAP * 2,
      h: Math.round(r.height * SCALE) + GAP * 2,
    })
    const travel = Math.round(r.width * SCALE * 0.3) // dot sweep, each side of center

    // .stour-anim carries the transition so the zoom-back still animates when
    // .stour-shrink is removed; the shrink itself starts a beat after mount so
    // the first paint is at full scale and the transition actually plays.
    // `inert` keeps the page unfocusable (keyboard / assistive tech) while the
    // overlay owns input; the CSS var feeds SCALE to .mag.stour-shrink.
    mag.classList.add('stour-anim')
    mag.setAttribute('inert', '')
    mag.style.setProperty('--stour-scale', String(SCALE))

    const at = (ms, fn) => timers.current.push(setTimeout(fn, ms))
    const appear = { o: 1, t: 'opacity .18s ease' }
    const vanish = { o: 0, t: 'opacity .16s ease' }
    const swipe = 'transform .5s cubic-bezier(.45,.05,.2,1)'

    /* One continuous timeline, ~4.6s total. Dot swipes lead the page scroll
       by a few frames so the motion reads as finger-driven. */
    at(80, () => mag.classList.add('stour-shrink'))            // zoom out into the frame
    at(850, () => setDot({ ...appear, x: travel }))            // fingertip lands, right side
    at(1100, () => setDot({ o: 1, x: -travel, t: swipe }))     // swipe 1 →
    at(1160, () => onSwipe(1))
    at(1620, () => setDot({ ...vanish, x: -travel }))
    at(1800, () => setDot({ o: 0, x: travel, t: 'none' }))     // reset to the right edge
    at(1860, () => setDot({ ...appear, x: travel }))
    at(2080, () => setDot({ o: 1, x: -travel, t: swipe }))     // swipe 2 →
    at(2140, () => onSwipe(2))
    at(2600, () => setDot({ ...vanish, x: -travel }))
    at(2780, () => setDot({ ...appear, x: -travel }))          // re-enter from the left
    at(3000, () => setDot({ o: 1, x: travel, t: 'transform .62s cubic-bezier(.45,.05,.2,1)' }))
    at(3060, () => onSwipe(0))                                 // ← long swipe back home
    at(3660, () => setDot({ ...vanish, x: travel }))
    at(3840, () => {                                           // frame falls away, zoom back in
      restorePage()
      setLeaving(true)
    })
    at(3840 + LEAVE_MS, release)

    // A real viewport change mid-tour (rotation, split-screen) would desync
    // the frame — end gracefully. Only react to width: mobile browsers also
    // fire resize for URL-bar / keyboard changes, which only move height and
    // shouldn't cancel a one-time tour.
    const w0 = window.innerWidth
    const onResize = () => { if (Math.abs(window.innerWidth - w0) > 40) interrupt() }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      clearTimers()
      mag.classList.remove('stour-anim', 'stour-shrink')
      mag.removeAttribute('inert')
      mag.style.removeProperty('--stour-scale')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={'stour' + (leaving ? ' stour--leave' : '')}
      onPointerDown={interrupt}
      role="presentation"
      aria-hidden="true"
    >
      {frame && (
        <>
          <div className="stour-frame" style={{ width: frame.w, height: frame.h }}>
            <span
              className="stour-dot"
              style={{ opacity: dot.o, transform: `translateX(${dot.x}px)`, transition: dot.t }}
            />
          </div>
          <div className="stour-caption" style={{ top: `calc(50% + ${frame.h / 2 + 18}px)` }}>
            <span className="stour-caption-main">Swipe sideways to flip sections</span>
            <span className="stour-caption-sub">tap anywhere to skip</span>
          </div>
        </>
      )}
    </div>
  )
}
